---
title: Pandas 数据分析核心操作
category: python
level: intermediate
readMinutes: 20
tags: "Pandas, DataFrame, 数据分析, GroupBy"
summary: Pandas 数据分析核心操作。
order: 25
prereq: python/py-basics
---

Pandas 是 Python 数据分析的基石，提供了高性能的数据结构 DataFrame 和 Series，以及丰富的数据操作、清洗、聚合、可视化接口。无论是数据科学、金融分析还是业务报表，Pandas 都是必备工具箱。

## Series 与 DataFrame 创建

DataFrame 是 Pandas 的核心数据结构，可以理解为一个带标签的二维表格：

```python
import pandas as pd
import numpy as np

# 从字典创建 DataFrame
df = pd.DataFrame({
    'name': ['Alice', 'Bob', 'Charlie'],
    'age': [25, 30, 35],
    'city': ['Beijing', 'Shanghai', 'Shenzhen'],
    'salary': [15000, 22000, 28000]
})

# 从列表创建 Series
s = pd.Series([10, 20, 30], index=['a', 'b', 'c'], name='scores')

# 从 NumPy 数组创建
data = np.random.randn(5, 3)
df = pd.DataFrame(data, columns=['A', 'B', 'C'])
```

## 文件读写

Pandas 支持多种数据格式的读写，覆盖了常见的数据交换场景：

```python
# CSV 读写
df = pd.read_csv('data.csv', encoding='utf-8', parse_dates=['date'])
df.to_csv('output.csv', index=False)

# Excel 读写
df = pd.read_excel('data.xlsx', sheet_name='Sheet1')
df.to_excel('output.xlsx', sheet_name='结果', index=False)

# JSON 读写
df = pd.read_json('data.json', orient='records')
df.to_json('output.json', orient='records', force_ascii=False)

# 数据库读取
from sqlalchemy import create_engine
engine = create_engine('postgresql://user:pass@localhost/db')
df = pd.read_sql('SELECT * FROM orders', engine)
```

## 数据筛选

Pandas 提供了多种数据筛选方式，灵活且高效：

```python
# loc：基于标签索引
df.loc[0:2, ['name', 'age']]           # 前 3 行，指定列
df.loc[df['age'] > 25]                  # 条件筛选

# iloc：基于整数位置索引
df.iloc[0:3, 0:2]                       # 前 3 行，前 2 列

# query：字符串条件表达式
df.query('age > 25 and salary >= 20000')

# 多重条件
df[(df['age'] > 25) & (df['city'] == 'Shanghai')]
```

**注意**：使用 `loc` 进行条件筛选时，`df.loc[df['age'] > 25]` 等价于 `df[df['age'] > 25]`，但 `loc` 语义更清晰，尤其是在赋值场景中（`df.loc[condition, 'column'] = value` 可避免 SettingWithCopyWarning）。

## 缺失值处理

真实数据几乎总是有缺失值，Pandas 提供了完善的处理方案：

```python
# 检测缺失值
df.isnull().sum()          # 每列缺失值数量
df.isnull().sum() / len(df) * 100  # 缺失率百分比

# 删除缺失值
df.dropna()                # 删除含任何缺失值的行
df.dropna(subset=['age'])  # 只检查指定列
df.dropna(axis=1, thresh=3)  # 删除非空值少于 3 个的列

# 填充缺失值
df.fillna(0)                       # 常数填充
df['age'].fillna(df['age'].mean()) # 均值填充
df.fillna(method='ffill')          # 前向填充
df.fillna(method='bfill')          # 后向填充
```

## GroupBy 聚合

GroupBy 是数据分析中最高频的操作之一，Pandas 的聚合语法简洁而强大：

```python
# 基本分组聚合
df.groupby('city')['salary'].mean()     # 各城市平均薪资
df.groupby('city').agg({                # 多列多函数聚合
    'salary': ['mean', 'max', 'min'],
    'age': 'mean'
})

# transform：保持原始形状的聚合结果
df['avg_salary_by_city'] = df.groupby('city')['salary'].transform('mean')

# filter：按分组条件过滤
df.groupby('city').filter(lambda g: g['salary'].mean() > 20000)

# 自定义聚合函数
def salary_range(x):
    return x.max() - x.min()

df.groupby('city')['salary'].agg(['mean', salary_range])
```

## Merge / Join / Concat

数据合并是数据分析的基本功，Pandas 提供了多种合并方式：

```python
# merge：类似 SQL JOIN
orders = pd.DataFrame({'order_id': [1, 2, 3], 'user_id': [1, 2, 1], 'amount': [100, 200, 150]})
users = pd.DataFrame({'user_id': [1, 2, 4], 'name': ['Alice', 'Bob', 'David']})

# 内连接（默认）
pd.merge(orders, users, on='user_id', how='inner')

# 左连接：保留所有订单
pd.merge(orders, users, on='user_id', how='left')

# join：基于索引合并
df1.join(df2, how='inner')

# concat：纵向或横向拼接
pd.concat([df1, df2], axis=0)          # 纵向（堆叠）
pd.concat([df1, df2], axis=1)          # 横向（合并列）
pd.concat([df1, df2], ignore_index=True)  # 重置索引
```

## Apply 与向量化

Pandas 中处理数据有三种方式，性能差异巨大（向量化 >> apply >> 循环）：

```python
# 方式一：向量化（最高效）
df['tax'] = df['salary'] * 0.1

# 方式二：apply（中等效率）
df['category'] = df['salary'].apply(lambda x: 'high' if x > 20000 else 'low')

# 方式三：迭代（低效，避免使用）
for i, row in df.iterrows():
    df.at[i, 'bonus'] = row['salary'] * 0.05
```

## 日期处理

```python
# 解析日期列
df['date'] = pd.to_datetime(df['date_str'])

# 提取日期属性
df['year'] = df['date'].dt.year
df['month'] = df['date'].dt.month
df['dayofweek'] = df['date'].dt.dayofweek  # 0=周一

# 日期范围生成
pd.date_range('2024-01-01', periods=30, freq='D')

# 重采样（下采样到月）
df.set_index('date').resample('M')['amount'].sum()
```

## 实战：数据清洗到分析

以下是一个完整的数据分析流程示例：

```python
import pandas as pd

# 1. 读取数据
df = pd.read_csv('sales.csv', parse_dates=['order_date'])

# 2. 初步探索
print(df.info())
print(df.describe())
print(df.isnull().sum())

# 3. 数据清洗
df = df.dropna(subset=['amount', 'customer_id'])       # 删除关键字段缺失
df['amount'] = df['amount'].clip(lower=0)               # 去除负数
df['category'] = df['category'].str.strip().str.lower() # 统一格式

# 4. 特征工程
df['month'] = df['order_date'].dt.to_period('M')
df['order_count'] = df.groupby('customer_id')['order_id'].transform('count')

# 5. 分析
monthly = df.groupby('month').agg(
    revenue=('amount', 'sum'),
    orders=('order_id', 'nunique'),
    avg_order=('amount', 'mean')
).reset_index()

print(monthly)
```

## 实际开发中的应用 / 常见问题

**SettingWithCopyWarning**：这个警告通常发生在链式索引赋值时（如 `df[df['a']>0]['b']=1`）。根本原因是 Pandas 无法判断某个操作是返回视图还是副本。解决方案是使用 `.loc` 一次性完成筛选和赋值：`df.loc[df['a']>0, 'b'] = 1`。

**大文件读取优化**：用 `chunksize` 分批读取大 CSV 文件，配合 `dtype` 指定列类型减少内存占用。对于超大文件（>10GB），考虑使用 Dask 或 Polars 替代。

**Pandas 的内存管理**：`df.info(memory_usage='deep')` 查看真实内存占用。将 `object` 列转换为 `category` 类型可大幅减少内存（尤其是低基数字符串列）。用 `pd.to_numeric(df['col'], downcast='integer')` 缩小整数类型。
