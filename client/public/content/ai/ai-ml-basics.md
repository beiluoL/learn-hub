---
title: 机器学习核心概念
category: ai
level: beginner
readMinutes: 18
tags: "机器学习, 监督学习, 分类, 回归"
summary: 机器学习核心概念：监督/非监督/强化学习与常见算法。
order: 20
prereq:
---

## 什么是机器学习

机器学习（Machine Learning，ML）是人工智能的核心分支，其本质是让计算机从数据中自动学习规律和模式，而无需显式编程。Arthur Samuel 在 1959 年将其定义为"赋予计算机无需明确编程即可学习的能力"。

机器学习与传统编程的根本区别在于：传统编程是输入数据+规则→输出结果，而机器学习是输入数据+结果→输出规则（即模型）。

主流机器学习分为三大范式：

| 范式 | 数据特点 | 典型任务 | 代表算法 |
|------|---------|---------|---------|
| 监督学习 | 有标签数据 | 分类、回归 | KNN、决策树、随机森林、SVM |
| 非监督学习 | 无标签数据 | 聚类、降维 | K-Means、PCA、DBSCAN |
| 强化学习 | 环境交互反馈 | 游戏、机器人控制 | Q-Learning、DQN、PPO |

## 监督学习

监督学习从带标签的训练数据中学习从输入到输出的映射关系。

### 分类

分类任务的目标是预测离散的类别标签。典型场景包括垃圾邮件检测、图像识别、疾病诊断。

以一个简单的二分类为例，使用 scikit-learn 训练 KNN 分类器：

```python
from sklearn.neighbors import KNeighborsClassifier
from sklearn.model_selection import train_test_split
from sklearn.datasets import load_iris

iris = load_iris()
X, y = iris.data, iris.target

X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42
)

knn = KNeighborsClassifier(n_neighbors=5)
knn.fit(X_train, y_train)
accuracy = knn.score(X_test, y_test)
print(f"KNN 准确率: {accuracy:.3f}")
```

**核心注意**：K 值选择直接影响模型的偏差-方差权衡。K 过小容易过拟合，K 过大则欠拟合。

### 回归

回归任务预测连续数值，如房价预测、股票走势分析。以决策树回归为例：

```python
from sklearn.tree import DecisionTreeRegressor
from sklearn.metrics import mean_squared_error

dt = DecisionTreeRegressor(max_depth=5, random_state=42)
dt.fit(X_train, y_train)
y_pred = dt.predict(X_test)
mse = mean_squared_error(y_test, y_pred)
print(f"决策树回归 MSE: {mse:.4f}")
```

### 集成方法

随机森林和梯度提升（XGBoost/LightGBM）通过组合多个弱学习器提升性能：

```python
from sklearn.ensemble import RandomForestClassifier

rf = RandomForestClassifier(
    n_estimators=100,
    max_depth=10,
    random_state=42
)
rf.fit(X_train, y_train)
print(f"随机森林准确率: {rf.score(X_test, y_test):.3f}")

# 特征重要性分析
importances = rf.feature_importances_
for i, imp in enumerate(importances):
    print(f"特征 {i}: {imp:.4f}")
```

## 非监督学习

### 聚类

K-Means 是使用最广泛的聚类算法，将数据点划分为 K 个簇：

```python
from sklearn.cluster import KMeans
import matplotlib.pyplot as plt

# 寻找最优 K 值 (肘部法则)
inertias = []
K_range = range(1, 11)
for k in K_range:
    km = KMeans(n_clusters=k, random_state=42, n_init=10)
    km.fit(X)
    inertias.append(km.inertia_)

plt.plot(K_range, inertias, 'bx-')
plt.xlabel('K')
plt.ylabel('Inertia')
plt.title('肘部法则选择 K 值')
plt.show()
```

### 降维

PCA 通过线性变换将高维数据投影到低维空间，保留最大方差方向，常用于数据可视化和噪声过滤。

```python
from sklearn.decomposition import PCA

pca = PCA(n_components=2)
X_reduced = pca.fit_transform(X)
print(f"降维后形状: {X_reduced.shape}")
print(f"各主成分解释方差比: {pca.explained_variance_ratio_}")
```

## 过拟合与欠拟合

过拟合表现为模型在训练集上表现优秀但在测试集上表现较差，是机器学习的核心挑战。解决方法包括：

- **增加训练数据**：最有效的泛化手段
- **正则化**：L1（Lasso）产生稀疏解，L2（Ridge）收缩权重
- **早停**：验证集损失不再下降时停止训练
- **Dropout**：训练时随机丢弃神经元（神经网络专用）
- **交叉验证**：K 折交叉验证，取平均性能

欠拟合表现为模型在训练集和测试集上都表现不佳。原因通常是模型复杂度不够或特征工程不足。

## 训练/验证/测试集划分

标准划分比例为 70%/15%/15% 或 80%/10%/10%。关键原则是**测试集在整个流程中只使用一次**，避免信息泄露。

```python
from sklearn.model_selection import cross_val_score

# 5 折交叉验证
scores = cross_val_score(rf, X, y, cv=5, scoring='accuracy')
print(f"交叉验证平均准确率: {scores.mean():.3f} (+/- {scores.std() * 2:.3f})")
```

## 评估指标

不同任务需要选择合适的评估指标：

| 指标 | 公式/含义 | 适用场景 |
|------|----------|---------|
| 准确率 | (TP+TN)/(TP+TN+FP+FN) | 类别平衡 |
| 精确率 | TP/(TP+FP) | 关注误报 |
| 召回率 | TP/(TP+FN) | 关注漏报 |
| F1 | 2*(P*R)/(P+R) | 精确率与召回率平衡 |
| AUC-ROC | ROC 曲线下面积 | 二分类排序质量 |

**重要注意**：在不平衡数据集上，准确率会产生严重误导。例如 99% 的样本为正类，模型只需预测全部为正即可获得 99% 准确率。

```python
from sklearn.metrics import (
    classification_report,
    confusion_matrix,
    roc_auc_score
)

y_pred = rf.predict(X_test)
print(classification_report(y_test, y_pred))
print(f"AUC: {roc_auc_score(y_test, y_pred):.4f}")
```

## 实际开发中的应用 / 常见问题

### 如何处理不平衡数据？

使用 SMOTE 过采样、类别权重设置（`class_weight='balanced'`）或欠采样。在评估时必须使用精确率、召回率和 F1 而非准确率。

### 特征工程有多重要？

特征工程决定了模型性能的上限，而算法只是逼近这个上限。投入时间做特征选择、特征交叉、归一化/标准化（`StandardScaler`、`MinMaxScaler`）会有显著回报。

### 如何选择算法？

- 数据量小、可解释性要求高：决策树、逻辑回归
- 数据量大、性能优先：XGBoost、LightGBM
- 图像/文本/音频：深度学习（CNN/RNN/Transformer）
- 无标签数据探索：K-Means、DBSCAN、PCA

### 实际开发流程

标准的机器学习项目流程为：问题定义 → 数据收集 → 数据探索 → 特征工程 → 模型训练 → 超参调优 → 模型评估 → 模型部署 → 持续监控。
