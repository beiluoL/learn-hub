---
title: 图与搜索
category: interview
module: iv-algo
subcat: roadmap
timeline: false
level: hard
tier: key
readMinutes: 13
tags: "算法与数据结构, 图, 搜索"
summary: DFS/BFS、拓扑排序与最短路
order: 4
---

- DFS 用栈/递归，BFS 用队列
- 拓扑排序判 DAG
- Dijkstra/A* 最短路

```plaintext
BFS(g, s):
  queue = [s]; visited = {s}
  while queue:
    u = queue.pop()
    for v in g[u]:
      if v not in visited:
        visited.add(v); queue.push(v)
```

> 无向图需记录父节点防回边。

**自查清单**
- [ ] 能写 BFS/DFS
- [ ] 能说拓扑排序
