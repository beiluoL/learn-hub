---
title: 银行账户系统
category: python
module: py-oop
subcat: cases
timeline: false
level: medium
tier: core
readMinutes: 25
tags: "面向对象, 项目案例"
summary: 用 OOP 建模账户与交易
order: 1
---

- Account 类管理余额
- deposit/withdraw 方法
- 继承出储蓄账户子类
- 用 property 校验余额

```python
class Account:
    def __init__(self, owner, balance=0):
        self.owner = owner
        self._balance = balance

    @property
    def balance(self):
        return self._balance

    def deposit(self, amount):
        if amount > 0:
            self._balance += amount

a = Account("小红")
a.deposit(100)
print(a.balance)
```

**自查清单**
- [ ] 能存款取款
- [ ] 余额不为负
