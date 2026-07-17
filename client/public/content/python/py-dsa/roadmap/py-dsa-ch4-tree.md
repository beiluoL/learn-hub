---
title: 树与二叉树
category: python
module: py-dsa
subcat: roadmap
timeline: false
level: hard
tier: key
readMinutes: 16
tags: 数据结构与算法
summary: 递归遍历二叉树
order: 5
---

- 节点与左右子树
- 前序/中序/后序遍历
- 递归与栈实现
- 二叉搜索树性质

```python
class TNode:
    def __init__(self, v, l=None, r=None):
        self.v, self.l, self.r = v, l, r

def inorder(n):
    if not n:
        return []
    return inorder(n.l) + [n.v] + inorder(n.r)

root = TNode(2, TNode(1), TNode(3))
print(inorder(root))
```

**自查清单**
- [ ] 实现中序遍历
- [ ] 理解递归树
