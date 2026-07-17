---
title: 字符串处理
category: python
module: py-basics
subcat: roadmap
timeline: false
level: easy
tier: core
readMinutes: 10
tags: Python 基础语法
summary: 切片、格式化与常用方法
order: 4
---

- 切片 [start:end:step] 截取子串
- str.split() / join() 切分与拼接
- strip() 去除空白字符
- in 判断子串包含关系
- replace() 替换内容

```python
text = "  hello,world  "
parts = text.strip().split(",")
print(parts)
joined = "-".join(parts)
print(joined)

s = "python"
print(s[::-1])
print("py" in s)
```

**自查清单**
- [ ] 能把逗号字符串拆成列表
- [ ] 会反转字符串
- [ ] 掌握 strip 去空格
