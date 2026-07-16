---
question: 工厂模式、策略模式、观察者模式分别适用什么场景？有什么区别？
category: java
difficulty: middle
tags: "设计模式, 工厂模式, 策略模式, 开闭原则"
order: 57
---

**核心结论**：这三种模式分属不同的设计模式类型，解决不同的问题。**工厂模式**属于创建型模式，解决"如何创建对象"的问题，将对象创建与使用解耦；**策略模式**属于行为型模式，解决"如何选择算法"的问题，让算法族可以独立切换；**观察者模式**属于行为型模式，解决"如何通知"的问题，实现一对多的依赖通知。三者不冲突、可组合使用。

## 一、工厂模式（Factory Pattern）

### 适用场景

- 创建对象的逻辑复杂，需要集中管理对象生命周期
- 需要根据不同的条件创建不同的对象实例
- 客户端不需要知道具体类的创建细节，只需要使用接口
- 典型的"支付渠道选择"场景：根据用户选择创建微信支付、支付宝、银行卡等不同的支付对象

### 代码示例

```java
// 支付接口
interface PaymentService {
    void pay(BigDecimal amount);
}

// 具体实现
class WechatPayServiceImpl implements PaymentService {
    public void pay(BigDecimal amount) {
        System.out.println("微信支付: " + amount);
    }
}

class AliPayServiceImpl implements PaymentService {
    public void pay(BigDecimal amount) {
        System.out.println("支付宝支付: " + amount);
    }
}

// 工厂
class PaymentFactory {
    public static PaymentService create(String type) {
        switch (type) {
            case "wechat": return new WechatPayServiceImpl();
            case "alipay": return new AliPayServiceImpl();
            default: throw new IllegalArgumentException("不支持的支付方式");
        }
    }
}

// 使用
PaymentService payment = PaymentFactory.create("wechat");
payment.pay(new BigDecimal("99.00"));
```

### 核心思想

**创建解耦**：客户端只依赖抽象接口和工厂，不需要知道具体实现类的构造细节。当新增支付方式时，只需添加新实现类并修改工厂方法（或通过配置 + 反射避免修改），符合**开闭原则**（对扩展开放，对修改关闭）。

## 二、策略模式（Strategy Pattern）

### 适用场景

- 同一个问题有多种解决算法，需要在运行时动态切换
- 多个类仅在行为上有细微差别
- 需要消除大量 if-else 或 switch-case 的条件分支
- 典型场景：电商促销系统中的折扣计算（满减、打折、新用户首单等）

### 代码示例

```java
// 策略接口
interface DiscountStrategy {
    BigDecimal calculate(BigDecimal originalPrice);
}

// 具体策略
class NoDiscountStrategy implements DiscountStrategy {
    public BigDecimal calculate(BigDecimal price) { return price; }
}

class PercentageDiscountStrategy implements DiscountStrategy {
    private BigDecimal rate;
    public PercentageDiscountStrategy(BigDecimal rate) { this.rate = rate; }
    public BigDecimal calculate(BigDecimal price) {
        return price.multiply(BigDecimal.ONE.subtract(rate));
    }
}

class FullReductionStrategy implements DiscountStrategy {
    private BigDecimal threshold, reduction;
    public FullReductionStrategy(BigDecimal threshold, BigDecimal reduction) {
        this.threshold = threshold; this.reduction = reduction;
    }
    public BigDecimal calculate(BigDecimal price) {
        return price.compareTo(threshold) >= 0
            ? price.subtract(reduction) : price;
    }
}

// 上下文
class PriceCalculator {
    private DiscountStrategy strategy;
    public PriceCalculator(DiscountStrategy strategy) {
        this.strategy = strategy;
    }
    public void setStrategy(DiscountStrategy strategy) {
        this.strategy = strategy;
    }
    public BigDecimal calculate(BigDecimal price) {
        return strategy.calculate(price);
    }
}

// 使用
PriceCalculator calculator = new PriceCalculator(new NoDiscountStrategy());
calculator.setStrategy(new PercentageDiscountStrategy(new BigDecimal("0.2")));
BigDecimal finalPrice = calculator.calculate(new BigDecimal("100"));
```

### 核心思想

**算法替换**：将算法（策略）从上下文中抽离出来，变成独立的、可替换的组件。策略模式与工厂模式常组合使用：工厂创建策略对象，策略模式执行算法逻辑。

## 三、观察者模式（Observer Pattern）

### 适用场景

- 一个对象的状态变化需要通知多个其他对象
- 对象之间存在一对多的依赖关系
- 需要在解耦的前提下实现广播通知
- 典型场景：消息通知系统（用户下单后通知库存、物流、邮件等多方）；Spring 的 `ApplicationEvent` 机制

### 代码示例

```java
// 观察者接口
interface Observer {
    void update(String message);
}

class EmailObserver implements Observer {
    private String email;
    public EmailObserver(String email) { this.email = email; }
    public void update(String message) {
        System.out.println("发送邮件到 " + email + ": " + message);
    }
}

class SmsObserver implements Observer {
    private String phone;
    public SmsObserver(String phone) { this.phone = phone; }
    public void update(String message) {
        System.out.println("发送短信到 " + phone + ": " + message);
    }
}

// 主题（被观察者）
class OrderSubject {
    private List<Observer> observers = new ArrayList<>();

    public void attach(Observer observer) { observers.add(observer); }
    public void detach(Observer observer) { observers.remove(observer); }

    private void notifyAll(String message) {
        for (Observer o : observers) { o.update(message); }
    }

    public void createOrder() {
        // ... 创建订单逻辑
        notifyAll("订单已创建");
    }
}

// 使用
OrderSubject subject = new OrderSubject();
subject.attach(new EmailObserver("user@example.com"));
subject.attach(new SmsObserver("13800000000"));
subject.createOrder();
```

### 核心思想

**发布-订阅**：主题持有观察者列表，状态变化时遍历通知。观察者可以动态注册和注销，符合开闭原则。

## 三种模式对比

| 维度     | 工厂模式                   | 策略模式                   | 观察者模式                     |
|---------|--------------------------|--------------------------|------------------------------|
| 类型     | 创建型                    | 行为型                    | 行为型                         |
| 目的     | 封装对象创建逻辑，创建与使用解耦   | 封装可替换的算法族，消除条件分支  | 建立一对多依赖，状态变化自动通知     |
| 核心结构 | 工厂类 + 产品接口 + 具体产品  | 策略接口 + 具体策略 + 上下文   | 主题 + 观察者接口 + 具体观察者     |
| 关系     | 客户端调用工厂获取产品       | 客户端给上下文注入策略        | 观察者向主题注册，主题回调观察者    |
| 典型场景 | 支付渠道选择、数据库连接创建   | 折扣计算、排序策略、路由选择    | 事件通知、消息广播、GUI 事件绑定    |
| 变化点   | 变化的是"创建什么"          | 变化的是"怎么处理"          | 变化的是"通知谁"                |

## 面试官追问

**1. 策略模式如何避免大量 if-else？**

通过一个 Map 缓存所有策略实例，运行时根据 key 直接获取。结合工厂模式，将策略的创建和选择集中管理：

```java
class DiscountContext {
    private Map<String, DiscountStrategy> strategyMap = new HashMap<>();

    public DiscountContext() {
        strategyMap.put("percentage", new PercentageDiscountStrategy(new BigDecimal("0.2")));
        strategyMap.put("full_reduction", new FullReductionStrategy(new BigDecimal("200"), new BigDecimal("30")));
    }

    public BigDecimal calculate(String type, BigDecimal price) {
        DiscountStrategy strategy = strategyMap.get(type);
        if (strategy == null) throw new IllegalArgumentException("未知折扣类型");
        return strategy.calculate(price);
    }
}
```

**2. 三种模式可以组合使用吗？**

当然可以。以电商下单为例**：**工厂模式**根据用户等级创建对应的折扣策略对象，**策略模式**在计算价格时动态选择折扣算法，**观察者模式**在订单创建完成后通知多个服务（库存、物流、积分）。三种模式各司其职、互补协作。
