---
question: 解释 GIL（全局解释器锁）是什么？它对多线程有什么影响？如何绕过？
category: python
difficulty: hard
tags: "GIL, 并发, 多线程"
order: 5
---

**GIL：**CPython 的全局解释器锁，同一时刻只有一个线程执行 Python 字节码。

**影响：**多线程无法利用多核做 CPU 并行；**IO 密集型**任务仍可通过多线程提升（等待 IO 时释放 GIL），但**CPU 密集型**多线程反而可能因切换变慢。

**绕过方案：**

-   CPU 密集 → 用 **多进程**（multiprocessing，各自独立 GIL）
-   IO 密集 → 用 **asyncio** 协程
-   用释放 GIL 的 C 扩展（如 NumPy 底层计算）
-   换无 GIL 实现（如 PyPy 部分场景、Python 3.13 实验性 nogil）
