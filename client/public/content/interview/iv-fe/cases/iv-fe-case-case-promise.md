---
title: 手写 Promise.all
category: interview
module: iv-fe
subcat: cases
timeline: false
level: hard
tier: key
readMinutes: 16
tags: "前端面试, 项目案例"
summary: 并发控制与结果聚合的 Promise.all 实现
order: 2
---

- 全部成功才 resolve，任一失败即 reject
- 结果按输入顺序返回
- 空数组直接 resolve

```javascript
function promiseAll(list) {
  return new Promise((resolve, reject) => {
    const res = []; let cnt = 0;
    list.forEach((p, i) => {
      Promise.resolve(p).then(v => {
        res[i] = v;
        if (++cnt === list.length) resolve(res);
      }, reject);
    });
  });
}
```

**自查清单**
- [ ] 顺序正确
- [ ] 失败短路
- [ ] 边界处理
