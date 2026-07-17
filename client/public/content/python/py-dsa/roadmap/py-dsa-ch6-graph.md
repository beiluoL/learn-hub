---
title: 图与搜索
category: python
module: py-dsa
subcat: roadmap
timeline: false
level: hard
tier: extra
readMinutes: 16
tags: 数据结构与算法
summary: 邻接表与 DFS/BFS
order: 7
---

- 邻接表表示图
- DFS 深度优先
- BFS 广度优先
- visited 集合防环

```python
graph = {"a": ["b", "c"], "b": ["c"], "c": []}

def dfs(node, seen=None):
    seen = seen or set()
    seen.add(node)
    for nb in graph[node]:
        if nb not in seen:
            dfs(nb, seen)
    return seen

print(dfs("a"))
```

**自查清单**
- [ ] 邻接表建图
- [ ] 实现 DFS 遍历
