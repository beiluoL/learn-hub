---
title: 栈与队列
category: python
module: py-dsa
subcat: roadmap
timeline: false
level: medium
tier: core
readMinutes: 12
tags: 数据结构与算法
summary: 两种基础线性结构
order: 3
---

- 栈 LIFO，用 list 实现
- 队列 FIFO，用 deque
- 括号匹配用栈
- BFS 用队列

```python
from collections import deque

q = deque()
q.append(1)
q.append(2)
print(q.popleft())

stack = []
stack.append("a")
print(stack.pop())
```

**自查清单**
- [ ] 用 deque 实现队列
- [ ] 用栈做括号匹配
