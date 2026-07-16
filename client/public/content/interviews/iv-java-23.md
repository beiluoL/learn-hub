---
question: Netty 的线程模型是怎样的？BossGroup 与 WorkerGroup 如何协作？
category: java
difficulty: hard
tags: "Netty, Reactor, 线程模型, EventLoop, Pipeline"
order: 63
---

**核心结论**：Netty 采用**主从 Reactor 多线程模型**，由两个 NioEventLoopGroup 协作完成网络 IO 处理。**BossGroup**（主 Reactor）负责接收客户端连接，将成功建立连接的 SocketChannel 注册到 **WorkerGroup**（从 Reactor）的某个 EventLoop 上；**WorkerGroup** 负责处理已建立连接上的数据读写和业务逻辑。每个 EventLoop 是一个绑定了单个 Selector 的单线程执行器，一个 Channel 从注册到销毁始终由同一个 EventLoop 处理，保证了线程安全（无需同步），这也是 Netty 高性能的核心设计之一。

## 主从 Reactor 线程模型图

```
                    BossGroup (通常 1 个线程)
                    ┌─────────────────────────┐
客户端连接 ──────→   │ NioEventLoop (Selector) │
   (TCP连接)        │ 只处理 OP_ACCEPT 事件      │
                    └──────────┬──────────────┘
                               │
                    接收连接后，注册到 WorkerGroup
                               │
              ┌────────────────┼────────────────┐
              ↓                ↓                ↓
        ┌──────────┐   ┌──────────┐   ┌──────────┐
        │ EventLoop│   │ EventLoop│   │ EventLoop│  WorkerGroup
        │ (Selector)│  │ (Selector)│  │ (Selector)│  (CPU核数×2)
        │ OP_READ  │   │ OP_READ  │   │ OP_READ  │
        │ OP_WRITE │   │ OP_WRITE │   │ OP_WRITE │
        └────┬─────┘   └────┬─────┘   └────┬─────┘
             ↓              ↓              ↓
        ChannelPipeline  ChannelPipeline ChannelPipeline
             ↓              ↓              ↓
          业务 Handler    业务 Handler   业务 Handler
```

## 核心组件解析

### 1. EventLoopGroup / EventLoop

`EventLoopGroup` 是一个 EventLoop 线程池，Netty 使用 `NioEventLoopGroup` 作为实现：

```java
// 典型配置
EventLoopGroup bossGroup = new NioEventLoopGroup(1);     // Boss 一般 1 个线程
EventLoopGroup workerGroup = new NioEventLoopGroup();    // Worker 默认 CPU 核数 × 2
```

每个 `NioEventLoop` 内部持有一个**专属的 Selector** 和一个**单线程 Executor**。关键设计**：**一个 Channel 从注册到销毁，期间产生的所有 IO 事件都在同一个 EventLoop 线程中处理**。这避免了多线程并发问题，无需在 Handler 中加锁，是 Netty 实现"无锁化"设计的基础。

```java
// EventLoop 执行逻辑（简化）
while (!shutdown) {
    // 1. Selector 轮询 IO 事件
    selector.select();
    // 2. 处理就绪的 SelectionKey
    processSelectedKeys();
    // 3. 执行异步任务队列中的任务
    runAllTasks();
}
```

### 2. ChannelPipeline — 责任链处理

每个 Channel 绑定一个 `ChannelPipeline`，Pipeline 中维护一条双向的 `ChannelHandler` 链表：

```java
Pipeline 结构：
Head → [Handler1] → [Handler2] → [Handler3] → Tail

Inbound 事件（读数据）：从前向后传播
Outbound 事件（写数据）：从后向前传播
```

### 3. ChannelHandler 类型

| 类型                           | 方向      | 用途             |
|-------------------------------|----------|-----------------|
| ChannelInboundHandlerAdapter  | Inbound  | 处理入站事件（读、连接激活） |
| ChannelOutboundHandlerAdapter | Outbound | 处理出站事件（写、连接）     |
| ChannelDuplexHandler          | 双向     | 同时处理入站和出站        |

## 完整 Netty 服务端示例

```java
public class NettyServer {

    public static void main(String[] args) throws InterruptedException {
        // BossGroup：接收连接
        EventLoopGroup bossGroup = new NioEventLoopGroup(1);
        // WorkerGroup：处理读写
        EventLoopGroup workerGroup = new NioEventLoopGroup();

        try {
            ServerBootstrap bootstrap = new ServerBootstrap();
            bootstrap.group(bossGroup, workerGroup)
                     .channel(NioServerSocketChannel.class)
                     .childOption(ChannelOption.SO_KEEPALIVE, true)
                     .childHandler(new ChannelInitializer<SocketChannel>() {
                         @Override
                         protected void initChannel(SocketChannel ch) {
                             ChannelPipeline pipeline = ch.pipeline();
                             // 添加处理器（按顺序）
                             pipeline.addLast(new LineBasedFrameDecoder(1024));  // 粘包拆包
                             pipeline.addLast(new StringDecoder(CharsetUtil.UTF_8));
                             pipeline.addLast(new StringEncoder(CharsetUtil.UTF_8));
                             pipeline.addLast(new SimpleServerHandler());
                         }
                     });

            ChannelFuture future = bootstrap.bind(8080).sync();
            System.out.println("Netty 服务端启动，监听 8080");
            future.channel().closeFuture().sync();
        } finally {
            bossGroup.shutdownGracefully();
            workerGroup.shutdownGracefully();
        }
    }
}

// 自定义业务处理器
class SimpleServerHandler extends SimpleChannelInboundHandler<String> {
    @Override
    protected void channelRead0(ChannelHandlerContext ctx, String msg) {
        System.out.println("收到客户端消息: " + msg);
        // 响应客户端
        ctx.writeAndFlush("服务端已收到: " + msg);
    }

    @Override
    public void channelActive(ChannelHandlerContext ctx) {
        System.out.println("新客户端连接: " + ctx.channel().remoteAddress());
    }

    @Override
    public void channelInactive(ChannelHandlerContext ctx) {
        System.out.println("客户端断开连接: " + ctx.channel().remoteAddress());
    }

    @Override
    public void exceptionCaught(ChannelHandlerContext ctx, Throwable cause) {
        cause.printStackTrace();
        ctx.close(); // 发生异常时关闭连接
    }
}
```

## Boss 与 Worker 协作流程

```java
// NioServerSocketChannel 中 Boss EventLoop 处理逻辑
1. Boss EventLoop select() 检测到 OP_ACCEPT 事件
2. 调用 NioServerSocketChannel.doReadMessages() → java.nio.ServerSocketChannel.accept()
3. 获取 NioSocketChannel，将其注册到 WorkerGroup 中的某个 EventLoop
4. 注册时通过 pipeline.fireChannelRead(childChannel) 传播通知

// NioSocketChannel 中 Worker EventLoop 处理逻辑
1. Worker EventLoop select() 检测到被分配的 Channel 上发生事件
2. 如果是 OP_READ 事件 → pipeline.fireChannelRead() 传播给 Handler 处理
3. 业务 Handler 处理数据 → 写回响应 → pipeline.writeAndFlush()
```

Netty 选择 Worker 的策略是**轮询（Round-Robin）**，确保连接均匀分布。

## Netty 零拷贝机制

Netty 的"零拷贝"并非操作系统层面的 `sendfile()`，而是针对用户态内存操作：

| 特性              | 说明                                                |
|------------------|----------------------------------------------------|
| CompositeByteBuf | 将多个 ByteBuf 组合成一个逻辑视图，无需物理复制       |
| wrap 操作         | `Unpooled.wrappedBuffer()` 直接引用字节数组，不复制   |
| slice 操作        | `ByteBuf.slice()` 创建一段共享同一内存区域的视图      |
| FileRegion       | 使用 `FileChannel.transferTo()` 实现真正的 Zero Copy |

```java
// CompositeByteBuf 示例：合并多个 ByteBuf 而无需数据复制
ByteBuf header = Unpooled.copiedBuffer("Header", CharsetUtil.UTF_8);
ByteBuf body = Unpooled.copiedBuffer("Body", CharsetUtil.UTF_8);
CompositeByteBuf composite = Unpooled.compositeBuffer();
composite.addComponent(true, header);
composite.addComponent(true, body);
// composite 内部无数据拷贝，header 和 body 保持独立内存
```

## TCP 粘包/拆包及其解决

**原因**：
- 粘包：发送方连续发送小数据包，TCP Nagle 算法合并为一个包发送
- 拆包：发送方数据大于 TCP 发送缓冲区，拆分为多个包

**Netty 解决方案**（内置解码器）：

```java
// 方案 1：固定长度
pipeline.addLast(new FixedLengthFrameDecoder(20));

// 方案 2：行分隔符（最常用）
pipeline.addLast(new LineBasedFrameDecoder(1024));

// 方案 3：特殊分隔符
pipeline.addLast(new DelimiterBasedFrameDecoder(1024,
    Unpooled.copiedBuffer("$$".getBytes())));

// 方案 4：长度字段（最通用）
pipeline.addLast(new LengthFieldBasedFrameDecoder(
    65535,   // 最大帧长度
    0,       // 长度字段偏移量
    4,       // 长度字段字节数
    0, 4));  // 长度调整值
```

## 为什么不直接用 JDK NIO 而用 Netty

| 问题                      | JDK NIO                                | Netty 解决方案                               |
|--------------------------|----------------------------------------|--------------------------------------------|
| API 复杂度                | 需手动处理 Buffer 的 flip/clear         | ByteBuf 封装，读写模式自动切换               |
| Selector 空轮询 BUG       | epoll 假唤醒导致 CPU 100%               | 重建 Selector 策略（计数 > 512 则重建）       |
| 粘包/拆包                 | 需手动处理                             | 内置多种编解码器                            |
| 内存管理                 | ByteBuffer 不可变容量，内存池不可用     | ByteBuf 池化（PooledByteBufAllocator）     |
| 线程模型                 | 需自行设计 Reactor 模式                 | 完整的主从 Reactor 实现                     |
| 异常处理                 | 需大量 try-catch                       | ChannelPipeline 统一异常传播                |

## 面试官追问

**1. EventLoop 的线程绑定设计有什么优点？**

一个 Channel 的所有 IO 操作始终由同一个线程处理，天然避免了并发问题，**Handler 中完全不需要加锁**。同时，单线程处理也避免了线程上下文切换的开销。唯一的限制是：不能在 EventLoop 线程中执行耗时同步操作（如阻塞 IO），否则会阻塞该 EventLoop 上的所有 Channel。耗时操作应提交到独立的业务线程池。

**2. Netty 的心跳机制如何实现？**

Netty 提供 `IdleStateHandler` 实现连接空闲检测：

```java
pipeline.addLast(new IdleStateHandler(
    60,    // 读空闲超时（秒）
    30,    // 写空闲超时
    0));   // 读写空闲超时
pipeline.addLast(new HeartbeatHandler()); // 自定义处理

// 在 userEventTriggered 中发送心跳或关闭连接
public void userEventTriggered(ChannelHandlerContext ctx, Object evt) {
    if (evt instanceof IdleStateEvent) {
        IdleStateEvent e = (IdleStateEvent) evt;
        if (e.state() == IdleState.READER_IDLE) {
            ctx.close(); // 读超时，关闭连接
        } else if (e.state() == IdleState.WRITER_IDLE) {
            ctx.writeAndFlush(new HeartbeatMessage()); // 发送心跳
        }
    }
}
```
