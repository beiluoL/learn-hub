// 学习模块内容生成器（构建期运行，Node 环境）
// 用法：node scripts/gen-learning-modules.mjs [分类id]   不传则全部
// 为每个模块生成：1 篇总览路线图(timeline) + N 章独立文章(subcat:roadmap) + 1~2 案例(subcat:cases)
// 内容由「结构化大纲」（要点 + 代码 + 自查清单）渲染为真实可读 markdown。
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import pythonData from './gen-data/python.mjs';
import aiData from './gen-data/ai.mjs';
import interviewData from './gen-data/interview.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CONTENT_DIR = path.resolve(__dirname, '../client/public/content');

function esc(v) {
  const s = String(v ?? '');
  return /[:#\-{}\[\],"]/.test(s) ? `"${s.replace(/"/g, '\\"')}"` : s;
}

// 章节/案例正文：简介 + 要点 + 代码 + 备注 + 自查清单
function renderBody(item) {
  const lines = [];
  if (item.intro) lines.push(item.intro, '');
  if (item.points?.length) {
    for (const p of item.points) lines.push(`- ${p}`);
    lines.push('');
  }
  if (item.code) {
    lines.push('```' + (item.code.lang || 'text'));
    lines.push(item.code.body.replace(/\s+$/, ''));
    lines.push('```', '');
  }
  if (item.note) lines.push(`> ${item.note}`, '');
  if (item.checklist?.length) {
    lines.push('**自查清单**');
    for (const c of item.checklist) lines.push(`- [ ] ${c}`);
    lines.push('');
  }
  return lines.join('\n').trim() + '\n';
}

// 总览路线图（timeline:true）：每章一个 ## 段 + 清单
function renderOverview(mod) {
  const lines = [];
  lines.push(
    `这份路线把「${mod.name}」拆成 ${mod.chapters.length} 个阶段，每个阶段给出**核心任务**与**练手目标**。建议边看边敲，每完成一项就勾掉一项。`
  );
  lines.push('');
  mod.chapters.forEach((ch, i) => {
    lines.push(`## ${i}. ${ch.title}`);
    lines.push('');
    if (ch.summary) lines.push(ch.summary, '');
    (ch.checklist || []).slice(0, 6).forEach((c) => lines.push(`- [ ] ${c}`));
    lines.push('');
  });
  lines.push('## 资源与节奏');
  lines.push('');
  lines.push('- 官方文档与权威资料优先；');
  lines.push('- 节奏：每天 1~2 小时，理论 + 敲代码交替；');
  lines.push('- 关键：每个模块至少完成 1 个可运行的小项目，代码放仓库。');
  lines.push('');
  return lines.join('\n').trim() + '\n';
}

function writeFile(catId, moduleId, subcat, filename, fm, body) {
  const dir = path.join(CONTENT_DIR, catId, moduleId, subcat);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, filename), `---\n${fm}\n---\n\n${body}`, 'utf8');
}

function genModule(catId, mod) {
  // 总览
  const ovFm = [
    `title: ${mod.name} · 系统学习路线`,
    `category: ${catId}`,
    `module: ${mod.id}`,
    `subcat: roadmap`,
    `timeline: true`,
    `level: ${mod.difficulty || 'easy'}`,
    `tier: ${mod.tier || 'core'}`,
    `readMinutes: 12`,
    `tags: ${esc(mod.name + ', 学习路线, 路线图')}`,
    `summary: ${esc(`从总览到逐章拆解的 ${mod.name} 学习路线，点开任意章节开始学习。`)}`,
    `order: 0`,
  ].join('\n');
  writeFile(catId, mod.id, 'roadmap', `${mod.id}-roadmap.md`, ovFm, renderOverview(mod));

  // 章节
  mod.chapters.forEach((ch, i) => {
    const fm = [
      `title: ${ch.title}`,
      `category: ${catId}`,
      `module: ${mod.id}`,
      `subcat: roadmap`,
      `timeline: false`,
      `level: ${ch.difficulty || 'medium'}`,
      `tier: ${ch.tier || 'core'}`,
      `readMinutes: ${ch.readMinutes || 12}`,
      `tags: ${esc([mod.name, ...(ch.tags || [])].join(', '))}`,
      `summary: ${esc(ch.summary || '')}`,
      `order: ${i + 1}`,
    ].join('\n');
    writeFile(catId, mod.id, 'roadmap', `${mod.id}-ch${i}-${ch.slug}.md`, fm, renderBody(ch));
  });

  // 案例
  (mod.cases || []).forEach((c, i) => {
    const fm = [
      `title: ${c.title}`,
      `category: ${catId}`,
      `module: ${mod.id}`,
      `subcat: cases`,
      `timeline: false`,
      `level: ${c.difficulty || 'medium'}`,
      `tier: ${c.tier || 'key'}`,
      `readMinutes: ${c.readMinutes || 20}`,
      `tags: ${esc([mod.name, '项目案例', ...(c.tags || [])].join(', '))}`,
      `summary: ${esc(c.summary || '')}`,
      `order: ${i + 1}`,
    ].join('\n');
    writeFile(catId, mod.id, 'cases', `${mod.id}-case-${c.slug}.md`, fm, renderBody(c));
  });

  return 1 + mod.chapters.length + (mod.cases?.length || 0);
}

/* ============================ 数据 ============================ */
const DATA = { java: [
  {
    id: 'java-basics', name: 'Java 基础语法', tier: 'core', difficulty: 'easy',
    chapters: [
      { slug: 'env', title: '环境与第一个程序', tier: 'basic', difficulty: 'easy',
        summary: '搭建 JDK 环境，理解编译运行流程，写出第一个 Java 程序。',
        intro: 'Java 是编译型 + 解释型结合的语言：源码 `.java` 先编译成字节码 `.class`，再由 JVM 解释执行。',
        points: [
          'JDK / JRE / JVM 的关系：JDK 含编译器，JRE 含运行环境，JVM 是跨平台核心。',
          '配置 `JAVA_HOME` 与 `PATH`，用 `java -version` 验证。',
          '`public static void main(String[] args)` 是程序入口。',
          '编译 `javac Hello.java` → 运行 `java Hello`（不带 .class）。',
          '包（package）对应目录结构，`import` 引入其他类。',
        ],
        code: { lang: 'java', body: 'public class Hello {\n  public static void main(String[] args) {\n    System.out.println("Hello, Java!");\n  }\n}' },
        checklist: ['装好 JDK 并配置环境变量', '能独立编译运行 Hello World', '理解包与目录的对应关系'],
      },
      { slug: 'type', title: '变量与数据类型', tier: 'basic', difficulty: 'easy',
        summary: '掌握 8 种基本类型、引用类型与类型转换。',
        points: [
          '基本类型：byte/short/int/long、float/double、char、boolean。',
          '引用类型：类、接口、数组、枚举等（存的是地址）。',
          '自动类型提升与强制转换：`(int)3.14`、`long n = 100L`。',
          '`final` 修饰常量，命名常用全大写。',
          '包装类（Integer/Double）提供对象能力与自动装箱拆箱。',
        ],
        code: { lang: 'java', body: 'final double PI = 3.14159;\nint a = 10; long b = a;        // 自动提升\ndouble c = (double) a / 3; // 强制转换' },
        checklist: ['能区分基本类型与引用类型', '熟练使用强制/自动转换', '理解 final 语义'],
      },
      { slug: 'control', title: '运算符与流程控制', tier: 'core', difficulty: 'easy',
        summary: '算术/关系/逻辑运算符，if/switch 与三种循环。',
        points: [
          '算术 `+ - * / %`、自增 `i++` vs `++i`。',
          '关系 `> < == !=`、逻辑 `&& || !`（短路求值）。',
          '三元运算符 `cond ? a : b`。',
          '`if/else`、`switch`（Java 14+ 支持箭头表达式）。',
          '`for` / `while` / `do-while`，`break` / `continue`。',
        ],
        code: { lang: 'java', body: 'for (int i = 0; i < 5; i++) {\n  if (i % 2 == 0) continue;\n  System.out.println(i);\n}' },
        checklist: ['能用三种循环实现遍历', '理解短路逻辑', '掌握 switch 新语法'],
      },
      { slug: 'array-string', title: '数组与字符串', tier: 'core', difficulty: 'easy',
        summary: '一维/多维数组，String 不可变性与常用 API。',
        points: [
          '数组定长：`int[] a = new int[5];` 下标从 0 开始。',
          '多维数组本质是「数组的数组」。',
          '`Arrays.toString / sort / copyOf` 等工具方法。',
          'String **不可变**：每次拼接都生成新对象，频繁拼接用 `StringBuilder`。',
          '常用：`length()`、`charAt`、`substring`、`split`、`equals`。',
        ],
        code: { lang: 'java', body: 'StringBuilder sb = new StringBuilder();\nsb.append("Hello").append(" ").append("World");\nString s = sb.toString();' },
        checklist: ['理解数组与多维数组', '说清 String 不可变原因', '会用 StringBuilder'],
      },
      { slug: 'method', title: '方法与方法重载', tier: 'core', difficulty: 'medium',
        summary: '方法定义、参数传递、重载与递归。',
        points: [
          '方法签名：返回类型 + 方法名 + 参数列表。',
          'Java 只有**值传递**：基本类型传副本，引用类型传地址副本。',
          '重载（overload）：同名不同参数列表，与返回类型无关。',
          '可变参数 `void f(int... nums)`。',
          '递归：自己调用自己，必须有终止条件。',
        ],
        code: { lang: 'java', body: 'int sum(int... nums) {\n  int s = 0; for (int n : nums) s += n; return s;\n}' },
        checklist: ['理解值传递本质', '能写出方法重载', '写过递归（如阶乘）'],
      },
      { slug: 'utils', title: '常用类与工具', tier: 'key', difficulty: 'medium',
        summary: 'Math、日期时间、Scanner、包装类等日常工具。',
        points: [
          '`Math`：`abs / max / random / round / pow`。',
          '日期时间优先用 `java.time`（LocalDateTime / Duration）。',
          '`Scanner` 读取控制台输入。',
          '格式化：`String.format`、`DecimalFormat`。',
          '`Objects` 工具类：判空、比较。',
        ],
        checklist: ['会用 java.time 处理日期', '掌握 Scanner 与格式化', '理解包装类缓存'],
      },
    ],
    cases: [
      { slug: 'todo-cli', title: '命令行 Todo 小工具', tier: 'basic', difficulty: 'easy',
        summary: '用数组/集合 + 循环实现一个增删查的命令行待办列表。',
        points: [
          '用 `List<String>` 存储任务。',
          '`Scanner` 读取命令（add/done/list/exit）。',
          '循环驱动交互，直到 exit。',
          '（进阶）把任务持久化到本地文件。',
        ],
        code: { lang: 'java', body: 'List<String> tasks = new ArrayList<>();\nScanner sc = new Scanner(System.in);\nwhile (true) {\n  String cmd = sc.nextLine();\n  if ("exit".equals(cmd)) break;\n  tasks.add(cmd);\n}' },
        checklist: ['实现增删查', '用循环驱动交互', '代码可运行'],
      },
    ],
  },
  {
    id: 'java-oop', name: '面向对象', tier: 'core', difficulty: 'medium',
    chapters: [
      { slug: 'class', title: '类与对象', tier: 'basic', difficulty: 'easy',
        summary: '理解类作为模板、对象作为实例，掌握构造器与 this。',
        points: [
          '类是蓝图，对象是具体实例；`new` 在堆上创建对象。',
          '构造器与类同名，无返回类型，用于初始化。',
          '`this` 指代当前对象，区分成员变量与参数。',
          '字段（属性）+ 方法（行为）封装数据与逻辑。',
          '成员变量有默认值，局部变量必须初始化。',
        ],
        code: { lang: 'java', body: 'class User {\n  String name;\n  User(String name) { this.name = name; }\n}' },
        checklist: ['能定义类与构造器', '理解 this 作用', '区分成员与局部变量'],
      },
      { slug: 'encapsulation', title: '封装', tier: 'core', difficulty: 'easy',
        summary: '用 private 隐藏细节，通过 getter/setter 暴露可控访问。',
        points: [
          '`private` 修饰字段，外部无法直接访问。',
          '提供 `getXxx()/setXxx()` 进行受控读写。',
          '可在 setter 中做校验（如年龄不能为负）。',
          '封装降低耦合，提高可维护性。',
          '访问修饰符：`private < 默认 < protected < public`。',
        ],
        checklist: ['能给字段加 private', '会写 getter/setter', '理解封装收益'],
      },
      { slug: 'inheritance', title: '继承', tier: 'core', difficulty: 'medium',
        summary: 'extends 复用父类，super 调用父类，理解重写与 Object。',
        points: [
          '`class Sub extends Super` 复用父类成员。',
          '`super()` 调用父类构造器（默认隐式调用无参）。',
          '方法重写（override）：签名一致，注解 `@Override`。',
          '所有类最终继承自 `Object`（equals/hashCode/toString）。',
          '`final` 类不可继承、final 方法不可重写。',
        ],
        code: { lang: 'java', body: 'class Animal { void sound() {} }\nclass Cat extends Animal {\n  @Override void sound() { System.out.println("meow"); }\n}' },
        checklist: ['会用 extends', '理解 super 调用', '正确重写方法'],
      },
      { slug: 'polymorphism', title: '多态', tier: 'key', difficulty: 'medium',
        summary: '向上转型与动态绑定，接口/抽象类实现多态。',
        points: [
          '父类引用指向子类对象：`Animal a = new Cat();`。',
          '运行时根据实际类型调用重写方法（动态绑定）。',
          '多态解耦调用方与具体实现。',
          '抽象类 `abstract` 不能实例化，强制子类实现。',
          '面向接口编程是多态的高级形态。',
        ],
        checklist: ['理解向上转型', '能解释动态绑定', '用过抽象类'],
      },
      { slug: 'interface', title: '接口与抽象类', tier: 'key', difficulty: 'medium',
        summary: 'interface 定义契约，支持默认方法与多实现。',
        points: [
          '接口只有抽象方法（Java 8+ 可有 `default`/`static`）。',
          '类可实现多个接口：`class A implements B, C`。',
          '函数式接口（单一抽象方法）可用 Lambda。',
          '接口用于定义「能做什么」，抽象类用于「是什么」。',
          '优先面向接口设计。',
        ],
        code: { lang: 'java', body: '@FunctionalInterface\ninterface Greet { void say(String name); }\nGreet g = name -> System.out.println("hi " + name);' },
        checklist: ['能定义并实现接口', '理解函数式接口', '区分接口与抽象类'],
      },
      { slug: 'access', title: '包与访问控制', tier: 'key', difficulty: 'easy',
        summary: '用 package 组织代码，理解访问修饰符与 jar 打包。',
        points: [
          '`package com.xxx;` 必须位于对应目录。',
          '`import` 引入类，通配符 `import com.xxx.*`。',
          '访问控制：private/默认/protected/public 的可见范围。',
          '`static import` 可直接引入静态成员。',
          '用 `jar` 打成可复用组件。',
        ],
        checklist: ['会用 package 组织代码', '理解四种访问修饰符', '能打 jar 包'],
      },
    ],
    cases: [
      { slug: 'student-system', title: '学生信息管理系统', tier: 'core', difficulty: 'medium',
        summary: '用类、集合与封装实现一个增删改查的学生管理小系统。',
        points: [
          '`Student` 类封装姓名/学号/成绩（private + getter/setter）。',
          '用 `List<Student>` 管理，提供 CRUD 方法。',
          '菜单驱动交互，校验输入。',
          '（进阶）按成绩排序、按条件筛选。',
        ],
        checklist: ['合理封装 Student', '实现 CRUD', '菜单可运行'],
      },
    ],
  },
  {
    id: 'java-collection', name: '集合框架', tier: 'key', difficulty: 'medium',
    chapters: [
      { slug: 'overview', title: '集合体系概览', tier: 'basic', difficulty: 'easy',
        summary: '掌握 Collection 与 Map 两大分支及泛型。',
        points: [
          '`Collection`：List（有序可重复）、Set（不可重复）、Queue（队列）。',
          '`Map`：键值对，key 不可重复。',
          '泛型 `<T>` 提供编译期类型安全。',
          '统一迭代方式：`for-each` 与 `Iterator`。',
          '选型的本质是时间与空间复杂度的权衡。',
        ],
        checklist: ['分清 List/Set/Queue/Map', '会用泛型', '理解迭代方式'],
      },
      { slug: 'list', title: 'List 体系', tier: 'core', difficulty: 'easy',
        summary: 'ArrayList 与 LinkedList 的底层与选型。',
        points: [
          '`ArrayList`：数组实现，随机访问快，尾部增删快，中间插入慢。',
          '`LinkedList`：双向链表，插入删除快，随机访问慢。',
          '扩容：ArrayList 默认 1.5 倍扩容。',
          '`Vector` 线程安全但性能差，基本被弃用。',
          '遍历优先用 `for-each` 或 `Iterator`。',
        ],
        code: { lang: 'java', body: 'List<String> list = new ArrayList<>();\nlist.add("a"); list.add("b");\nfor (String s : list) System.out.println(s);' },
        checklist: ['说清 ArrayList vs LinkedList', '理解扩容机制', '会用遍历'],
      },
      { slug: 'set', title: 'Set 体系', tier: 'core', difficulty: 'medium',
        summary: 'HashSet/TreeSet/LinkedHashSet 与去重原理。',
        points: [
          '`HashSet`：基于 HashMap，依赖 `hashCode()` + `equals()` 去重。',
          '`TreeSet`：基于红黑树，元素有序（需 Comparable/Comparator）。',
          '`LinkedHashSet`：维护插入顺序。',
          '重写 equals 必须重写 hashCode（约定相同对象同 hash）。',
          '去重场景首选 HashSet。',
        ],
        checklist: ['理解 HashSet 去重原理', '会重写 hashCode/equals', '区分三种 Set'],
      },
      { slug: 'map', title: 'Map 体系', tier: 'key', difficulty: 'medium',
        summary: 'HashMap 原理、红黑树与 ConcurrentHashMap。',
        points: [
          '`HashMap`：数组 + 链表/红黑树，默认负载因子 0.75。',
          '`put`：算 hash → 定位桶 → 冲突时链表/树化（阈值 8）。',
          '`LinkedHashMap` 保序，`TreeMap` 按 key 排序。',
          '`ConcurrentHashMap`：分段/细粒度锁，线程安全。',
          '遍历用 `entrySet()` 而非 `keySet()` 再 get。',
        ],
        code: { lang: 'java', body: 'Map<String, Integer> m = new HashMap<>();\nm.put("a", 1);\nfor (var e : m.entrySet()) System.out.println(e.getKey() + e.getValue());' },
        checklist: ['讲清 HashMap put 流程', '理解树化阈值', '会遍历 Map'],
      },
      { slug: 'queue', title: 'Queue 与栈', tier: 'key', difficulty: 'medium',
        summary: 'Deque、PriorityQueue 与 ArrayDeque 的使用。',
        points: [
          '`Queue`：FIFO，`offer/poll/peek`。',
          '`Deque` 可作双端队列或栈（`push/pop`）。',
          '`PriorityQueue`：堆实现，按优先级出队。',
          '`ArrayDeque` 性能优于 `Stack`。',
          '阻塞队列用于并发（见并发模块）。',
        ],
        checklist: ['会用 Queue/Deque', '理解优先队列', '用 ArrayDeque 当栈'],
      },
      { slug: 'source', title: '工具类与源码', tier: 'key', difficulty: 'hard',
        summary: 'Collections/Arrays 工具与迭代器 fail-fast。',
        points: [
          '`Collections`：sort/max/min/reverse/synchronized。',
          '`Arrays`：asList/sort/binarySearch/copyOf。',
          '`Iterator` 的 fail-fast：遍历中结构变更会抛异常。',
          '阅读 `ArrayList`/`HashMap` 源码理解实现。',
          '不可变集合：`List.of / Collections.unmodifiableList`。',
        ],
        checklist: ['掌握 Collections/Arrays', '理解 fail-fast', '读过核心源码'],
      },
    ],
    cases: [
      { slug: 'wordcount', title: '词频统计', tier: 'core', difficulty: 'easy',
        summary: '用 Map 统计一段文本中各单词出现次数并排序输出。',
        points: [
          '按空格/标点切分文本为单词。',
          '`Map<String, Integer>` 计数。',
          '按次数降序排序输出 Top N。',
          '（进阶）忽略大小写、过滤停用词。',
        ],
        code: { lang: 'java', body: 'Map<String, Integer> freq = new HashMap<>();\nfor (String w : words) freq.merge(w, 1, Integer::sum);' },
        checklist: ['用 Map 计数', '会排序输出', '代码正确'],
      },
    ],
  },
  {
    id: 'java-io', name: '异常与 IO', tier: 'core', difficulty: 'medium',
    chapters: [
      { slug: 'exception', title: '异常体系', tier: 'basic', difficulty: 'easy',
        summary: 'Throwable 体系、checked/unchecked 与 try-catch。',
        points: [
          '`Throwable` 分为 `Error`（严重，不捕获）与 `Exception`。',
          '受检异常（checked）必须处理，运行时异常（RuntimeException）可不处理。',
          '`try/catch/finally`，`finally` 一定执行（释放资源）。',
          '`throw` 主动抛，`throws` 声明向上抛。',
          '早抛晚捕：底层抛具体异常，上层统一处理。',
        ],
        code: { lang: 'java', body: 'try {\n  int x = 1 / 0;\n} catch (ArithmeticException e) {\n  System.out.println("除数不能为0");\n} finally {\n  System.out.println("cleanup");\n}' },
        checklist: ['区分 checked/unchecked', '会用 try-catch-finally', '理解 throw/throws'],
      },
      { slug: 'custom-ex', title: '自定义异常', tier: 'core', difficulty: 'medium',
        summary: '定义业务异常并保留异常链。',
        points: [
          '继承 `Exception`（受检）或 `RuntimeException`（非受检）。',
          '提供带 message 与 cause 的构造器。',
          '用异常表达业务错误，而非返回错误码。',
          '异常链：`new MyException("x", e)` 保留根因。',
          '异常类名以 Exception 结尾，语义清晰。',
        ],
        checklist: ['能定义自定义异常', '保留异常链', '合理选择受检/非受检'],
      },
      { slug: 'file', title: 'File 与 Path', tier: 'core', difficulty: 'easy',
        summary: '文件/目录操作与 NIO.2 的 Path/Files。',
        points: [
          '`java.io.File`：判断存在、创建、列目录。',
          'NIO.2：`Path / Paths / Files` 更现代。',
          '`Files.readAllLines / write / copy / move`。',
          '`Files.walk` 递归遍历目录。',
          '路径分隔符用 `File.separator` 或 NIO。',
        ],
        checklist: ['会用 File/Path', '能读写文本文件', '会递归遍历目录'],
      },
      { slug: 'stream', title: '字节流与字符流', tier: 'key', difficulty: 'medium',
        summary: 'InputStream/Reader 体系与缓冲流。',
        points: [
          '字节流：`InputStream/OutputStream`（图片/二进制）。',
          '字符流：`Reader/Writer`（文本，处理编码）。',
          '缓冲流 `BufferedInputStream/BufferedReader` 提升性能。',
          '装饰器模式：流可层层包装。',
          '务必在 finally 或 try-with-resources 中关闭。',
        ],
        code: { lang: 'java', body: 'try (BufferedReader br = new BufferedReader(new FileReader("a.txt"))) {\n  String line; while ((line = br.readLine()) != null) System.out.println(line);\n}' },
        checklist: ['区分字节/字符流', '会用缓冲流', '用 try-with-resources'],
      },
      { slug: 'nio', title: 'NIO 新特性', tier: 'key', difficulty: 'hard',
        summary: 'Channel/Buffer 与 Files 新 API。',
        points: [
          'NIO：Channel + Buffer，面向块、非阻塞。',
          '`Files.readAllBytes / newBufferedReader` 简洁高效。',
          '内存映射文件：`FileChannel.map`。',
          '`WatchService` 监听目录变化。',
          '大文件处理优先用 NIO。',
        ],
        checklist: ['理解 Channel/Buffer', '会用 Files 新 API', '了解内存映射'],
      },
      { slug: 'serialize', title: '序列化', tier: 'key', difficulty: 'medium',
        summary: '对象序列化与反序列化、transient 控制。',
        points: [
          '实现 `Serializable` 接口即可序列化。',
          '`ObjectOutputStream / ObjectInputStream` 读写对象。',
          '`transient` 字段不参与序列化（如密码）。',
          '`serialVersionUID` 保证版本兼容。',
          'JSON 序列化（Jackson）更通用、跨语言。',
        ],
        checklist: ['理解序列化用途', '会用 transient', '知道 serialVersionUID'],
      },
    ],
    cases: [
      { slug: 'log-analyzer', title: '日志文件分析器', tier: 'core', difficulty: 'medium',
        summary: '读取日志文件，统计 ERROR 行数、抽取 Top IP 等。',
        points: [
          '用 BufferedReader 逐行读取。',
          '正则匹配 ERROR / WARN 级别。',
          '用 Map 统计各维度出现次数。',
          '输出汇总报告。',
        ],
        checklist: ['能读取大文件', '用正则过滤', '输出统计结果'],
      },
    ],
  },
  {
    id: 'java-juc', name: '并发编程', tier: 'key', difficulty: 'hard',
    chapters: [
      { slug: 'thread', title: '线程基础', tier: 'basic', difficulty: 'medium',
        summary: 'Thread/Runnable、线程状态与守护线程。',
        points: [
          '创建线程：`extends Thread` 或 `implements Runnable`（推荐后者）。',
          '线程状态：新建/就绪/运行/阻塞/终止。',
          '`start()` 启动（非 run），`join()` 等待结束。',
          '守护线程（daemon）不阻止 JVM 退出。',
          '线程优先级仅作提示，不保证执行顺序。',
        ],
        code: { lang: 'java', body: 'Thread t = new Thread(() -> System.out.println("run"));\nt.start(); t.join();' },
        checklist: ['两种创建线程方式', '理解线程状态', '会用 join'],
      },
      { slug: 'sync', title: '同步与锁', tier: 'core', difficulty: 'medium',
        summary: 'synchronized 原理与死锁防范。',
        points: [
          '`synchronized` 保证同一时刻只有一个线程进入临界区。',
          '可修饰方法或代码块，锁对象为 this / 类 / 指定对象。',
          '底层基于对象监视器（monitor）。',
          '死锁：互相持有对方所需锁，需破坏四个必要条件之一。',
          '尽量缩小同步范围，降低争用。',
        ],
        checklist: ['理解 synchronized', '能定位死锁', '缩小同步范围'],
      },
      { slug: 'lock', title: 'Lock 显式锁', tier: 'key', difficulty: 'hard',
        summary: 'ReentrantLock、读写锁与 Condition。',
        points: [
          '`ReentrantLock` 可中断、可超时、可公平。',
          '必须在 `finally` 中 `unlock()`。',
          '`ReadWriteLock`：读共享、写独占，提升读多场景性能。',
          '`Condition` 实现精细化等待/唤醒（替代 wait/notify）。',
          'Lock 比 synchronized 更灵活但更易出错。',
        ],
        code: { lang: 'java', body: 'Lock lock = new ReentrantLock();\nlock.lock();\ntry { /* 临界区 */ } finally { lock.unlock(); }' },
        checklist: ['会用 ReentrantLock', '理解读写锁', '正确使用 Condition'],
      },
      { slug: 'cooperate', title: '线程协作', tier: 'key', difficulty: 'hard',
        summary: 'wait/notify 与 CountDownLatch 等同步工具。',
        points: [
          '`wait/notify/notifyAll` 需在 synchronized 内调用。',
          '`CountDownLatch`：等待 N 个任务完成。',
          '`CyclicBarrier`：多线程到达屏障再继续。',
          '`Semaphore`：控制并发许可数。',
          '优先用高级同步器，少用 wait/notify。',
        ],
        checklist: ['理解等待/唤醒', '会用 Latch/Barrier', '会用 Semaphore'],
      },
      { slug: 'pool', title: '线程池', tier: 'key', difficulty: 'hard',
        summary: 'ThreadPoolExecutor 原理与参数配置。',
        points: [
          '`Executors` 快捷工厂（注意 OOM 风险，推荐手动创建）。',
          '核心参数：核心/最大线程数、队列、拒绝策略、空闲回收。',
          '任务提交：`execute`（无返回）/ `submit`（有 Future）。',
          '拒绝策略：Abort/CallerRuns/Discard 等。',
          '合理配置：CPU 密集≈核数，IO 密集可更大。',
        ],
        code: { lang: 'java', body: 'ThreadPoolExecutor pool = new ThreadPoolExecutor(\n  4, 8, 60, TimeUnit.SECONDS, new LinkedBlockingQueue<>(100));' },
        checklist: ['能手写线程池', '理解拒绝策略', '合理设置参数'],
      },
      { slug: 'container', title: '并发容器与原子类', tier: 'key', difficulty: 'hard',
        summary: 'ConcurrentHashMap、原子类与 CAS。',
        points: [
          '`ConcurrentHashMap`：分段/桶锁，高并发安全。',
          '`CopyOnWriteArrayList`：读多写少场景。',
          '原子类 `AtomicInteger` 等基于 CAS，无锁高效。',
          'CAS：比较并交换，存在 ABA 问题（可用版本号解决）。',
          '`volatile` 保证可见性但不保证原子性。',
        ],
        checklist: ['会用并发容器', '理解原子类/CAS', '理解 volatile'],
      },
    ],
    cases: [
      { slug: 'counter', title: '高并发计数器', tier: 'key', difficulty: 'hard',
        summary: '用线程池 + 原子类实现一个线程安全的百万级计数器。',
        points: [
          '多个线程并发累加 `AtomicLong`。',
          '用线程池提交任务，join 等待。',
          '对比 `i++`（非原子，错误）与原子方案。',
          '输出最终计数验证正确性。',
        ],
        code: { lang: 'java', body: 'AtomicLong cnt = new AtomicLong();\nIntStream.range(0, 100).forEach(i -> pool.execute(() -> cnt.incrementAndGet()));' },
        checklist: ['线程安全计数', '用线程池', '验证结果正确'],
      },
    ],
  },
  {
    id: 'java-jvm', name: 'JVM 与调优', tier: 'key', difficulty: 'hard',
    chapters: [
      { slug: 'memory', title: '内存结构', tier: 'basic', difficulty: 'medium',
        summary: '运行时数据区：堆、栈、方法区与直接内存。',
        points: [
          '堆：对象实例，GC 主要区域，分新生代/老年代。',
          '虚拟机栈：每个线程私有，存放栈帧（局部变量/操作数栈）。',
          '方法区（元空间）：类信息、常量、静态变量。',
          '程序计数器：当前线程执行位置。',
          '直接内存：NIO 使用，不受堆大小限制但受本机内存约束。',
        ],
        checklist: ['说清各区域职责', '理解堆与栈区别', '知道元空间'],
      },
      { slug: 'gc-algo', title: '垃圾回收算法', tier: 'core', difficulty: 'hard',
        summary: '标记清除/复制/整理与分代收集思想。',
        points: [
          '判断无用对象：引用计数（有环问题）/ 可达性分析。',
          '标记-清除：简单但有碎片。',
          '复制算法：无碎片但浪费一半空间（新生代用）。',
          '标记-整理：无碎片，适合老年代。',
          '分代收集：新生代用复制，老年代用整理。',
        ],
        checklist: ['理解可达性分析', '区分三种算法', '理解分代思路'],
      },
      { slug: 'collector', title: '垃圾收集器', tier: 'key', difficulty: 'hard',
        summary: 'Serial/Parallel/CMS/G1/ZGC 演进。',
        points: [
          'Serial：单线程，简单但停顿长。',
          'Parallel：吞吐优先，多线程收集。',
          'CMS：低停顿，并发标记清除（已废弃）。',
          'G1：分 Region，可预测停顿，主流。',
          'ZGC/Shenandoah：亚毫秒级停顿，大堆友好。',
        ],
        checklist: ['能对比主流收集器', '知道 G1 特点', '了解 ZGC'],
      },
      { slug: 'classload', title: '类加载机制', tier: 'key', difficulty: 'hard',
        summary: '双亲委派与自定义类加载器。',
        points: [
          '加载→链接（验证/准备/解析）→初始化。',
          '双亲委派：先委托父加载器，保证安全与唯一。',
          '破坏双亲委派：SPI、热部署、Tomcat。',
          '自定义 ClassLoader 实现隔离/加密加载。',
          '`ClassNotFoundException` vs `NoClassDefFoundError`。',
        ],
        checklist: ['说清加载流程', '理解双亲委派', '能自定义加载器'],
      },
      { slug: 'tools', title: '运行时参数与工具', tier: 'key', difficulty: 'hard',
        summary: '常用 JVM 参数与诊断命令。',
        points: [
          '`-Xms/-Xmx` 堆初始/最大；`-Xss` 栈大小。',
          '`jps` 查进程，`jstat` 看 GC，`jmap` 看堆。',
          '`jstack` 抓线程栈（排查死锁/卡顿）。',
          '`jcmd` 综合诊断；`jhat`/MAT 分析堆转储。',
          'GC 日志：`-Xlog:gc*` 输出分析。',
        ],
        checklist: ['会设堆参数', '会用 jps/jstat', '会用 jstack'],
      },
      { slug: 'tuning', title: '调优实战', tier: 'key', difficulty: 'hard',
        summary: 'OOM 与 CPU 飙高的定位思路。',
        points: [
          'OOM：堆溢出看对象占用，栈溢出看递归深度。',
          'CPU 飙高：`top -Hp` + `jstack` 定位热点线程。',
          '内存泄漏：对比多次堆转储找增长对象。',
          '调优目标：吞吐与停顿的权衡。',
          '先在压测环境复现，再调参验证。',
        ],
        checklist: ['能定位 OOM', '会查 CPU 飙高', '有调优闭环'],
      },
    ],
    cases: [
      { slug: 'oom-lab', title: 'OOM 排查演练', tier: 'key', difficulty: 'hard',
        summary: '构造一个内存泄漏场景，用 jmap/jstack 定位并修复。',
        points: [
          '用静态集合不断 add 制造泄漏。',
          '`jmap -histo` 找到异常增长的类。',
          '`jstack` 确认线程状态。',
          '修复（及时清理/限容）并复测。',
        ],
        checklist: ['能复现泄漏', '会用工具定位', '完成修复'],
      },
    ],
  },
  {
    id: 'java-jdbc', name: '数据库与 JDBC', tier: 'core', difficulty: 'medium',
    chapters: [
      { slug: 'sql', title: 'SQL 基础', tier: 'basic', difficulty: 'easy',
        summary: 'DDL/DML、约束与索引基础。',
        points: [
          'DDL：`CREATE/ALTER/DROP TABLE`，类型与约束。',
          'DML：`INSERT/UPDATE/DELETE/SELECT`。',
          '约束：主键、外键、唯一、非空、默认值。',
          '`JOIN`：内/左/右连接。',
          '索引加速查询但拖慢写入。',
        ],
        code: { lang: 'sql', body: 'SELECT u.name, o.amount\nFROM users u JOIN orders o ON u.id = o.user_id\nWHERE o.amount > 100;' },
        checklist: ['会写基本 SQL', '理解约束', '会用 JOIN'],
      },
      { slug: 'jdbc-basic', title: 'JDBC 入门', tier: 'core', difficulty: 'medium',
        summary: 'DriverManager、Connection 与结果集。',
        points: [
          '加载驱动（现代 JDBC 自动注册）。',
          '`DriverManager.getConnection(url, user, pwd)`。',
          '`Statement` 执行 SQL，`ResultSet` 取结果。',
          'URL 格式：`jdbc:mysql://host:port/db`。',
          '资源必须关闭（try-with-resources）。',
        ],
        code: { lang: 'java', body: 'try (Connection c = DriverManager.getConnection(url, u, p);\n     Statement st = c.createStatement();\n     ResultSet rs = st.executeQuery("SELECT 1")) {\n  while (rs.next()) System.out.println(rs.getInt(1));\n}' },
        checklist: ['能建立连接', '会执行查询', '用 try-with-resources'],
      },
      { slug: 'prepared', title: 'PreparedStatement', tier: 'core', difficulty: 'medium',
        summary: '预编译、防 SQL 注入与批处理。',
        points: [
          '`?` 占位符，参数化查询，性能与安全的双赢。',
          '防止 SQL 注入（绝不拼接用户输入）。',
          '`addBatch/executeBatch` 批量提交。',
          '`getGeneratedKeys` 取自增主键。',
          '设 `fetchSize` 优化大结果集。',
        ],
        checklist: ['会用占位符', '理解防注入', '会用批处理'],
      },
      { slug: 'tx', title: '事务', tier: 'key', difficulty: 'medium',
        summary: 'ACID、隔离级别与回滚。',
        points: [
          '`conn.setAutoCommit(false)` 开启事务。',
          '`commit()` 提交，`rollback()` 回滚。',
          'ACID：原子性/一致性/隔离性/持久性。',
          '隔离级别：读未提交→串行化，解决脏读/不可重复读/幻读。',
          '异常时务必 rollback，避免脏数据。',
        ],
        checklist: ['能手动控制事务', '理解隔离级别', '异常回滚'],
      },
      { slug: 'pool', title: '连接池', tier: 'key', difficulty: 'medium',
        summary: 'HikariCP/Druid 复用连接。',
        points: [
          '频繁建连开销大，连接池复用连接。',
          'HikariCP：高性能默认选择。',
          'Druid：带监控与防注入。',
          '关键参数：最大/最小连接数、超时。',
          '从池取连接，用完归还（close 实为归还）。',
        ],
        checklist: ['理解连接池价值', '会配 HikariCP', '用完归还连接'],
      },
      { slug: 'advanced', title: '元数据与高级', tier: 'key', difficulty: 'hard',
        summary: 'DatabaseMetaData、分页与存储过程。',
        points: [
          '`DatabaseMetaData` 探查库结构。',
          '分页：`LIMIT/OFFSET` 或游标（深分页用游标/延迟关联）。',
          '`CallableStatement` 调存储过程。',
          '读写大字段：CLOB/BLOB。',
          '大数据量用流式读取。',
        ],
        checklist: ['会用元数据', '会分页优化', '会调存储过程'],
      },
    ],
    cases: [
      { slug: 'user-crud', title: '简易用户管理系统', tier: 'core', difficulty: 'medium',
        summary: '用 JDBC + 连接池实现用户的增删改查与登录校验。',
        points: [
          'HikariCP 管理连接。',
          'PreparedStatement 实现 CRUD。',
          '登录用参数化查询防注入。',
          '事务包裹多步写操作。',
        ],
        checklist: ['连接池 CRUD', '登录防注入', '事务正确'],
      },
    ],
  },
  {
    id: 'java-spring', name: 'Spring / Boot', tier: 'key', difficulty: 'hard',
    chapters: [
      { slug: 'ioc', title: 'IoC 与 DI', tier: 'core', difficulty: 'medium',
        summary: '控制反转、依赖注入与 Bean 定义。',
        points: [
          'IoC：对象创建交给容器，解耦。',
          'DI：容器把依赖注入到组件（构造器/setter/字段）。',
          '`@Component`/`@Service`/`@Repository` 注册 Bean。',
          '`@Autowired` 注入（`@Resource` 也可）。',
          '推荐构造器注入，不可变且易测。',
        ],
        code: { lang: 'java', body: '@Service\npublic class UserService {\n  private final UserRepo repo;\n  public UserService(UserRepo repo) { this.repo = repo; }\n}' },
        checklist: ['理解 IoC/DI', '会用注解注册 Bean', '用构造器注入'],
      },
      { slug: 'bean', title: 'Bean 生命周期', tier: 'key', difficulty: 'hard',
        summary: '作用域、后置处理器与循环依赖。',
        points: [
          '作用域：`singleton`（默认）/ `prototype` / Web 作用域。',
          '生命周期回调：`@PostConstruct` / `@PreDestroy`。',
          '`BeanPostProcessor` 干预初始化前后。',
          '循环依赖：单例通过三级缓存解决（构造器注入无解）。',
          '`@Lazy` 延迟初始化打破循环。',
        ],
        checklist: ['理解作用域', '理解生命周期', '知道循环依赖处理'],
      },
      { slug: 'aop', title: 'AOP 面向切面', tier: 'key', difficulty: 'hard',
        summary: '切面、通知与事务注解原理。',
        points: [
          'AOP：把横切关注点（日志/事务/权限）抽离。',
          '切点（Pointcut）+ 通知（Advice：前/后/环绕）。',
          '底层：JDK 动态代理（接口）或 CGLIB（类）。',
          '`@Transactional` 即基于 AOP 的事务增强。',
          '自调用（同类方法）AOP 不生效。',
        ],
        code: { lang: 'java', body: '@Around("execution(* com.x..service.*.*(..))")\npublic Object log(ProceedingJoinPoint pjp) throws Throwable {\n  long s = System.nanoTime(); Object r = pjp.proceed(); return r;\n}' },
        checklist: ['理解 AOP 概念', '能写切面', '理解事务注解原理'],
      },
      { slug: 'boot', title: 'Spring Boot 自动配置', tier: 'key', difficulty: 'hard',
        summary: '@SpringBootApplication 与 starter 机制。',
        points: [
          '`@SpringBootApplication` = 配置 + 自动配置 + 扫描。',
          'starter 一站式引入依赖与默认配置。',
          '自动配置：按 classpath 条件装配 Bean。',
          '`@Conditional` 系列控制装配。',
          '`application.yml` 覆盖默认值。',
        ],
        checklist: ['理解自动配置', '会用 starter', '会用条件注解'],
      },
      { slug: 'web', title: 'Web 开发', tier: 'core', difficulty: 'medium',
        summary: 'REST 接口、参数绑定与统一处理。',
        points: [
          '`@RestController` + `@RequestMapping` 暴露接口。',
          '`@PathVariable` / `@RequestParam` / `@RequestBody` 绑参。',
          '统一返回包装与全局异常处理（`@ControllerAdvice`）。',
          '参数校验：`@Valid` + 约束注解。',
          '拦截器/过滤器处理鉴权、日志。',
        ],
        code: { lang: 'java', body: '@GetMapping("/users/{id}")\npublic UserDTO get(@PathVariable Long id) { return service.findById(id); }' },
        checklist: ['能写 REST 接口', '会参数绑定', '统一异常处理'],
      },
      { slug: 'data', title: '数据访问集成', tier: 'key', difficulty: 'medium',
        summary: 'Spring Data JPA 与 MyBatis 整合。',
        points: [
          'Spring Data JPA：接口即实现，方法名推导查询。',
          'MyBatis：`@Mapper` + XML/注解 SQL。',
          '事务管理：`@EnableTransactionManagement` + `@Transactional`。',
          '多数据源需显式配置。',
          '选择：JPA 快，MyBatis 灵活可控。',
        ],
        checklist: ['会用 JPA/MyBatis', '理解事务管理', '能整合数据源'],
      },
    ],
    cases: [
      { slug: 'blog-api', title: '博客后端 API', tier: 'key', difficulty: 'medium',
        summary: '用 Spring Boot 实现文章的增删改查 REST 接口 + 统一异常处理。',
        points: [
          '分层：Controller / Service / Repository。',
          '`@RestController` 暴露 CRUD。',
          '`@ControllerAdvice` 统一异常与返回。',
          '`@Transactional` 包裹写操作。',
        ],
        checklist: ['分层清晰', '接口可运行', '异常处理统一'],
      },
    ],
  },
  {
    id: 'java-mybatis', name: 'MyBatis', tier: 'key', difficulty: 'medium',
    chapters: [
      { slug: 'intro', title: '入门与配置', tier: 'basic', difficulty: 'medium',
        summary: 'SqlSessionFactory、映射文件与 Mapper 接口。',
        points: [
          '核心对象：`SqlSessionFactory` → `SqlSession`。',
          'Mapper 接口 + XML/注解映射 SQL。',
          '`mybatis-config.xml` 配置数据源、别名、映射。',
          'Spring 整合后由容器管理 SqlSession。',
          '`#{}` 预编译占位，`${}` 拼接（慎用）。',
        ],
        code: { lang: 'xml', body: '<select id="findById" resultType="User">\n  SELECT * FROM user WHERE id = #{id}\n</select>' },
        checklist: ['理解核心对象', '能配 SqlSessionFactory', '区分 # 与 $'],
      },
      { slug: 'crud', title: 'CRUD 映射', tier: 'core', difficulty: 'medium',
        summary: 'select/insert/update/delete 与参数。',
        points: [
          '`parameterType` / `resultType` / `resultMap`。',
          '`useGeneratedKeys` 取自增主键。',
          '多参数用 `@Param` 或 Map。',
          '`<selectKey>` 兼容不同数据库主键。',
          '返回 Map 或 DTO 灵活映射。',
        ],
        checklist: ['会写 CRUD', '会取主键', '会用 @Param'],
      },
      { slug: 'dynamic', title: '动态 SQL', tier: 'key', difficulty: 'medium',
        summary: 'if/choose/foreach/where/trim/set。',
        points: [
          '`<if>` 条件拼接。',
          '`<choose>/<when>/<otherwise>` 多选一。',
          '`<foreach>` 遍历（IN 查询、批量）。',
          '`<where>/<set>/<trim>` 智能处理前缀逗号。',
          '动态 SQL 是 MyBatis 相比 JPA 的强项。',
        ],
        code: { lang: 'xml', body: '<select id="search">\n  SELECT * FROM user\n  <where>\n    <if test="name != null">AND name = #{name}</if>\n  </where>\n</select>' },
        checklist: ['会用 if/foreach', '理解 where 标签', '能写动态查询'],
      },
      { slug: 'resultmap', title: '结果映射', tier: 'key', difficulty: 'medium',
        summary: 'resultMap、关联与延迟加载。',
        points: [
          '`resultMap` 解决列名与属性名不一致、复杂映射。',
          '`<association>` 一对一，`<collection>` 一对多。',
          '`column` 指定关联查询的入参列。',
          '`fetchType="lazy"` 延迟加载。',
          '嵌套结果 vs 嵌套查询的取舍。',
        ],
        checklist: ['会用 resultMap', '理解 association/collection', '了解延迟加载'],
      },
      { slug: 'cache', title: '缓存', tier: 'key', difficulty: 'hard',
        summary: '一级/二级缓存与配置。',
        points: [
          '一级缓存：SqlSession 级别，默认开启。',
          '二级缓存：Mapper 级别，需开启 `cacheEnabled`。',
          '缓存命中条件：相同语句、参数、SqlSession（一级）。',
          '分布式环境用 Redis 等外部缓存替代二级。',
          '写操作默认清缓存。',
        ],
        checklist: ['理解一二级缓存', '会开启二级缓存', '知道分布式局限'],
      },
      { slug: 'spring', title: '与 Spring 集成', tier: 'key', difficulty: 'medium',
        summary: '@MapperScan 与事务整合。',
        points: [
          '`@MapperScan` 扫描 Mapper 接口。',
          '`SqlSessionTemplate` 管理会话生命周期。',
          '与 Spring 事务联动（`@Transactional`）。',
          '多数据源：指定不同 `SqlSessionFactory`。',
          'PageHelper 等插件分页。',
        ],
        checklist: ['会 @MapperScan', '整合事务', '了解多数据源'],
      },
    ],
    cases: [
      { slug: 'product-dao', title: '商品管理 DAO', tier: 'core', difficulty: 'medium',
        summary: '用 MyBatis 实现商品的增删改查与动态条件搜索。',
        points: [
          'Mapper 接口 + XML 映射。',
          '动态 SQL 实现多条件搜索。',
          '分页查询。',
          '整合 Spring 事务。',
        ],
        checklist: ['接口+XML 映射', '动态搜索', '事务正确'],
      },
    ],
  },
  {
    id: 'java-micro', name: '微服务', tier: 'key', difficulty: 'hard',
    chapters: [
      { slug: 'overview', title: '微服务概览', tier: 'basic', difficulty: 'medium',
        summary: '服务拆分、注册中心、网关与利弊。',
        points: [
          '单体 → 微服务：按业务域拆分独立部署。',
          '核心组件：注册中心、配置中心、网关、链路追踪。',
          '优势：独立扩展、技术异构、故障隔离。',
          '代价：分布式复杂度、运维、网络开销、一致性。',
          '不是银弹，小团队慎用。',
        ],
        checklist: ['理解拆分动机', '知道核心组件', '权衡利弊'],
      },
      { slug: 'register', title: '服务注册发现', tier: 'core', difficulty: 'medium',
        summary: 'Nacos/Eureka 实现注册与发现。',
        points: [
          '服务提供者启动时注册自身到注册中心。',
          '消费者从注册中心拉取可用实例列表。',
          '心跳保活，下线自动剔除。',
          'Nacos 兼具注册中心与配置中心。',
          '客户端负载均衡（如 Ribbon/Spring Cloud LoadBalancer）。',
        ],
        checklist: ['理解注册发现', '会接 Nacos/Eureka', '理解心跳'],
      },
      { slug: 'feign', title: '远程调用', tier: 'core', difficulty: 'medium',
        summary: 'OpenFeign 声明式调用与 RestTemplate。',
        points: [
          'OpenFeign：接口 + 注解即 HTTP 调用。',
          '配合负载均衡选择实例。',
          '超时与重试配置。',
          '传参与返回值自动序列化（JSON）。',
          '异常处理：熔断降级兜底。',
        ],
        code: { lang: 'java', body: '@FeignClient(name = "user-service")\npublic interface UserClient {\n  @GetMapping("/users/{id}") UserDTO get(@PathVariable Long id);\n}' },
        checklist: ['会用 OpenFeign', '理解负载均衡', '配置超时'],
      },
      { slug: 'gateway', title: '网关与路由', tier: 'key', difficulty: 'medium',
        summary: 'Spring Cloud Gateway 路由与过滤。',
        points: [
          '统一入口：路由、鉴权、限流、日志。',
          '断言（Predicate）匹配路由，过滤器（Filter）处理请求。',
          '网关层做 JWT 校验，下游服务信任内部请求。',
          '跨域（CORS）在网关统一处理。',
          '避免过度逻辑下沉到网关。',
        ],
        checklist: ['理解网关职责', '会配路由', '网关鉴权'],
      },
      { slug: 'resilience', title: '熔断与限流', tier: 'key', difficulty: 'hard',
        summary: 'Resilience4j/Sentinel 保障可用性。',
        points: [
          '熔断器：失败率超阈值则打开，快速失败。',
          '限流：令牌桶/漏桶控制 QPS。',
          '舱壁隔离：限制并发资源。',
          '降级：异常时返回兜底数据。',
          'Sentinel 提供可视化规则与热点限流。',
        ],
        checklist: ['理解熔断', '会用限流', '会降级兜底'],
      },
      { slug: 'config-trace', title: '配置中心与链路追踪', tier: 'key', difficulty: 'hard',
        summary: 'Nacos Config 与 Sleuth/Zipkin。',
        points: [
          '配置中心：配置外置、动态刷新，避免重启。',
          '链路追踪：TraceId 串联一次请求跨服务调用。',
          'Sleuth 生成追踪信息，Zipkin 可视化。',
          '日志归集（ELK）配合排查。',
          '监控告警闭环（Prometheus + Grafana）。',
        ],
        checklist: ['会用配置中心', '理解链路追踪', '有可观测体系'],
      },
    ],
    cases: [
      { slug: 'order-user', title: '订单-用户 微服务', tier: 'key', difficulty: 'hard',
        summary: '拆分订单服务与用户服务，经注册中心 + Feign 调用 + 网关路由。',
        points: [
          '两个独立 Spring Boot 服务。',
          'Nacos 注册发现。',
          '订单服务通过 Feign 调用户服务。',
          'Gateway 统一入口并鉴权。',
        ],
        checklist: ['服务可独立启动', 'Feign 调用通', '网关路由通'],
      },
    ],
  },
] };

DATA.python = pythonData;
DATA.ai = aiData;
DATA.interview = interviewData;

/* ============================ 执行 ============================ */
const want = process.argv[2];
const cats = want ? [want] : Object.keys(DATA);
let total = 0;
for (const catId of cats) {
  if (!DATA[catId]) {
    console.log(`⚠️  分类 ${catId} 暂无数据，跳过`);
    continue;
  }
  for (const mod of DATA[catId]) total += genModule(catId, mod);
}
console.log(`✅ 已生成 ${total} 篇内容（分类：${cats.filter((c) => DATA[c]).join(', ')}）`);
