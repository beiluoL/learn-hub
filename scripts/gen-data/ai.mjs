export default [
  {
    id: 'ai-math',
    name: 'Python 与数学基础',
    tier: 'core',
    difficulty: 'medium',
    chapters: [
      {
        slug: 'python-recap',
        title: 'Python 数据科学速览',
        tier: 'basic',
        difficulty: 'easy',
        summary: '复习列表、字典、推导式与函数式工具',
        intro: '为后续数值计算打基础，重点掌握向量化思维。',
        points: ['列表推导式替代循环', 'zip/map/enumerate 用法', '可变与不可变对象区别'],
        code: { lang: 'python', body: `nums = [1, 2, 3, 4]
squares = [x * x for x in nums if x % 2 == 0]
print(squares)

pairs = list(zip(['a', 'b'], [1, 2]))
print(pairs)` },
        note: '避免在热点循环里写纯 Python 循环，优先用 NumPy。',
        checklist: ['能写出列表推导', '理解深浅拷贝'],
        tags: ['python', 'basics'],
        readMinutes: 10,
      },
      {
        slug: 'numpy',
        title: 'NumPy 基础',
        tier: 'basic',
        difficulty: 'easy',
        summary: 'ndarray 创建、切片与广播机制',
        intro: 'NumPy 是几乎所有 AI 库的地基。',
        points: ['ndarray 的 shape 与 dtype', '布尔索引与花式索引', '广播（broadcasting）规则'],
        code: { lang: 'python', body: `import numpy as np
arr = np.array([1, 2, 3])
print(arr.mean(), arr.std())

m = np.arange(9).reshape(3, 3)
print(m[:2, 1:])
print(m + np.array([10, 20, 30]))` },
        checklist: ['能 reshape 与索引', '理解广播'],
        tags: ['numpy'],
        readMinutes: 12,
      },
      {
        slug: 'linear-algebra',
        title: '线性代数',
        tier: 'core',
        difficulty: 'medium',
        summary: '矩阵乘法、转置、逆与特征分解',
        points: ['矩阵乘法 @ 的几何意义', '转置与单位阵', '特征值分解与 SVD 直觉'],
        code: { lang: 'python', body: `import numpy as np
A = np.array([[1, 2], [3, 4]])
print(A.T)
print(A @ A.T)

w, v = np.linalg.eig(A)
print(w)` },
        note: 'SVD 在降维与推荐系统中频繁出现。',
        checklist: ['会做矩阵乘法', '知道特征值含义'],
        tags: ['math', 'linalg'],
        readMinutes: 14,
      },
      {
        slug: 'calculus',
        title: '微积分与梯度',
        tier: 'core',
        difficulty: 'medium',
        summary: '导数、偏导数与梯度下降直觉',
        points: ['导数即变化率', '梯度指向上升最快方向', '学习率对收敛的影响'],
        code: { lang: 'python', body: `def grad_desc(lr=0.1, steps=20):
    x = 5.0
    for _ in range(steps):
        g = 2 * x          # f(x)=x^2 的导数
        x = x - lr * g
    return x

print(grad_desc())` },
        checklist: ['理解梯度下降更新公式', '调过学习率'],
        tags: ['calculus', 'optim'],
        readMinutes: 13,
      },
      {
        slug: 'probability',
        title: '概率与统计',
        tier: 'core',
        difficulty: 'medium',
        summary: '分布、期望、方差与贝叶斯',
        points: ['常见分布（正态/伯努利）', '期望与方差', '条件概率与贝叶斯公式'],
        code: { lang: 'python', body: `import numpy as np
samples = np.random.normal(0, 1, 10000)
print(samples.mean(), samples.var())

# 贝叶斯: P(A|B) = P(B|A)P(A)/P(B)
pa, pb_given_a = 0.01, 0.9
pb = pa * pb_given_a + 0.99 * 0.1
print(pa * pb_given_a / pb)` },
        checklist: ['会采样与算统计量', '理解贝叶斯'],
        tags: ['probability'],
        readMinutes: 14,
      },
      {
        slug: 'pandas',
        title: 'Pandas 数据处理',
        tier: 'basic',
        difficulty: 'easy',
        summary: 'DataFrame 选取、分组与缺失值',
        points: ['loc/iloc 选列选行', 'groupby 聚合', '缺失值处理'],
        code: { lang: 'python', body: `import pandas as pd
df = pd.DataFrame({'x': [1, 2, None], 'g': ['a', 'a', 'b']})
print(df.groupby('g').mean(numeric_only=True))
print(df.fillna(0))` },
        checklist: ['会 groupby', '能处理 NaN'],
        tags: ['pandas'],
        readMinutes: 11,
      },
      {
        slug: 'vectorization',
        title: '向量化与性能',
        tier: 'extra',
        difficulty: 'medium',
        summary: '用向量化替代循环提速',
        points: ['避免 Python 层循环', '利用 ufunc', '认识内存布局'],
        code: { lang: 'python', body: `import numpy as np
v = np.random.rand(1000000)
# 向量化
res = (v * 2 + 1).sum()
print(res)` },
        checklist: ['写出向量化代码', '对比循环性能'],
        tags: ['performance'],
        readMinutes: 10,
      },
    ],
    cases: [
      {
        slug: 'case-linear-fit',
        title: '案例：最小二乘线性回归',
        tier: 'key',
        difficulty: 'medium',
        summary: '从零实现一元线性回归并可视化',
        points: ['构造带噪声数据', '解析解求权重', '评估 MSE'],
        code: { lang: 'python', body: `import numpy as np
x = np.linspace(0, 10, 100)
y = 2 * x + 1 + np.random.randn(100)
X = np.vstack([x, np.ones_like(x)]).T
w = np.linalg.inv(X.T @ X) @ X.T @ y
print('slope, bias:', w)` },
        checklist: ['实现拟合', '计算误差'],
        readMinutes: 20,
      },
    ],
  },

  {
    id: 'ai-ml',
    name: '机器学习',
    tier: 'core',
    difficulty: 'medium',
    chapters: [
      {
        slug: 'ml-overview',
        title: '机器学习概览',
        tier: 'basic',
        difficulty: 'easy',
        summary: '监督/无监督/强化学习区分',
        points: ['监督与无监督的区别', '回归与分类', '训练/验证/测试划分'],
        code: { lang: 'python', body: `from sklearn.model_selection import train_test_split
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42)` },
        checklist: ['能划分数据集', '区分任务类型'],
        tags: ['ml', 'overview'],
        readMinutes: 10,
      },
      {
        slug: 'linear-models',
        title: '线性模型',
        tier: 'core',
        difficulty: 'easy',
        summary: '线性回归与逻辑回归',
        points: ['逻辑回归做分类', '正则化 L1/L2', '特征缩放重要性'],
        code: { lang: 'python', body: `from sklearn.linear_model import LogisticRegression
clf = LogisticRegression(max_iter=1000)
clf.fit(X_train, y_train)
print(clf.score(X_test, y_test))` },
        checklist: ['训练逻辑回归', '理解正则'],
        tags: ['linear', 'classification'],
        readMinutes: 12,
      },
      {
        slug: 'trees',
        title: '决策树与集成',
        tier: 'core',
        difficulty: 'medium',
        summary: '树模型、随机森林与梯度提升',
        points: ['信息增益与基尼系数', 'Bagging 与 Boosting', 'XGBoost/LightGBM 简介'],
        code: { lang: 'python', body: `from sklearn.ensemble import RandomForestClassifier
rf = RandomForestClassifier(n_estimators=100, random_state=0)
rf.fit(X_train, y_train)
print(rf.feature_importances_)` },
        checklist: ['训练森林', '查看特征重要性'],
        tags: ['tree', 'ensemble'],
        readMinutes: 14,
      },
      {
        slug: 'unsupervised',
        title: '无监督学习',
        tier: 'core',
        difficulty: 'medium',
        summary: '聚类与降维',
        points: ['K-Means 聚类', 'PCA 降维', 't-SNE 可视化'],
        code: { lang: 'python', body: `from sklearn.cluster import KMeans
km = KMeans(n_clusters=3, random_state=0).fit(X)
print(km.labels_)` },
        checklist: ['跑通聚类', '理解降维'],
        tags: ['clustering', 'pca'],
        readMinutes: 13,
      },
      {
        slug: 'feature-eng',
        title: '特征工程',
        tier: 'key',
        difficulty: 'medium',
        summary: '编码、缩放与特征选择',
        points: ['类别变量编码', '标准化/归一化', '缺失值插补'],
        code: { lang: 'python', body: `from sklearn.preprocessing import StandardScaler, OneHotEncoder
sc = StandardScaler().fit_transform(X_num)
enc = OneHotEncoder().fit_transform(X_cat)` },
        checklist: ['完成编码与缩放', '处理缺失'],
        tags: ['feature'],
        readMinutes: 13,
      },
      {
        slug: 'model-eval',
        title: '模型评估',
        tier: 'key',
        difficulty: 'medium',
        summary: '指标、交叉验证与偏差方差',
        points: ['精确率/召回率/F1', 'ROC 与 AUC', '交叉验证防过拟合'],
        code: { lang: 'python', body: `from sklearn.model_selection import cross_val_score
scores = cross_val_score(clf, X, y, cv=5, scoring='f1')
print(scores.mean())` },
        checklist: ['算多指标', '做交叉验证'],
        tags: ['evaluation'],
        readMinutes: 12,
      },
      {
        slug: 'pipeline',
        title: '流水线 Pipeline',
        tier: 'extra',
        difficulty: 'medium',
        summary: '组合预处理与模型',
        points: ['Pipeline 串接步骤', '网格搜索调参', '避免数据泄漏'],
        code: { lang: 'python', body: `from sklearn.pipeline import Pipeline
pipe = Pipeline([('sc', StandardScaler()), ('clf', LogisticRegression())])
pipe.fit(X_train, y_train)` },
        checklist: ['搭 Pipeline', '理解泄漏'],
        tags: ['pipeline'],
        readMinutes: 11,
      },
    ],
    cases: [
      {
        slug: 'case-churn',
        title: '案例：客户流失预测',
        tier: 'key',
        difficulty: 'medium',
        summary: '端到端二分类建模流程',
        points: ['EDA 与特征构造', '训练对比多个模型', '用 AUC 选优'],
        code: { lang: 'python', body: `from sklearn.ensemble import GradientBoostingClassifier
from sklearn.metrics import roc_auc_score
model = GradientBoostingClassifier().fit(X_train, y_train)
pred = model.predict_proba(X_test)[:, 1]
print(roc_auc_score(y_test, pred))` },
        checklist: ['完成建模', '输出 AUC'],
        readMinutes: 22,
      },
    ],
  },

  {
    id: 'ai-dl',
    name: '深度学习',
    tier: 'key',
    difficulty: 'hard',
    chapters: [
      {
        slug: 'perceptron',
        title: '神经元与感知机',
        tier: 'basic',
        difficulty: 'easy',
        summary: '线性组合加激活函数',
        points: ['加权求和与偏置', '激活函数作用', '单层表达力局限'],
        code: { lang: 'python', body: `import numpy as np
def neuron(x, w, b):
    return np.maximum(0, x @ w + b)   # ReLU
print(neuron(np.array([1, 2]), np.array([0.5, -1]), 0.1))` },
        checklist: ['实现前向计算', '认识 ReLU'],
        tags: ['dl', 'basics'],
        readMinutes: 10,
      },
      {
        slug: 'mlp-backprop',
        title: '多层网络与反向传播',
        tier: 'core',
        difficulty: 'hard',
        summary: '链式法则与梯度计算',
        points: ['前向与反向传播', '链式法则直觉', '梯度消失问题'],
        code: { lang: 'python', body: `import torch
x = torch.randn(8, 4, requires_grad=True)
w = torch.randn(4, 2)
y = x @ w
loss = y.pow(2).mean()
loss.backward()
print(x.grad.shape)` },
        checklist: ['理解反向传播', '看梯度形状'],
        tags: ['backprop', 'torch'],
        readMinutes: 16,
      },
      {
        slug: 'cnn',
        title: '卷积神经网络',
        tier: 'key',
        difficulty: 'hard',
        summary: '卷积、池化与特征图',
        points: ['卷积提取局部特征', '池化降维', '通道与感受野'],
        code: { lang: 'python', body: `import torch.nn as nn
conv = nn.Conv2d(3, 16, kernel_size=3, padding=1)
pool = nn.MaxPool2d(2)
out = pool(conv(torch.randn(1, 3, 32, 32)))
print(out.shape)` },
        checklist: ['搭 CNN 块', '算输出尺寸'],
        tags: ['cnn', 'cv'],
        readMinutes: 15,
      },
      {
        slug: 'rnn',
        title: '循环神经网络',
        tier: 'key',
        difficulty: 'hard',
        summary: '序列建模与 LSTM',
        points: ['RNN 处理时序', 'LSTM 门控机制', '梯度截断'],
        code: { lang: 'python', body: `import torch.nn as nn
rnn = nn.LSTM(input_size=10, hidden_size=32, batch_first=True)
x = torch.randn(2, 5, 10)
out, (h, c) = rnn(x)
print(out.shape)` },
        checklist: ['跑 LSTM', '理解门控'],
        tags: ['rnn', 'sequence'],
        readMinutes: 15,
      },
      {
        slug: 'transformer',
        title: 'Transformer 架构',
        tier: 'key',
        difficulty: 'hard',
        summary: '自注意力与位置编码',
        points: ['自注意力机制', '多头注意力', '残差与层归一化'],
        code: { lang: 'python', body: `import torch.nn as nn
attn = nn.MultiheadAttention(embed_dim=64, num_heads=8, batch_first=True)
x = torch.randn(2, 10, 64)
out, _ = attn(x, x, x)
print(out.shape)` },
        checklist: ['用多头注意力', '理解 QKV'],
        tags: ['transformer', 'attention'],
        readMinutes: 17,
      },
      {
        slug: 'training',
        title: '训练技巧',
        tier: 'core',
        difficulty: 'medium',
        summary: '优化器、损失与正则',
        points: ['Adam/SGD 选择', '学习率调度', 'Dropout 与 BatchNorm'],
        code: { lang: 'python', body: `import torch
opt = torch.optim.Adam(model.parameters(), lr=1e-3)
sched = torch.optim.lr_scheduler.CosineAnnealingLR(opt, T_max=10)` },
        checklist: ['配优化器', '加正则'],
        tags: ['training'],
        readMinutes: 13,
      },
      {
        slug: 'frameworks',
        title: 'PyTorch 实战',
        tier: 'core',
        difficulty: 'medium',
        summary: 'Dataset/DataLoader 与训练循环',
        points: ['Dataset 封装', 'DataLoader 批处理', '训练/验证循环'],
        code: { lang: 'python', body: `from torch.utils.data import DataLoader, TensorDataset
ds = TensorDataset(torch.randn(100, 4), torch.randint(0, 2, (100,)))
dl = DataLoader(ds, batch_size=16, shuffle=True)
for xb, yb in dl:
    print(xb.shape, yb.shape)
    break` },
        checklist: ['写训练循环', '用 DataLoader'],
        tags: ['pytorch'],
        readMinutes: 14,
      },
    ],
    cases: [
      {
        slug: 'case-mnist',
        title: '案例：MNIST 分类',
        tier: 'key',
        difficulty: 'hard',
        summary: '用 CNN 训练手写数字识别',
        points: ['构建 CNN', '训练并监控 loss', '测试集评估'],
        code: { lang: 'python', body: `import torch.nn as nn
model = nn.Sequential(
    nn.Conv2d(1, 8, 3), nn.ReLU(), nn.MaxPool2d(2),
    nn.Flatten(), nn.Linear(1352, 10))
print(model)` },
        checklist: ['训练模型', '达到合理精度'],
        readMinutes: 25,
      },
    ],
  },

  {
    id: 'ai-nlp',
    name: 'NLP 自然语言',
    tier: 'core',
    difficulty: 'medium',
    chapters: [
      {
        slug: 'tokenization',
        title: '分词与预处理',
        tier: 'basic',
        difficulty: 'easy',
        summary: '中文分词与子词切分',
        points: ['jieba 中文分词', 'BPE/WordPiece 子词', '去除停用词'],
        code: { lang: 'python', body: `import jieba
text = '深度学习推动自然语言处理发展'
print(list(jieba.cut(text)))` },
        checklist: ['跑分词', '理解子词'],
        tags: ['nlp', 'tokenize'],
        readMinutes: 10,
      },
      {
        slug: 'word-vectors',
        title: '词向量',
        tier: 'core',
        difficulty: 'medium',
        summary: 'Word2Vec 与词嵌入',
        points: ['CBOW 与 Skip-gram', '余弦相似度', '嵌入可视化'],
        code: { lang: 'python', body: `from gensim.models import Word2Vec
sentences = [['苹果', '手机'], ['香蕉', '水果']]
model = Word2Vec(sentences, vector_size=50, window=2, min_count=1)
print(model.wv['苹果'])` },
        checklist: ['训练词向量', '算相似度'],
        tags: ['embedding'],
        readMinutes: 13,
      },
      {
        slug: 'rnn-text',
        title: '序列模型做文本',
        tier: 'core',
        difficulty: 'medium',
        summary: '用 RNN/TextCNN 做分类',
        points: ['文本转序列', '填充与掩码', '情感分类'],
        code: { lang: 'python', body: `from torch.nn.utils.rnn import pad_sequence
seqs = [torch.tensor([1, 2, 3]), torch.tensor([4, 5])]
padded = pad_sequence(seqs, batch_first=True)
print(padded)` },
        checklist: ['做文本分类', '理解填充'],
        tags: ['text', 'rnn'],
        readMinutes: 13,
      },
      {
        slug: 'pretraining',
        title: '预训练模型',
        tier: 'key',
        difficulty: 'hard',
        summary: 'BERT/GPT 与迁移学习',
        points: ['掩码语言模型', '预训练加微调', '下游任务适配'],
        code: { lang: 'python', body: `from transformers import AutoTokenizer, AutoModel
tok = AutoTokenizer.from_pretrained('bert-base-chinese')
model = AutoModel.from_pretrained('bert-base-chinese')
inputs = tok('你好世界', return_tensors='pt')
print(model(**inputs).last_hidden_state.shape)` },
        checklist: ['加载预训练', '取句向量'],
        tags: ['pretrain', 'bert'],
        readMinutes: 16,
      },
      {
        slug: 'nlp-tasks',
        title: '常见 NLP 任务',
        tier: 'core',
        difficulty: 'medium',
        summary: 'NER/文本分类/问答',
        points: ['命名实体识别', '文本分类管线', '抽取式问答'],
        code: { lang: 'python', body: `from transformers import pipeline
clf = pipeline('sentiment-analysis', model='uer/roberta-base-finetuned-chinanews-chinese')
print(clf('这部电影非常精彩'))` },
        checklist: ['跑 NLP 管线', '理解任务'],
        tags: ['tasks'],
        readMinutes: 12,
      },
      {
        slug: 'evaluation-nlp',
        title: 'NLP 评估指标',
        tier: 'extra',
        difficulty: 'medium',
        summary: 'BLEU/ROUGE/准确率',
        points: ['生成任务指标', '分类指标', '人工评估重要性'],
        code: { lang: 'python', body: `from nltk.translate.bleu_score import sentence_bleu
ref = [['the', 'cat', 'sat']]
hyp = ['the', 'cat', 'sat']
print(sentence_bleu(ref, hyp))` },
        checklist: ['算 BLEU', '选合适指标'],
        tags: ['evaluation'],
        readMinutes: 11,
      },
      {
        slug: 'nlp-pipeline',
        title: 'NLP 工程化',
        tier: 'extra',
        difficulty: 'medium',
        summary: '批处理与推理优化',
        points: ['批量编码', '缓存嵌入', '服务化部署'],
        code: { lang: 'python', body: `texts = ['句子一', '句子二']
inputs = tok(texts, padding=True, truncation=True, return_tensors='pt')
print(inputs['input_ids'].shape)` },
        checklist: ['批量推理', '加缓存'],
        tags: ['serving'],
        readMinutes: 12,
      },
    ],
    cases: [
      {
        slug: 'case-sentiment',
        title: '案例：中文情感分析',
        tier: 'key',
        difficulty: 'medium',
        summary: '微调 BERT 做情感分类',
        points: ['准备标注数据', '微调分类头', '评估 F1'],
        code: { lang: 'python', body: `from transformers import AutoModelForSequenceClassification
model = AutoModelForSequenceClassification.from_pretrained(
    'bert-base-chinese', num_labels=2)
print(model.config.num_labels)` },
        checklist: ['微调模型', '报告 F1'],
        readMinutes: 22,
      },
    ],
  },

  {
    id: 'ai-cv',
    name: '计算机视觉',
    tier: 'core',
    difficulty: 'hard',
    chapters: [
      {
        slug: 'image-basics',
        title: '图像基础',
        tier: 'basic',
        difficulty: 'easy',
        summary: '像素、通道与变换',
        points: ['RGB 与灰度', '图像归一化', '几何变换'],
        code: { lang: 'python', body: `import numpy as np
img = np.random.rand(224, 224, 3).astype('float32')
img = (img - img.mean()) / img.std()
print(img.shape, img.mean())` },
        checklist: ['加载图像', '做归一化'],
        tags: ['cv', 'basics'],
        readMinutes: 10,
      },
      {
        slug: 'augmentation',
        title: '数据增强',
        tier: 'core',
        difficulty: 'easy',
        summary: '翻转裁剪与色彩抖动',
        points: ['随机翻转裁剪', '归一化标准化', '增强防过拟合'],
        code: { lang: 'python', body: `from torchvision import transforms
t = transforms.Compose([
    transforms.RandomHorizontalFlip(),
    transforms.ToTensor(),
    transforms.Normalize((0.5,), (0.5,))])
print(t)` },
        checklist: ['写增强管线', '理解作用'],
        tags: ['augment'],
        readMinutes: 11,
      },
      {
        slug: 'classification',
        title: '图像分类',
        tier: 'key',
        difficulty: 'hard',
        summary: 'CNN 与预训练骨干',
        points: ['ResNet 骨干', '迁移学习', 'Top-1 准确率'],
        code: { lang: 'python', body: `from torchvision.models import resnet18, ResNet18_Weights
model = resnet18(weights=ResNet18_Weights.DEFAULT)
print(model.fc)` },
        checklist: ['加载骨干', '替换分类头'],
        tags: ['classification'],
        readMinutes: 14,
      },
      {
        slug: 'detection',
        title: '目标检测',
        tier: 'key',
        difficulty: 'hard',
        summary: 'YOLO/SSD/Faster R-CNN',
        points: ['边界框与锚框', 'NMS 非极大抑制', 'mAP 评估'],
        code: { lang: 'python', body: `import torchvision
model = torchvision.models.detection.fasterrcnn_resnet50_fpn(weights='DEFAULT')
model.eval()
print(model)` },
        checklist: ['加载检测模型', '理解 mAP'],
        tags: ['detection'],
        readMinutes: 15,
      },
      {
        slug: 'segmentation',
        title: '图像分割',
        tier: 'key',
        difficulty: 'hard',
        summary: '语义与实例分割',
        points: ['像素级分类', 'U-Net 结构', 'Mask R-CNN'],
        code: { lang: 'python', body: `import torchvision
model = torchvision.models.segmentation.deeplabv3_resnet50(weights='DEFAULT')
print(model.backbone)` },
        checklist: ['加载分割模型', '理解掩码'],
        tags: ['segmentation'],
        readMinutes: 15,
      },
      {
        slug: 'cv-pretrain',
        title: '视觉预训练',
        tier: 'extra',
        difficulty: 'hard',
        summary: 'ViT 与自监督',
        points: ['图像分块序列化', '对比学习', 'MAE 掩码重建'],
        code: { lang: 'python', body: `from torchvision.models import vit_b_16, ViT_B_16_Weights
model = vit_b_16(weights=ViT_B_16_Weights.DEFAULT)
print(model.heads.head.in_features)` },
        checklist: ['用 ViT', '理解分块'],
        tags: ['vit'],
        readMinutes: 14,
      },
      {
        slug: 'cv-eval',
        title: 'CV 评估与可视化',
        tier: 'extra',
        difficulty: 'medium',
        summary: '指标与结果绘制',
        points: ['混淆矩阵', '画框与画掩码', '失败案例分析'],
        code: { lang: 'python', body: `import matplotlib.pyplot as plt
plt.imshow(img)
plt.axis('off')
plt.show()` },
        checklist: ['画可视化', '分析错误'],
        tags: ['evaluation'],
        readMinutes: 11,
      },
    ],
    cases: [
      {
        slug: 'case-catdog',
        title: '案例：猫狗分类',
        tier: 'key',
        difficulty: 'hard',
        summary: '迁移学习训练二分类',
        points: ['准备数据集', '微调 ResNet', '测试精度'],
        code: { lang: 'python', body: `from torchvision.models import resnet18
model = resnet18(weights='DEFAULT')
model.fc = torch.nn.Linear(model.fc.in_features, 2)
print(model.fc)` },
        checklist: ['完成训练', '报告精度'],
        readMinutes: 24,
      },
    ],
  },

  {
    id: 'ai-llm',
    name: '大模型 LLM',
    tier: 'key',
    difficulty: 'hard',
    chapters: [
      {
        slug: 'llm-intro',
        title: '大模型基础',
        tier: 'basic',
        difficulty: 'medium',
        summary: '规模定律与自回归生成',
        points: ['Scaling Law', '自回归生成', 'Tokenizer 作用'],
        code: { lang: 'python', body: `from transformers import AutoTokenizer
tok = AutoTokenizer.from_pretrained('gpt2')
ids = tok('Hello world', return_tensors='pt').input_ids
print(ids.shape)` },
        checklist: ['理解生成', '会分词'],
        tags: ['llm', 'basics'],
        readMinutes: 11,
      },
      {
        slug: 'prompt',
        title: 'Prompt 工程',
        tier: 'key',
        difficulty: 'easy',
        summary: '指令、少样本与思维链',
        points: ['清晰指令编写', 'Few-shot 示例', 'Chain-of-Thought'],
        code: { lang: 'plaintext', body: `任务: 将用户问题分类为 售前/售后/其他
示例:
Q: 怎么退款? -> 售后
Q: 有优惠吗? -> 售前
Q: 今天天气? -> 其他` },
        checklist: ['写少样本', '用 CoT'],
        tags: ['prompt'],
        readMinutes: 10,
      },
      {
        slug: 'finetune',
        title: '微调方法',
        tier: 'key',
        difficulty: 'hard',
        summary: '全量与参数高效微调',
        points: ['全参数微调', 'LoRA/QLoRA', '数据格式构造'],
        code: { lang: 'python', body: `from peft import LoraConfig, get_peft_model
cfg = LoraConfig(r=8, lora_alpha=16, target_modules=['q_proj', 'v_proj'])
model = get_peft_model(base_model, cfg)
model.print_trainable_parameters()` },
        checklist: ['配置 LoRA', '算可训练参数量'],
        tags: ['finetune', 'lora'],
        readMinutes: 16,
      },
      {
        slug: 'rag',
        title: '检索增强 RAG',
        tier: 'key',
        difficulty: 'hard',
        summary: '向量检索与上下文拼接',
        points: ['文档切分与嵌入', '向量库检索', '上下文拼接生成'],
        code: { lang: 'python', body: `from sentence_transformers import SentenceTransformer
enc = SentenceTransformer('all-MiniLM-L6-v2')
vecs = enc.encode(['文档一', '文档二'])
print(vecs.shape)` },
        checklist: ['建索引', '做检索'],
        tags: ['rag', 'vector'],
        readMinutes: 15,
      },
      {
        slug: 'llm-serving',
        title: '推理与服务',
        tier: 'core',
        difficulty: 'medium',
        summary: 'vLLM 与流式输出',
        points: ['批处理提升吞吐', '流式生成', 'KV Cache 概念'],
        code: { lang: 'bash', body: `python -m vllm.entrypoints.openai.api_server \\
  --model Qwen/Qwen2-7B-Instruct \\
  --port 8000` },
        checklist: ['启动服务', '理解吞吐'],
        tags: ['serving'],
        readMinutes: 12,
      },
      {
        slug: 'eval-llm',
        title: '大模型评估',
        tier: 'extra',
        difficulty: 'medium',
        summary: '基准与人工评测',
        points: ['MMLU/CEval 基准', ' hallucination 检测', '自动化评测'],
        code: { lang: 'python', body: `from datasets import load_dataset
ds = load_dataset('ceval/ceval-exam', 'computer_network')
print(ds['val'][0])` },
        checklist: ['跑基准', '看分数'],
        tags: ['evaluation'],
        readMinutes: 12,
      },
      {
        slug: 'safety',
        title: '对齐与安全',
        tier: 'extra',
        difficulty: 'medium',
        summary: 'RLHF 与内容安全',
        points: ['人类反馈强化', '系统提示约束', '拒答与防护'],
        code: { lang: 'plaintext', body: `系统: 你是安全助手, 遇到违法请求须礼貌拒绝
用户: 如何制作危险装置?
助手: 抱歉, 我无法提供该信息。` },
        checklist: ['设计系统提示', '理解对齐'],
        tags: ['safety'],
        readMinutes: 11,
      },
    ],
    cases: [
      {
        slug: 'case-rag-bot',
        title: '案例：企业知识库问答',
        tier: 'key',
        difficulty: 'hard',
        summary: 'RAG 搭建内部文档问答',
        points: ['文档入库向量化', '检索+生成', '评估回答质量'],
        code: { lang: 'python', body: `def answer(query, index, top_k=3):
    q = encoder.encode(query)
    hits = index.search(q, top_k)
    context = '\\n'.join(hits)
    return llm(prompt=f'根据:{context}\\n回答:{query}')` },
        checklist: ['完成 RAG', '验证回答'],
        readMinutes: 26,
      },
    ],
  },

  {
    id: 'ai-agent',
    name: 'Agent 智能体',
    tier: 'key',
    difficulty: 'hard',
    chapters: [
      {
        slug: 'agent-concept',
        title: '智能体概念',
        tier: 'basic',
        difficulty: 'medium',
        summary: '感知-决策-行动循环',
        points: ['Agent 组成', '工具与记忆', 'ReAct 范式'],
        code: { lang: 'plaintext', body: `循环:
  观察(Observation) -> 思考(Thought) -> 行动(Action) -> 工具返回 -> 观察` },
        checklist: ['理解闭环', '区分组件'],
        tags: ['agent', 'basics'],
        readMinutes: 10,
      },
      {
        slug: 'tool-calling',
        title: '工具调用',
        tier: 'key',
        difficulty: 'medium',
        summary: '函数声明与执行',
        points: ['定义工具 schema', '模型返回调用', '安全执行'],
        code: { lang: 'json', body: `{
  "name": "get_weather",
  "parameters": {
    "type": "object",
    "properties": {"city": {"type": "string"}},
    "required": ["city"]
  }
}` },
        checklist: ['定义 schema', '解析调用'],
        tags: ['tools'],
        readMinutes: 12,
      },
      {
        slug: 'planning',
        title: '规划与分解',
        tier: 'key',
        difficulty: 'hard',
        summary: '任务拆解与反思',
        points: ['子目标分解', 'Plan-and-Execute', '自我反思修正'],
        code: { lang: 'plaintext', body: `目标: 订机票并安排接机
子任务:
1. 查询航班
2. 比较价格
3. 预订
4. 预约接机` },
        checklist: ['做任务分解', '加反思'],
        tags: ['planning'],
        readMinutes: 13,
      },
      {
        slug: 'memory',
        title: '记忆机制',
        tier: 'key',
        difficulty: 'medium',
        summary: '短期与长期记忆',
        points: ['对话历史缓存', '向量长期记忆', '摘要压缩'],
        code: { lang: 'python', body: `class Memory:
    def __init__(self):
        self.buffer = []
    def add(self, msg):
        self.buffer.append(msg)
    def recall(self, k=5):
        return self.buffer[-k:]` },
        checklist: ['实现记忆', '做检索'],
        tags: ['memory'],
        readMinutes: 12,
      },
      {
        slug: 'multi-agent',
        title: '多智能体协作',
        tier: 'extra',
        difficulty: 'hard',
        summary: '角色分工与通信',
        points: ['角色设定', '消息传递', '协作编排'],
        code: { lang: 'python', body: `agents = {'researcher': ..., 'writer': ...}
msg = agents['researcher'].run('调研主题')
result = agents['writer'].run(msg)` },
        checklist: ['搭多智能体', '串联流程'],
        tags: ['multi-agent'],
        readMinutes: 14,
      },
      {
        slug: 'framework',
        title: 'Agent 框架',
        tier: 'core',
        difficulty: 'medium',
        summary: 'LangChain/LangGraph 简介',
        points: ['Chain 与节点', '状态图编排', '可观测性'],
        code: { lang: 'python', body: `from langgraph.graph import StateGraph
g = StateGraph(dict)
g.add_node('call_tool', lambda s: s)
g.set_entry_point('call_tool')
app = g.compile()` },
        checklist: ['用框架', '画状态图'],
        tags: ['framework'],
        readMinutes: 13,
      },
      {
        slug: 'agent-eval',
        title: '智能体评估',
        tier: 'extra',
        difficulty: 'hard',
        summary: '任务成功率与轨迹',
        points: ['成功率指标', '轨迹回放', '成本与延迟'],
        code: { lang: 'python', body: `def success_rate(trials):
    ok = sum(1 for t in trials if t['done'])
    return ok / len(trials)` },
        checklist: ['算成功率', '分析轨迹'],
        tags: ['evaluation'],
        readMinutes: 11,
      },
    ],
    cases: [
      {
        slug: 'case-research-agent',
        title: '案例：自动化调研助手',
        tier: 'key',
        difficulty: 'hard',
        summary: '串联检索、写稿与校验',
        points: ['搜索工具调用', '生成报告', '事实校验'],
        code: { lang: 'python', body: `plan = agent.plan('调研向量数据库')
for step in plan:
    tool_out = agent.call_tool(step)
    report += agent.write(step, tool_out)
print(agent.verify(report))` },
        checklist: ['跑通流程', '产出报告'],
        readMinutes: 25,
      },
    ],
  },

  {
    id: 'ai-deploy',
    name: '推理部署',
    tier: 'core',
    difficulty: 'hard',
    chapters: [
      {
        slug: 'onnx',
        title: 'ONNX 导出',
        tier: 'core',
        difficulty: 'medium',
        summary: '模型转 ONNX 跨框架',
        points: ['导出为 ONNX', '检查算子兼容', '推理一致性'],
        code: { lang: 'python', body: `import torch
torch.onnx.export(model, dummy, 'model.onnx',
                 input_names=['x'], output_names=['y'])` },
        checklist: ['导出 ONNX', '验证输出'],
        tags: ['onnx', 'export'],
        readMinutes: 12,
      },
      {
        slug: 'triton',
        title: 'Triton 推理服务',
        tier: 'key',
        difficulty: 'hard',
        summary: '多模型并发与批处理',
        points: ['模型仓库结构', '动态批处理', 'ensemble 编排'],
        code: { lang: 'yaml', body: `name: "resnet"
platform: "onnxruntime_onnx"
max_batch_size: 32
dynamic_batching:
  preferred_batch_size: [8, 16]` },
        checklist: ['写配置', '启动服务'],
        tags: ['triton', 'serving'],
        readMinutes: 15,
      },
      {
        slug: 'quantization',
        title: '模型量化',
        tier: 'key',
        difficulty: 'hard',
        summary: 'INT8/FP16 与权重量化',
        points: ['PTQ 与 QAT', '量化压缩比', '精度损失评估'],
        code: { lang: 'python', body: `import torch.quantization as q
model.qconfig = q.get_default_qconfig('fbgemm')
model = q.prepare(model)
model = q.convert(model)` },
        checklist: ['量化模型', '测精度'],
        tags: ['quantization'],
        readMinutes: 14,
      },
      {
        slug: 'vector-db',
        title: '向量数据库',
        tier: 'core',
        difficulty: 'medium',
        summary: '近似最近邻检索',
        points: ['Faiss/Milvus 选型', 'HNSW 索引', '相似度度量'],
        code: { lang: 'python', body: `import faiss
index = faiss.IndexFlatL2(768)
index.add(vectors)
D, I = index.search(query, k=5)` },
        checklist: ['建索引', '做检索'],
        tags: ['vector', 'faiss'],
        readMinutes: 13,
      },
      {
        slug: 'optimization',
        title: '推理优化',
        tier: 'key',
        difficulty: 'hard',
        summary: '算子融合与 KV Cache',
        points: ['图优化', 'TensorRT 加速', '显存复用'],
        code: { lang: 'bash', body: `trtexec --onnx=model.onnx --saveEngine=model.engine \\
  --fp16 --workspace=2048` },
        checklist: ['跑 TensorRT', '对比延迟'],
        tags: ['optimization'],
        readMinutes: 14,
      },
      {
        slug: 'serving-api',
        title: 'API 服务化',
        tier: 'core',
        difficulty: 'medium',
        summary: 'FastAPI 封装与并发',
        points: ['请求校验', '异步处理', '限流与监控'],
        code: { lang: 'python', body: `from fastapi import FastAPI
app = FastAPI()
@app.post('/predict')
def predict(x: list[float]):
    return {'out': model(x).tolist()}` },
        checklist: ['写接口', '做压测'],
        tags: ['api'],
        readMinutes: 12,
      },
      {
        slug: 'monitor',
        title: '监控与成本',
        tier: 'extra',
        difficulty: 'medium',
        summary: '指标、日志与计费',
        points: ['延迟与吞吐', '错误率监控', 'Token 成本统计'],
        code: { lang: 'python', body: `import time
t0 = time.time()
out = model(x)
print('latency_ms', (time.time() - t0) * 1000)` },
        checklist: ['加埋点', '算成本'],
        tags: ['monitor'],
        readMinutes: 11,
      },
    ],
    cases: [
      {
        slug: 'case-deploy-api',
        title: '案例：模型上线为 API',
        tier: 'key',
        difficulty: 'hard',
        summary: '量化+FastAPI+压测全流程',
        points: ['导出并量化', '起服务', '压测达标'],
        code: { lang: 'bash', body: `uvicorn serve:app --host 0.0.0.0 --port 8080 --workers 4` },
        checklist: ['完成部署', '达标延迟'],
        readMinutes: 24,
      },
    ],
  },
];
