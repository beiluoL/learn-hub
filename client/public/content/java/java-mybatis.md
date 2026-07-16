---
title: MyBatis 原理与实战：动态 SQL、缓存与整合 Spring
category: java
level: intermediate
readMinutes: 18
tags: "MyBatis, 动态SQL, 缓存, ORM"
summary: 从执行流程、动态 SQL 到一级/二级缓存与 Spring 整合。
order: 33
prereq: java/java-spring
---

# MyBatis 原理与实战：动态 SQL、缓存与整合 Spring

MyBatis 是一款优秀的半自动化 ORM（Object Relational Mapping，对象关系映射）框架。它既保留了 SQL 的灵活性，又帮我们屏蔽了 JDBC 里繁琐的样板代码（加载驱动、创建连接、预编译、手动封装结果集）。

## 一、ORM 思想与 MyBatis 的定位

**ORM** 的目标是让 Java 对象和数据库表互相映射：对象的属性对应表的字段，对象的操作对应表的增删改查。Hibernate 是“全自动”ORM，几乎不用写 SQL；而 MyBatis 是“半自动”，SQL 由开发者编写并维护在 XML 或注解中，框架只负责参数绑定和结果映射。这让复杂查询、性能优化更可控。

## 二、#{} 与 ${} 的区别（安全关键）

**#{}**：预编译占位符，MyBatis 会将其替换为 `?`，通过 `PreparedStatement` 设置参数，**能有效防止 SQL 注入**，还能自动处理类型转换与引号包裹。绝大多数场景都应使用它。

**${}**：字符串直接拼接，把参数原样拼进 SQL。它存在 SQL 注入风险，**只适用于那些无法用占位符的地方**，比如动态表名、动态排序字段（列名不能做占位符）。

```xml
<!-- 安全：#{} 预编译 -->
<select id="selectById" resultType="User">
    SELECT * FROM user WHERE id = #{id}
</select>

<!-- 危险：仅当 orderBy 来自可信来源时才用 ${} -->
<select id="selectOrder" resultType="User">
    SELECT * FROM user ORDER BY ${column} ${direction}
</select>
```

## 三、核心执行流程

**SqlSessionFactory**：重量级工厂，全局唯一，负责创建 `SqlSession`。

**SqlSession**：代表一次与数据库会话，类似 JDBC 的 `Connection`，提供了 `selectOne`、`insert` 等方法。

**Executor**：SqlSession 内部真正执行 SQL 的执行器，负责缓存管理和 JDBC 交互。

**Mapper 代理**：MyBatis 会为每一个 Mapper 接口生成动态代理实现类，调用接口方法时，代理根据方法名 + 注解 / XML 找到对应的 SQL 并执行。开发者从不需要写接口的实现类。

## 四、动态 SQL

动态 SQL 是 MyBatis 的杀手锏，用标签按需拼接条件，避免手写大量 `WHERE 1=1` 和字符串拼接。

```xml
<select id="search" parameterType="map" resultType="User">
    SELECT * FROM user
    <where>
        <if test="name != null">
            AND name LIKE CONCAT('%', #{name}, '%')
        </if>
        <if test="age != null">
            AND age &gt;= #{age}
        </if>
    </where>
    <choose>
        <when test="sort == 'age'">ORDER BY age DESC</when>
        <otherwise>ORDER BY id</otherwise>
    </choose>
</select>

<!-- 批量插入：foreach 遍历集合 -->
<insert id="batchInsert">
    INSERT INTO user(name, age) VALUES
    <foreach collection="list" item="u" separator=",">
        (#{u.name}, #{u.age})
    </foreach>
</insert>
```

- `<if>`：条件成立才拼接。
- `<choose>/<when>/<otherwise>`：类似 Java 的 switch。
- `<foreach>`：遍历集合，常用于 IN 查询、批量操作。
- `<trim>`：可自定义前缀、后缀、去除多余逗号或 AND/OR。

## 五、ResultMap 映射

当数据库字段（如 `user_name`）与 Java 属性（`userName`）命名不一致时，用 `ResultMap` 显式映射，比 `resultType` 更强大，还能处理一对一、一对多关联。

```xml
<resultMap id="userMap" type="User">
    <id column="id" property="id"/>
    <result column="user_name" property="userName"/>
    <result column="create_time" property="createTime"/>
</resultMap>

<select id="selectAll" resultMap="userMap">
    SELECT id, user_name, create_time FROM user
</select>
```

## 六、一级缓存与二级缓存

**一级缓存（SqlSession 级）**：默认开启，同一个 `SqlSession` 内，执行相同查询会命中缓存，第二次直接返回。一旦执行了 `update/insert/delete` 或手动 `clearCache()`，一级缓存失效。生命周期随 SqlSession 关闭而结束。

**二级缓存（Mapper 级 / namespace 级）**：需要手动开启（`<cache/>`），跨 SqlSession 共享，作用范围是同一个 Mapper 的 namespace。注意：二级缓存要求**缓存的对象必须实现 `Serializable` 接口**（因为可能序列化到磁盘或分布式缓存），且数据在事务提交后才写入。对于多表关联、强一致性要求的场景，二级缓存容易读到脏数据，使用要谨慎。

## 七、与 Spring 整合

整合核心是两个类：`SqlSessionFactoryBean` 创建工厂，`MapperScannerConfigurer`（或 `@MapperScan`）批量扫描 Mapper 接口并注册为 Bean。

```java
@Configuration
@MapperScan("com.example.mapper")   // 扫描 Mapper 接口，自动生成代理 Bean
public class MyBatisConfig {

    @Bean
    public SqlSessionFactoryBean sqlSessionFactory(DataSource dataSource) {
        SqlSessionFactoryBean factory = new SqlSessionFactoryBean();
        factory.setDataSource(dataSource);
        // 指定 XML 映射文件位置
        factory.setMapperLocations(
            new PathMatchingResourcePatternResolver()
                .getResources("classpath:mapper/*.xml"));
        return factory;
    }
}
```

pom 中引入 starter 即可：

```xml
<dependency>
    <groupId>org.mybatis.spring.boot</groupId>
    <artifactId>mybatis-spring-boot-starter</artifactId>
    <version>3.0.3</version>
</dependency>
```

之后直接在 Service 中注入 Mapper 接口使用：

```java
@Service
public class UserService {
    @Autowired
    private UserMapper userMapper;

    public Page<User> page(int page, int size) {
        // 分页 + 批量插入示例
        List<User> list = userMapper.search(null, 18);
        userMapper.batchInsert(buildUsers());
        return new Page<>(list, page, size);
    }
}
```

## 实际开发中的应用 / 常见问题

**问题 1：明明改了数据却查到旧值？** 可能是误用了二级缓存，或一级缓存未失效。可通过 `flushCache` 配置或避免跨 SqlSession 共用缓存解决。

**问题 2：参数绑定报错 "Parameter 'xxx' not found"？** 多参数方法要加 `@Param("name")` 注解，或在 XML 中用 `arg0`、`param1` 引用；使用对象或 Map 则直接用属性名。

**问题 3：${} 注入风险？** 排序、表名等必须用 `${}` 时，参数务必来自白名单校验后的可信值，绝不能直接拼接用户输入。

**问题 4：XML 与注解怎么选？** 简单 CRUD 可用 `@Select` 等注解；复杂动态 SQL 强烈建议写在 XML 里，可读性和可维护性更好。
