---
title: NumPy 数组操作与广播机制
category: python
level: intermediate
readMinutes: 18
tags: "NumPy, ndarray, 广播, 向量化"
summary: NumPy 数组操作与广播机制。
order: 26
prereq: python/py-basics
---

NumPy 是 Python 科学计算的基础库，提供了高性能的多维数组对象 ndarray 和丰富的数学运算函数。它是 Pandas、scikit-learn、SciPy 等众多数据科学库的底层依赖。

## ndarray 创建与属性

ndarray 是 NumPy 的核心数据类型，是一个同构的多维数组容器：

```python
import numpy as np

# 从列表创建
arr = np.array([1, 2, 3, 4, 5])              # 一维
arr2d = np.array([[1, 2, 3], [4, 5, 6]])     # 二维

# 快捷创建函数
np.zeros((3, 4))       # 全 0 矩阵
np.ones((2, 3))        # 全 1 矩阵
np.eye(3)              # 单位矩阵
np.arange(0, 10, 2)    # 等差数列 [0,2,4,6,8]
np.linspace(0, 1, 5)   # 等间距 [0., 0.25, 0.5, 0.75, 1.]
np.random.randn(3, 4)  # 标准正态分布随机数

# 数组属性
arr.shape      # (5,) — 形状
arr.dtype      # int64 — 元素类型
arr.ndim       # 1 — 维度数
arr.size       # 5 — 元素总数
```

## 索引与切片

NumPy 的索引切片比 Python 原生列表更强大，支持布尔索引和花式索引：

```python
arr = np.arange(12).reshape(3, 4)
# array([[ 0,  1,  2,  3],
#        [ 4,  5,  6,  7],
#        [ 8,  9, 10, 11]])

# 基本切片（返回视图，而非副本）
arr[0, :]        # 第 0 行：[0, 1, 2, 3]
arr[:, 1]        # 第 1 列：[1, 5, 9]
arr[0:2, 1:3]    # 子区域

# 布尔索引
mask = arr > 5
arr[mask]        # [6, 7, 8, 9, 10, 11] — 所有大于 5 的元素

# 花式索引（整数数组索引）
arr[[0, 2]]      # 第 0 行和第 2 行
arr[:, [0, 3]]   # 第 0 列和第 3 列
```

**注意**：NumPy 切片返回的是视图而非副本，修改切片会影响原数组。这是 NumPy 高效的原因之一，但也容易导致意外的数据修改。如需副本，使用 `.copy()`。

## 通用函数 ufunc

NumPy 的通用函数（ufunc）对数组中的每个元素执行向量化运算，底层由 C 语言实现，速度远超 Python 循环：

```python
a = np.array([1, 4, 9, 16])

# 数学运算（逐元素）
np.sqrt(a)       # [1.  2.  3.  4.]
np.exp(a)        # 指数
np.log(a)        # 自然对数
np.sin(a)        # 三角函数

# 统计函数
a.sum()          # 30
a.mean()         # 7.5
a.std()          # 标准差
a.min(), a.max() # 1, 16
a.argmax()       # 最大值的索引：3

# 指定轴计算
arr2d = np.array([[1, 2, 3], [4, 5, 6]])
arr2d.sum(axis=0)  # 按列求和：[5, 7, 9]
arr2d.sum(axis=1)  # 按行求和：[6, 15]
```

## 广播规则

广播是 NumPy 处理不同形状数组之间运算的核心机制，它避免了显式复制数据：

```python
# 标量与数组：天然广播
arr = np.array([1, 2, 3])
arr + 10  # [11, 12, 13]

# 一维与二维
matrix = np.array([[1, 2, 3], [4, 5, 6]])  # (2, 3)
row_vector = np.array([10, 20, 30])          # (3,)
matrix + row_vector  # 每行加上 [10, 20, 30]

# 列向量广播
col_vector = np.array([[10], [20]])          # (2, 1)
matrix + col_vector  # 每列加上 [10, 20]
```

**广播的三条规则**：
1. 如果数组维度数不同，在较小的数组前面补 1
2. 如果某个维度大小不一致且其中一个为 1，则将大小为 1 的维度拉伸
3. 如果某个维度大小不一致且都不为 1，则报错

```python
# 规则示例：
# (3, 4) + (4,)    -> (3, 4) + (1, 4) -> (3, 4)  # 规则 1，然后规则 2
# (3, 4) + (3, 1)  -> (3, 4) + (3, 4)            # 规则 2
# (3, 4) + (3, 4)  -> 直接运算                    # 形状匹配
# (3, 4) + (2, 4)  -> 报错                        # 规则 3
```

## 形状变换

```python
arr = np.arange(12)

arr.reshape(3, 4)       # 重塑为 3x4
arr.reshape(3, -1)      # -1 表示自动计算：3x4
arr.flatten()           # 展平为一维（返回副本）
arr.ravel()             # 展平为一维（返回视图）

# 转置
arr.reshape(3, 4).T     # 转置：4x3
arr.reshape(3, 4).transpose(1, 0)  # 同上

# 堆叠
np.vstack([a, b])       # 垂直堆叠
np.hstack([a, b])       # 水平堆叠
np.concatenate([a, b], axis=0)  # 沿指定轴连接
```

## 随机数生成

NumPy 的 `random` 模块提供了丰富的概率分布采样：

```python
rng = np.random.default_rng(42)  # 推荐：新式随机数生成器

rng.random((3, 4))          # [0, 1) 均匀分布
rng.integers(0, 100, (3,4)) # 指定范围的随机整数
rng.normal(0, 1, (3, 4))    # 正态分布（均值 0，标准差 1）
rng.choice(arr, size=10, replace=False)  # 随机抽样（不放回）
```

## 与 Python List 性能对比

```python
import time

size = 1_000_000

# Python 列表
py_list = list(range(size))
start = time.time()
py_result = [x * 2 + 1 for x in py_list]
list_time = time.time() - start

# NumPy 向量化
np_arr = np.arange(size)
start = time.time()
np_result = np_arr * 2 + 1
numpy_time = time.time() - start

print(f'列表推导式: {list_time:.3f}s')
print(f'NumPy 向量化: {numpy_time:.6f}s')
# NumPy 通常快 10-100 倍
```

## 实际开发中的应用 / 常见问题

**NumPy 的视图与副本陷阱**：切片返回视图，花式索引和布尔索引返回副本。修改视图会影响原数组，修改副本则不会。不确定时使用 `np.shares_memory(a, b)` 检查两个数组是否共享内存。

**内存布局（C vs Fortran 顺序）**：NumPy 默认 C 顺序（行优先），可以通过 `order='F'` 指定 Fortran 顺序（列优先）。按正确顺序遍历可以提升缓存命中率：`for i in range(arr.shape[0]): arr[i, :]` 比 `arr[:, i]` 快得多。

**何时选择 NumPy 而非 Pandas**：纯数值计算（矩阵运算、线性代数、信号处理）用 NumPy；带标签的表格数据处理用 Pandas。NumPy 适合底层计算，Pandas 适合数据分析和处理。两者天然兼容，NumPy 数组可以直接传给 Pandas。
