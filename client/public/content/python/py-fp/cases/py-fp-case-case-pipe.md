---
title: 数据处理管道
category: python
module: py-fp
subcat: cases
timeline: false
level: medium
tier: core
readMinutes: 22
tags: "函数式特性, 项目案例"
summary: 用函数式组合清洗数据
order: 1
---

- filter 过滤无效行
- map 转换字段
- 生成器流式处理大文件
- compose 组合多个步骤

```python
lines = ["1", "", "3", "4"]
clean = filter(bool, lines)
nums = map(int, clean)
print(list(nums))
```

**自查清单**
- [ ] 流式过滤转换
- [ ] 避免一次性载入
