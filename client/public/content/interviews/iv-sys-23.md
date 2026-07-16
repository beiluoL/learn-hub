---
question: Kubernetes 核心组件有哪些？Pod、Service、Deployment 之间是什么关系？
category: system
difficulty: hard
tags: "Kubernetes, Pod, Service, Deployment, 容器编排"
order: 78
---

## Kubernetes 核心组件与资源关系

**核心结论**：Pod 是最小调度单元，封装容器并提供共享上下文；Deployment 管理 Pod 的期望状态和滚动更新；Service 为 Pod 提供稳定的网络访问入口。三者构成 K8s 应用编排的核心三角。

---

### K8s 核心组件架构

```
                    +-------------+
                    |  API Server | (集群统一入口，REST API)
                    +------+------+
              +------------+------------+
              v            v            v
     +------------+  +----------+  +------------------+
     |  Scheduler |  |   etcd   |  | Controller Manager|
     |  (调度 Pod) |  | (键值存储)|  | (控制器循环)      |
     +------------+  +----------+  +------------------+

每个 Worker Node 上：
     +-----------------------------+
     |          kubelet            | (节点代理，管理 Pod 生命周期)
     |     +------------------+    |
     |     | Container Runtime|    | (containerd / CRI-O)
     |     +------------------+    |
     |     +------------------+    |
     |     |    kube-proxy    |    | (网络代理，维护 iptables/IPVS 规则)
     |     +------------------+    |
     +-----------------------------+
```

**组件职责**：

| 组件 | 角色 | 核心职责 |
|------|------|----------|
| API Server | 控制面入口 | 提供 REST API，所有操作唯一的读写入口，鉴权和准入控制 |
| etcd | 数据持久化 | 分布式键值数据库，存储所有集群状态数据（一致性由 Raft 保证） |
| Scheduler | 调度器 | 监听未调度的 Pod，选择最优 Node 运行（资源/亲和性/污点） |
| Controller Manager | 控制器 | 运行多个控制循环（DeploymentController、NodeController 等），确保期望状态=实际状态 |
| kubelet | 节点代理 | 接收 PodSpec，管理容器生命周期，上报 Node 和 Pod 状态 |
| kube-proxy | 网络代理 | 为 Service 配置转发规则（iptables/IPVS），实现服务发现和负载均衡 |
| Container Runtime | 容器运行时 | 拉取镜像、创建/启动/停止容器（通过 CRI 接口） |

---

### Pod、Service、Deployment 关系

```
Deployment
|
+-- ReplicaSet (自动管理)
|   +-- Pod-1 (10.244.1.5)  
|   +-- Pod-2 (10.244.3.8)  
|   +-- Pod-3 (10.244.2.2)  
|
Service (ClusterIP: 10.100.0.10，Cluster DNS: api.default.svc.cluster.local)
  -- 根据 Label Selector 匹配 Pod，提供稳定的虚拟 IP
|
Ingress
+-- 将外部 HTTP/HTTPS 流量路由到 Service
```

**Pod**：K8s 中可部署的最小计算单元。一个 Pod 包含：
- 一个或多个容器（通常一对一，Sidecar 模式下多容器）。
- 共享的 Linux Namespace（共享网络——同一个 IP + 端口空间、共享 IPC）。
- 共享的存储卷（Volume）。
- Pod 生命周期是短暂的（因为节点故障、扩缩容随时被替换），IP 地址不固定。

**Deployment**：声明式管理 Pod 副本的控制器。提供：

- 副本数管理（replicas）。
- 滚动更新（RollingUpdate，逐个替换旧 Pod）。
- 回滚（kubectl rollout undo）。
- 暂停/恢复（kubectl rollout pause/resume）。

**Service**：为一组 Pod 提供稳定的网络入口。核心解决 Pod IP 不固定的问题：

| 类型 | 访问范围 | 典型场景 |
|------|----------|----------|
| ClusterIP | 集群内部 | 微服务间通信 |
| NodePort | ClusterIP + 节点端口 | 开发/调试，直接暴露端口 |
| LoadBalancer | 云厂商 LB + NodePort | 生产环境外网访问 |
| ExternalName | DNS CNAME 映射 | 将外部服务映射为集群内 Service |

Service 通过 **Label Selector** 发现 Pod。kube-proxy 在节点上维护 iptables/IPVS 规则，将访问 Service ClusterIP 的流量负载均衡到对应的 Pod。

**Ingress**：七层 HTTP/HTTPS 路由。提供：
- 基于域名的路由（a.example.com → service-a、b.example.com → service-b）。
- TLS 终止。
- 路径重写。

---

### 声明式配置示例

```yaml
# Deployment
apiVersion: apps/v1
kind: Deployment
metadata:
  name: api-server
spec:
  replicas: 3
  selector:
    matchLabels:
      app: api
  template:
    metadata:
      labels:
        app: api
    spec:
      containers:
        - name: api
          image: myapp/api:v1.2.0
          ports:
            - containerPort: 3000
          resources:
            requests:
              cpu: "250m"
              memory: "256Mi"
            limits:
              cpu: "500m"
              memory: "512Mi"
          readinessProbe:
            httpGet:
              path: /health
              port: 3000
            initialDelaySeconds: 5
            periodSeconds: 10
          livenessProbe:
            httpGet:
              path: /live
              port: 3000
            initialDelaySeconds: 15
            periodSeconds: 20
---
# Service
apiVersion: v1
kind: Service
metadata:
  name: api-service
spec:
  selector:
    app: api
  ports:
    - port: 80
      targetPort: 3000
  type: ClusterIP
---
# Ingress
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: api-ingress
spec:
  rules:
    - host: api.example.com
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: api-service
                port:
                  number: 80
```

---

### Deployment 滚动更新策略

| 字段 | 含义 | 示例值 |
|------|------|--------|
| maxSurge | 最多超出 replicas 的 Pod 数 | 25% 或绝对数值 |
| maxUnavailable | 最多不可用的 Pod 数 | 25% 或绝对数值 |

以 replicas=4、maxSurge=1、maxUnavailable=1 为例，滚动更新过程中集群中 Pod 数量在 3~5 之间波动。每替换一个旧 Pod，就创建一个新 Pod，逐个完成。

---

### 面试官追问

**追问**：Deployment 和 StatefulSet 的区别？什么时候用 StatefulSet？

**回答**：Deployment 的 Pod 是无状态、可互换的——Pod 名称随机（api-8f4d9c-abcde），IP 不固定。StatefulSet 为每个 Pod 分配固定的序号（db-0、db-1、db-2）和稳定的网络标识（Pod 名称不变），每个 Pod 绑定独立的持久化卷（PVC）。典型场景：数据库集群（MySQL/PostgreSQL/MongoDB 主从）、消息队列（Kafka）、需要固定标识的有状态应用。StatefulSet 启动和停止都是有序的（0→1→2 启动，2→1→0 停止）。

**追问**：kube-proxy 的 iptables 模式和 IPVS 模式有什么区别？

**回答**：iptables 模式为每个 Service 生成 iptables 规则链，规则数量与 Service+Endpoint 数线性相关。当 Service 数量很大（如 5000+）时，iptables 规则更新延迟严重（需要整体替换）。IPVS 模式使用内核的 IPVS 模块做负载均衡（类似 LVS），性能高、支持多种调度算法（rr、lc、sh），规则更新效率高。生产环境大规模集群推荐 IPVS 模式。

**追问**：Pod 的生命周期有哪几个阶段？

**回答**：Pending（已提交到 API Server，调度中或镜像拉取中）→ Running（至少一个容器在运行）→ Succeeded（所有容器正常退出，返回码 0）→ Failed（至少一个容器非零退出）→ Unknown（kubelet 失联，状态未知）。此外还有 ContainerCreating、Terminating 等容器级别的状态。Pod 是"一次性"的——退出后不会再自动重启（RestartPolicy 控制的是容器重启而非 Pod 重建）。
