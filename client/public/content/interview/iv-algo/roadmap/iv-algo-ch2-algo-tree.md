---
title: 树与二叉树
category: interview
module: iv-algo
subcat: roadmap
timeline: false
level: hard
tier: key
readMinutes: 12
tags: "算法与数据结构, 树, 二叉树"
summary: 遍历、BST 与二叉树属性
order: 3
---

- 前中后序、层序遍历
- 递归与迭代两种写法
- BST 性质与平衡树

```java
void inorder(TreeNode n) {
    if (n == null) return;
    inorder(n.left);
    System.out.println(n.val);
    inorder(n.right);
}
```

> 递归转迭代常用显式栈。

**自查清单**
- [ ] 能写三种遍历
- [ ] 能说 BST 性质
