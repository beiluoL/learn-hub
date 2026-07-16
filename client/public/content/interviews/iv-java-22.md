---
question: BIO、NIO、AIO 的区别是什么？NIO 的三大核心组件怎样配合？
category: java
difficulty: middle
tags: "BIO, NIO, AIO, Channel, Buffer, Selector"
order: 62
---

**核心结论**：Java IO 模型经历了从 BIO（同步阻塞）到 NIO（同步非阻塞/多路复用）再到 AIO（异步非阻塞）的演进。**BIO** 是一连接一线程的阻塞模型，适用于连接数少且固定的场景；**NIO** 通过单个线程管理多个连接（多路复用），适用于高并发短连接场景；**AIO** 基于回调通知机制，连接处理完成后操作系统主动通知，适用于连接数多且连接时间长的场景。目前主流框架（Netty、Tomcat 8+）均基于 NIO 或其优化实现。

## 三者核心对比

| 维度         | BIO                    | NIO                        | AIO                          |
|-------------|------------------------|----------------------------|------------------------------|
| 全称         | Blocking IO            | Non-blocking IO (New IO)   | Asynchronous IO              |
| IO 模型      | 同步阻塞                | 同步非阻塞 / 多路复用         | 异步非阻塞                    |
| 线程模型     | 一连接一线程            | 一个 Selector 管理多个 Channel | 有效的请求才启动线程，回调通知 |
| 触发方式     | 主动读写（阻塞等待）      | Selector 轮询就绪事件          | 操作系统回调通知              |
| 数据流向     | 单向 Stream             | 双向 Channel + Buffer        | 双向 Channel                 |
| 并发能力     | 低（线程数受限）         | 高（单线程管理数千连接）        | 高                           |
| 编程复杂度   | 简单                    | 复杂（需处理 Buffer/Selector）  | 中等（回调处理）               |
| Java 支持    | JDK 1.0               | JDK 1.4                     | JDK 1.7                      |
| 典型框架     | Tomcat 7 以下默认       | Netty, Tomcat 8+            | -                            |

## 一、BIO：一连接一线程

```java
// BIO 服务端示例
ServerSocket serverSocket = new ServerSocket(8080);
while (true) {
    Socket socket = serverSocket.accept(); // 阻塞，等待连接
    // 每个连接新开线程
    new Thread(() -> {
        try {
            InputStream in = socket.getInputStream();
            byte[] buffer = new byte[1024];
            int len = in.read(buffer);          // 阻塞，等待数据
            System.out.println("收到: " + new String(buffer, 0, len));
            socket.getOutputStream().write("OK".getBytes());
        } catch (IOException e) {
            e.printStackTrace();
        }
    }).start();
}
```

**BIO 的问题**：
- `accept()` 阻塞：没有新连接时，主线程什么也不做
- `read()` 阻塞：连接建立后如果客户端不发送数据，线程一直等待
- 线程消耗：每个连接一个线程，线程创建、切换开销大，大量连接时线程数爆炸（C10K 问题）

## 二、NIO 三大核心组件

### 1. Channel（通道）

Channel 是双向的数据传输通道，既可以读也可以写。与 Stream 的单向性不同：

```java
// 主要 Channel 实现：
// FileChannel      — 文件操作
// SocketChannel    — TCP 客户端/服务端
// ServerSocketChannel — TCP 服务端，监听新连接
// DatagramChannel  — UDP
```

### 2. Buffer（缓冲区）

Buffer 是内存中的一块区域，所有数据读写都通过 Buffer 进行。核心概念是四个指针：

```java
Buffer 结构：
position — 当前读写位置
limit    — 可读写的最大位置（读模式时等于写模式下的 position）
capacity — 缓冲区总容量
mark     — 标记位置（用于 reset）

// 读写模式切换的核心方法：
flip()    // 写模式 → 读模式（limit=position, position=0）
clear()   // 读模式 → 写模式（position=0, limit=capacity）
compact() // 压缩未读数据到开头，position 移到未读数据末尾
```

代码示例：

```java
// 写入数据到 Buffer
ByteBuffer buffer = ByteBuffer.allocate(1024);
buffer.put("Hello NIO".getBytes());  // position 移动到 9
buffer.flip();  // limit=9, position=0，切换为读模式

// 读取数据
byte[] data = new byte[buffer.remaining()];
buffer.get(data);           // position 移动到 9
System.out.println(new String(data));  // "Hello NIO"

buffer.clear();  // position=0, limit=1024 准备下次写入
```

### 3. Selector（选择器）

Selector 是多路复用的核心，单个线程通过轮询 Selector 可以管理多个 Channel：

```java
Selector selector = Selector.open();
SocketChannel channel = SocketChannel.open();
channel.configureBlocking(false);  // 必须设置为非阻塞

// 注册到 Selector，监听感兴趣的事件
channel.register(selector, SelectionKey.OP_READ | SelectionKey.OP_WRITE);
```

Selector 支持的四种事件：

| 事件类型               | 常量                | 触发条件           |
|-----------------------|--------------------|-------------------|
| 连接就绪               | OP_ACCEPT          | 有新的客户端连接     |
| 读就绪                 | OP_READ            | 通道中有数据可读     |
| 写就绪                 | OP_WRITE           | 通道可以写入数据     |
| 连接建立               | OP_CONNECT         | 客户端连接已建立     |

## 三大组件协作：NIO 服务端完整示例

```java
public class NioServer {
    public static void main(String[] args) throws IOException {
        // 1. 打开 ServerSocketChannel
        ServerSocketChannel serverChannel = ServerSocketChannel.open();
        serverChannel.bind(new InetSocketAddress(8080));
        serverChannel.configureBlocking(false); // 非阻塞

        // 2. 打开 Selector
        Selector selector = Selector.open();

        // 3. 将 ServerSocketChannel 注册到 Selector，监听 OP_ACCEPT 事件
        serverChannel.register(selector, SelectionKey.OP_ACCEPT);

        System.out.println("NIO 服务端启动，监听 8080...");

        while (true) {
            // 4. Selector 阻塞等待就绪事件
            selector.select(); // 阻塞直到至少有一个 Channel 就绪

            // 5. 获取就绪的事件集合
            Set<SelectionKey> selectedKeys = selector.selectedKeys();
            Iterator<SelectionKey> iterator = selectedKeys.iterator();

            while (iterator.hasNext()) {
                SelectionKey key = iterator.next();
                iterator.remove(); // 必须手动移除，否则会重复处理

                // 6. 处理 OP_ACCEPT 事件（新连接）
                if (key.isAcceptable()) {
                    ServerSocketChannel ssc = (ServerSocketChannel) key.channel();
                    SocketChannel clientChannel = ssc.accept();
                    clientChannel.configureBlocking(false);
                    // 注册到 Selector，监听读事件
                    clientChannel.register(selector, SelectionKey.OP_READ);
                    System.out.println("新客户端连接: " + clientChannel.getRemoteAddress());
                }

                // 7. 处理 OP_READ 事件（数据到达）
                if (key.isReadable()) {
                    SocketChannel clientChannel = (SocketChannel) key.channel();
                    ByteBuffer buffer = ByteBuffer.allocate(1024);
                    int len = clientChannel.read(buffer); // 非阻塞读
                    if (len > 0) {
                        buffer.flip();
                        String message = new String(buffer.array(), 0, buffer.remaining());
                        System.out.println("收到消息: " + message);
                        // 回写数据
                        buffer.clear();
                        buffer.put(("收到: " + message).getBytes());
                        buffer.flip();
                        clientChannel.write(buffer);
                    } else if (len == -1) {
                        // 客户端断开连接
                        System.out.println("客户端断开连接");
                        clientChannel.close();
                    }
                }
            }
        }
    }
}
```

**执行流程**：
```
单个线程循环 select() →
    有连接 → ACCEPT 事件 → 注册 READ 事件
    有数据 → READ 事件 → 读取数据 → 处理 → 响应
    全部处理完 → 继续 select() 等待下一轮
```

## 三、AIO

AIO 是 JDK 7 引入的异步 IO，操作完成后由操作系统通过回调通知：

```java
AsynchronousServerSocketChannel serverChannel =
    AsynchronousServerSocketChannel.open();
serverChannel.bind(new InetSocketAddress(8080));

serverChannel.accept(null, new CompletionHandler<AsynchronousSocketChannel, Object>() {
    @Override
    public void completed(AsynchronousSocketChannel clientChannel, Object attachment) {
        // 有新连接时回调
        serverChannel.accept(null, this); // 继续接收新连接

        ByteBuffer buffer = ByteBuffer.allocate(1024);
        clientChannel.read(buffer, buffer, new CompletionHandler<Integer, ByteBuffer>() {
            @Override
            public void completed(Integer result, ByteBuffer attachment) {
                // 数据读取完成时回调
                attachment.flip();
                String message = new String(attachment.array(), 0, attachment.remaining());
                System.out.println("收到: " + message);
            }
            @Override
            public void failed(Throwable exc, ByteBuffer attachment) {}
        });
    }
    @Override
    public void failed(Throwable exc, Object attachment) {}
});
```

## 面试官追问

**1. NIO 中的 Selector 有哪些重要方法？**

- `select()`：阻塞等待，直到至少一个 Channel 就绪（返回就绪 Channel 数）
- `select(long timeout)`：有超时时间的阻塞等待
- `selectNow()`：非阻塞，立即返回，没有就绪 Channel 时返回 0
- `selectedKeys()`：返回就绪的 SelectionKey 集合（必须手动从集合中移除已处理的 key，否则 key 会继续保留在集合中）
- `wakeup()`：让阻塞在 `select()` 上的线程立即返回

**2. 为什么 JDK NIO 的 Selector 有性能 Bug？**

JDK NIO 的 Selector 在 Linux 上基于 epoll 实现，存在著名的**空轮询 BUG**：即使没有就绪 Channel，`selector.select()` 也可能被唤醒，导致 CPU 100%。Netty 通过自定义 `select()` 策略解决了此问题：统计空轮询次数，若超过阈值（默认 512），则重建 Selector 并将所有 Channel 重新注册，从根本上规避 JDK 的缺陷。
