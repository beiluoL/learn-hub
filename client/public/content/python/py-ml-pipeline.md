---
title: Python 机器学习管线：scikit-learn 实战
category: python
level: intermediate
readMinutes: 18
tags: "sklearn, 机器学习, pipeline, 评估"
summary: Python 机器学习管线：scikit-learn 实战。
order: 34
prereq: python/py-data
---

scikit-learn 是 Python 机器学习的事实标准库，它提供了统一的 API 接口、丰富的算法实现和工程化的 Pipeline 机制。理解 sklearn 的工作流和评估体系，是数据科学工程师的必备技能。

## 训练 / 验证 / 测试集划分

数据集的正确划分是避免过拟合的第一道防线：

```python
from sklearn.model_selection import train_test_split

# 先分出测试集（不参与任何训练和调参）
X_train_val, X_test, y_train_val, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42, stratify=y
)

# 再从训练集中分出验证集（或使用交叉验证）
X_train, X_val, y_train, y_val = train_test_split(
    X_train_val, y_train_val, test_size=0.25, random_state=42
)
```

**注意**：`stratify=y` 确保划分后各类别比例与原数据集一致，这对类别不均衡的分类问题尤为重要。`random_state` 固定随机种子，保证划分可重现。

## Pipeline + ColumnTransformer

Pipeline 将预处理、特征工程、模型训练串联为一个整体，避免数据泄露：

```python
from sklearn.pipeline import Pipeline
from sklearn.compose import ColumnTransformer
from sklearn.preprocessing import StandardScaler, OneHotEncoder
from sklearn.impute import SimpleImputer
from sklearn.ensemble import RandomForestClassifier

# 数值特征处理管线
numeric_features = ['age', 'income', 'credit_score']
numeric_transformer = Pipeline([
    ('imputer', SimpleImputer(strategy='median')),  # 用中位数填充缺失值
    ('scaler', StandardScaler()),                    # 标准化
])

# 类别特征处理管线
categorical_features = ['education', 'employment_type']
categorical_transformer = Pipeline([
    ('imputer', SimpleImputer(strategy='constant', fill_value='missing')),
    ('onehot', OneHotEncoder(handle_unknown='ignore')),  # 处理未知类别
])

# 组合预处理器
preprocessor = ColumnTransformer([
    ('num', numeric_transformer, numeric_features),
    ('cat', categorical_transformer, categorical_features),
])

# 完整 Pipeline
pipeline = Pipeline([
    ('preprocessor', preprocessor),
    ('classifier', RandomForestClassifier(random_state=42)),
])

# 训练（数据泄露被 Pipeline 完全消除）
pipeline.fit(X_train, y_train)
score = pipeline.score(X_test, y_test)
```

Pipeline 的核心价值在于：`fit` 只在训练集上学习参数（如 `StandardScaler` 的均值和标准差），`transform`/`predict` 在测试集上直接应用已学习的参数，不会因数据泄露导致评估失真。

## 分类 / 回归常用模型

```python
from sklearn.linear_model import LogisticRegression, LinearRegression, Ridge
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.svm import SVC
from sklearn.tree import DecisionTreeClassifier
from sklearn.neighbors import KNeighborsClassifier

# 分类模型
models = {
    '决策树': DecisionTreeClassifier(max_depth=5),
    '随机森林': RandomForestClassifier(n_estimators=100),
    '梯度提升': GradientBoostingClassifier(n_estimators=100),
    '逻辑回归': LogisticRegression(max_iter=1000),
    'SVM': SVC(kernel='rbf'),
}

for name, model in models.items():
    model.fit(X_train, y_train)
    print(f'{name}: 准确率 {model.score(X_val, y_val):.3f}')
```

## 交叉验证与网格搜索 GridSearchCV

```python
from sklearn.model_selection import GridSearchCV, cross_val_score

param_grid = {
    'classifier__n_estimators': [50, 100, 200],      # 注意前缀 classifier__
    'classifier__max_depth': [5, 10, None],
    'classifier__min_samples_split': [2, 5, 10],
}

grid_search = GridSearchCV(
    pipeline,
    param_grid,
    cv=5,                       # 5 折交叉验证
    scoring='accuracy',
    n_jobs=-1,                  # 使用全部 CPU 核心
    verbose=1,
)

grid_search.fit(X_train, y_train)

print(f'最佳参数: {grid_search.best_params_}')
print(f'最佳验证得分: {grid_search.best_score_:.3f}')
print(f'测试集得分: {grid_search.score(X_test, y_test):.3f}')

# 使用最佳模型
best_model = grid_search.best_estimator_
y_pred = best_model.predict(X_test)
```

`n_jobs=-1` 让网格搜索使用所有 CPU 核心，大幅缩短调参时间。参数名中的 `classifier__` 前缀是 Pipeline 命名规则——`Pipeline名称__参数名`。

## 模型评估

```python
from sklearn.metrics import (
    classification_report, confusion_matrix,
    roc_auc_score, roc_curve, precision_recall_curve
)

# 分类报告
print(classification_report(y_test, y_pred, target_names=['不通过', '通过']))

# 混淆矩阵
cm = confusion_matrix(y_test, y_pred)
print(cm)

# ROC-AUC（二分类）
y_proba = best_model.predict_proba(X_test)[:, 1]  # 正类概率
auc = roc_auc_score(y_test, y_proba)
print(f'AUC: {auc:.3f}')

# 对于类别不均衡问题，使用 PR-AUC 而非 ROC-AUC
from sklearn.metrics import average_precision_score
pr_auc = average_precision_score(y_test, y_proba)
print(f'PR-AUC: {pr_auc:.3f}')
```

| 评估指标 | 适用场景 |
|----------|---------|
| 准确率（Accuracy） | 类别均衡的分类 |
| 精确率（Precision） | 关注误报（如垃圾邮件过滤） |
| 召回率（Recall） | 关注漏报（如疾病筛查） |
| F1-Score | 精确率和召回率的调和平均 |
| ROC-AUC | 二分类，类别相对均衡 |
| PR-AUC | 类别严重不均衡 |

## 特征重要性

```python
# 随机森林直接提供特征重要性
import pandas as pd

# 获取预处理后的特征名
cat_feature_names = pipeline.named_steps['preprocessor'] \
    .named_transformers_['cat'].named_steps['onehot'] \
    .get_feature_names_out(categorical_features)

all_features = numeric_features + list(cat_feature_names)

# 提取重要性并排序
importances = pipeline.named_steps['classifier'].feature_importances_
feature_importance = pd.DataFrame({
    'feature': all_features,
    'importance': importances
}).sort_values('importance', ascending=False)

print(feature_importance.head(10))
```

## 过拟合与正则化

识别过拟合的典型信号：训练集得分远高于验证集；模型对训练数据的微小变动极度敏感。

```python
# 对比训练集和验证集表现
train_score = pipeline.score(X_train, y_train)
val_score = pipeline.score(X_val, y_val)

print(f'训练集: {train_score:.3f}')
print(f'验证集: {val_score:.3f}')

if train_score - val_score > 0.05:
    print('警告：存在过拟合')

# 正则化：限制模型复杂度
# 决策树：增大 min_samples_split, min_samples_leaf
# 逻辑回归：增大 C 的倒数（减少 C）
# 随机森林：减小 max_depth，增大 min_samples_split
```

## 完整 ML Pipeline 示例

```python
import pandas as pd
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.pipeline import Pipeline
from sklearn.compose import ColumnTransformer
from sklearn.preprocessing import StandardScaler, OneHotEncoder
from sklearn.impute import SimpleImputer
from sklearn.ensemble import GradientBoostingClassifier
from sklearn.metrics import classification_report

# 1. 加载数据
df = pd.read_csv('loan_data.csv')
X = df.drop('approved', axis=1)
y = df['approved']

# 2. 构建 Pipeline
preprocessor = ColumnTransformer([
    ('num', Pipeline([('imputer', SimpleImputer(strategy='median')),
                       ('scaler', StandardScaler())]),
     ['income', 'age', 'credit_score']),
    ('cat', Pipeline([('imputer', SimpleImputer(strategy='constant', fill_value='unknown')),
                       ('onehot', OneHotEncoder(handle_unknown='ignore'))]),
     ['education', 'employment_type']),
])

model = Pipeline([
    ('preprocessor', preprocessor),
    ('classifier', GradientBoostingClassifier(n_estimators=100, learning_rate=0.1)),
])

# 3. 评估
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, stratify=y)
model.fit(X_train, y_train)
print(classification_report(y_test, model.predict(X_test)))
```

## 实际开发中的应用 / 常见问题

**Pipeline 中的数据泄露**：永远不要在训练前对整个数据集做预处理（如先 `StandardScaler().fit_transform(X)` 再划分数据集）。正确做法是使用 Pipeline，让 fit 只在训练集上进行。

**类别不平衡的处理**：使用 `class_weight='balanced'` 让模型自动加权；使用 SMOTE 过采样（`imblearn` 库）；选择对不均衡不敏感的评估指标（PR-AUC 而非 ROC-AUC）；调整分类阈值而非依赖默认的 0.5。

**特征工程与模型选择的顺序**：先做基础特征工程和简单模型（逻辑回归/决策树）建立基线，再逐步增加特征复杂度和模型复杂度。不要一上来就用深度学习——在很多表格数据任务中，梯度提升树（XGBoost/LightGBM）仍然是最优选择。
