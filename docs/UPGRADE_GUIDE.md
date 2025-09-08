# Dify 平台升级指导手册

本文档提供 Dify 平台在不同部署方式下的升级指导，帮助您安全地将现有系统升级到包含权限控制优化的自定义版本。

## 📋 升级前准备工作（通用）

### 1. 确认当前部署方式

```bash
# 检查是否使用 Docker Compose
ls -la | grep docker-compose
docker-compose ps

# 检查单独的 Docker 容器
docker ps | grep dify

# 检查 Kubernetes 部署
kubectl get pods | grep dify

# 检查源码部署
ps aux | grep -E "(python.*app\.py|npm.*dev|pnpm.*dev)"
```

### 2. 数据备份（必须执行）

```bash
# PostgreSQL 数据备份
docker exec dify-postgres pg_dump -U postgres dify > dify_backup_$(date +%Y%m%d_%H%M%S).sql

# 或者如果是外部数据库
pg_dump -h <host> -U <username> -d dify > dify_backup_$(date +%Y%m%d_%H%M%S).sql

# 文件存储备份
cp -r ./storage ./storage_backup_$(date +%Y%m%d_%H%M%S)
```

### 3. 记录当前配置

```bash
# 记录当前环境变量
env | grep -E "(DIFY|DB|REDIS|VECTOR)" > current_config.env
```

---

## 🐳 方式一：Docker Compose 部署升级

### 识别方法
```bash
# 存在这些文件表示是 Docker Compose 部署
ls -la | grep -E "(docker-compose\.yml|docker-compose\.yaml)"
docker-compose ps  # 能看到多个相关容器
```

### 升级步骤

#### 1. 停止服务
```bash
cd /path/to/dify
docker-compose down
```

#### 2. 拉取最新代码
```bash
# 备份当前代码
mv dify dify_backup_$(date +%Y%m%d_%H%M%S)

# 拉取你的修改版本
git clone https://github.com/QQhuxuhui/dify.git
cd dify
git checkout custom-dev-1.1.3
```

#### 3. 迁移配置文件
```bash
# 复制原来的配置
cp ../dify_backup_*/docker/.env ./docker/.env
cp ../dify_backup_*/docker/.env.local ./docker/.env.local  # 如果存在

# 或者手动对比配置差异
diff ../dify_backup_*/docker/.env ./docker/.env.example
```

#### 4. 重新构建和启动
```bash
cd docker

# 重新构建镜像（包含你的修改）
docker-compose build

# 启动服务
docker-compose up -d

# 检查服务状态
docker-compose ps
docker-compose logs -f
```

#### 5. 数据库迁移
```bash
# 进入 API 容器执行迁移
docker-compose exec api flask db upgrade
```

---

## 📦 方式二：Docker 单容器部署升级

### 识别方法
```bash
# 看到独立的 dify 相关容器
docker ps | grep dify
# 没有 docker-compose.yml 文件
# 可能有自定义的启动脚本
```

### 升级步骤

#### 1. 记录当前容器信息
```bash
# 记录容器配置
docker inspect dify-api > dify-api-config.json
docker inspect dify-web > dify-web-config.json
docker inspect dify-worker > dify-worker-config.json  # 如果存在

# 记录数据卷和网络
docker volume ls | grep dify
docker network ls | grep dify
```

#### 2. 构建新镜像
```bash
# 拉取你的代码
git clone https://github.com/QQhuxuhui/dify.git
cd dify
git checkout custom-dev-1.1.3

# 构建 API 镜像
cd api
docker build -t dify-api:custom-1.1.3 .

# 构建 Web 镜像  
cd ../web
docker build -t dify-web:custom-1.1.3 .
```

#### 3. 停止旧容器
```bash
docker stop dify-api dify-web dify-worker
docker rm dify-api dify-web dify-worker
```

#### 4. 启动新容器
```bash
# 启动 API 容器（示例，需根据实际配置调整）
docker run -d \
  --name dify-api \
  --network dify-network \
  -p 5001:5001 \
  -v dify_storage:/app/storage \
  -e DB_HOST=postgres \
  -e REDIS_HOST=redis \
  dify-api:custom-1.1.3

# 启动 Web 容器
docker run -d \
  --name dify-web \
  --network dify-network \
  -p 3000:3000 \
  -e EDITION=SELF_HOSTED \
  -e DEPLOY_ENV=PRODUCTION \
  -e CONSOLE_API_URL=http://dify-api:5001 \
  dify-web:custom-1.1.3

# 运行数据库迁移
docker exec dify-api flask db upgrade
```

---

## 💻 方式三：源码部署升级

### 识别方法
```bash
# 能看到 Python 和 Node.js 进程
ps aux | grep -E "(python.*app\.py|npm.*dev|pnpm.*dev)"
# 存在源码目录结构
ls -la | grep -E "(api|web)" 
```

### 升级步骤

#### 1. 停止服务
```bash
# 停止前端服务
pkill -f "npm run dev"
pkill -f "pnpm dev"

# 停止后端服务  
pkill -f "python app.py"
pkill -f "gunicorn"

# 停止 Worker 进程
pkill -f "celery worker"
```

#### 2. 备份当前代码
```bash
# 备份整个项目目录
cp -r /path/to/current/dify /path/to/dify_backup_$(date +%Y%m%d_%H%M%S)
```

#### 3. 更新代码
```bash
cd /path/to/dify

# 拉取最新代码
git remote add custom https://github.com/QQhuxuhui/dify.git
git fetch custom
git checkout custom-dev-1.1.3

# 或者重新克隆
# cd ..
# git clone https://github.com/QQhuxuhui/dify.git dify_new
# mv dify dify_old && mv dify_new dify
```

#### 4. 更新依赖
```bash
# 更新后端依赖
cd api
poetry install
# 或者
pip install -r requirements.txt

# 更新前端依赖
cd ../web  
pnpm install
# 或者
npm install
```

#### 5. 迁移配置
```bash
# 复制环境配置
cp ../dify_backup_*/api/.env ./api/.env
cp ../dify_backup_*/web/.env.local ./web/.env.local  # 如果存在

# 运行数据库迁移
cd api
poetry run flask db upgrade
# 或者
python -m flask db upgrade
```

#### 6. 重启服务
```bash
# 启动后端 API
cd api
nohup poetry run python app.py > ../api.log 2>&1 &
# 或者使用 gunicorn
# nohup gunicorn --bind 0.0.0.0:5001 app:app > ../api.log 2>&1 &

# 启动 Worker（如果需要）
nohup poetry run celery -A app.celery worker -Q dataset,generation,mail,ops_trace --loglevel INFO > ../worker.log 2>&1 &

# 启动前端
cd ../web
nohup pnpm dev > ../web.log 2>&1 &
# 或者生产环境
# pnpm build
# nohup pnpm start > ../web.log 2>&1 &
```

---

## ☸️ 方式四：Kubernetes 部署升级

### 识别方法
```bash
# 检查 K8s 资源
kubectl get pods | grep dify
kubectl get deployments | grep dify
kubectl get services | grep dify

# 检查是否存在 K8s 配置文件
ls -la | grep -E "(k8s|kubernetes|\.yaml|\.yml)"
```

### 升级步骤

#### 1. 检查当前部署
```bash
# 查看当前部署状态
kubectl get pods,deployments,services -l app=dify
kubectl describe deployment dify-api
kubectl describe deployment dify-web

# 备份当前配置
kubectl get deployment dify-api -o yaml > dify-api-deployment-backup.yaml
kubectl get deployment dify-web -o yaml > dify-web-deployment-backup.yaml
kubectl get configmap dify-config -o yaml > dify-config-backup.yaml
```

#### 2. 构建新镜像并推送
```bash
# 拉取代码
git clone https://github.com/QQhuxuhui/dify.git
cd dify
git checkout custom-dev-1.1.3

# 构建镜像（需要有 Docker Registry）
docker build -t your-registry/dify-api:custom-1.1.3 ./api
docker build -t your-registry/dify-web:custom-1.1.3 ./web

# 推送镜像
docker push your-registry/dify-api:custom-1.1.3
docker push your-registry/dify-web:custom-1.1.3
```

#### 3. 更新部署
```bash
# 更新镜像版本
kubectl set image deployment/dify-api api=your-registry/dify-api:custom-1.1.3
kubectl set image deployment/dify-web web=your-registry/dify-web:custom-1.1.3

# 或者编辑 deployment
kubectl edit deployment dify-api
kubectl edit deployment dify-web

# 检查滚动更新状态
kubectl rollout status deployment/dify-api
kubectl rollout status deployment/dify-web
```

#### 4. 执行数据库迁移
```bash
# 创建一个临时 Job 来运行迁移
kubectl create job dify-migration --from=cronjob/dify-migration
# 或者直接在 pod 中执行
kubectl exec -it $(kubectl get pod -l app=dify-api -o jsonpath='{.items[0].metadata.name}') -- flask db upgrade
```

---

## 💾 数据备份与恢复指导

### PostgreSQL 数据库备份与恢复

#### 备份数据库
```bash
# Docker 环境下备份
docker exec dify-postgres pg_dump -U postgres -d dify > dify_backup_$(date +%Y%m%d_%H%M%S).sql

# 外部数据库备份
pg_dump -h <hostname> -U <username> -d dify > dify_backup_$(date +%Y%m%d_%H%M%S).sql

# 备份特定表（如果只需要用户数据）
pg_dump -h <hostname> -U <username> -d dify -t users -t workspaces -t datasets > user_data_backup.sql
```

#### 恢复数据库
```bash
# Docker 环境下恢复
docker exec -i dify-postgres psql -U postgres -d dify < dify_backup_20240308_143022.sql

# 外部数据库恢复
psql -h <hostname> -U <username> -d dify < dify_backup_20240308_143022.sql

# 如果需要先清空数据库
docker exec dify-postgres psql -U postgres -c "DROP DATABASE IF EXISTS dify;"
docker exec dify-postgres psql -U postgres -c "CREATE DATABASE dify;"
```

### 文件存储备份与恢复

#### 备份文件存储
```bash
# 备份上传的文件和向量数据
cp -r ./storage ./storage_backup_$(date +%Y%m%d_%H%M%S)

# Docker Compose 环境
docker cp dify-api:/app/storage ./storage_backup_$(date +%Y%m%d_%H%M%S)

# 压缩备份
tar -czf storage_backup_$(date +%Y%m%d_%H%M%S).tar.gz ./storage
```

#### 恢复文件存储
```bash
# 恢复到新环境
cp -r ./storage_backup_20240308_143022/* ./storage/

# Docker 环境恢复
docker cp ./storage_backup_20240308_143022/. dify-api:/app/storage/
```

---

## 🔍 升级验证清单

### 1. 服务状态检查
```bash
# Docker Compose
docker-compose ps
docker-compose logs

# Docker 单容器
docker ps | grep dify
docker logs dify-api
docker logs dify-web

# K8s
kubectl get pods -l app=dify
kubectl logs -l app=dify-api

# 源码部署
ps aux | grep -E "(python.*app|npm.*dev)"
curl http://localhost:5001/health
curl http://localhost:3000
```

### 2. 功能验证
- ✅ 用户能正常登录
- ✅ 知识库功能正常（上传、查询）
- ✅ 聊天助手功能正常
- ✅ 普通用户权限控制生效
- ✅ 数据库连接正常
- ✅ 文件存储访问正常

### 3. 权限验证
- ✅ 普通用户只能看到知识库和工作室
- ✅ 普通用户可以创建知识库和聊天助手
- ✅ 普通用户无法访问管理功能
- ✅ 管理员权限未受影响

---

## 🆘 回滚方案

### 快速回滚
```bash
# Docker Compose
docker-compose down
cd ../dify_backup_20240308_143022
docker-compose up -d

# Docker 单容器
docker stop dify-api dify-web
docker run ... # 使用备份的启动命令

# K8s
kubectl rollout undo deployment/dify-api
kubectl rollout undo deployment/dify-web

# 源码部署
pkill -f "python app.py"
pkill -f "npm run dev"
cd ../dify_backup_20240308_143022
# 重新启动服务
```

### 数据回滚
```bash
# 恢复数据库
docker exec -i dify-postgres psql -U postgres -d dify < dify_backup_20240308_143022.sql

# 恢复文件存储
rm -rf ./storage/*
cp -r ./storage_backup_20240308_143022/* ./storage/
```

---

## 📝 升级内容说明

本次升级包含以下权限控制优化：

### 普通用户权限控制
- **知识库权限**：普通用户可以创建、管理、上传文档到知识库
- **工作室权限**：普通用户只能看到和使用聊天助手相关功能
  - ✅ 聊天机器人 (chat)
  - ✅ 智能助手 (agent-chat)
  - ✅ 高级聊天 (advanced-chat)
  - ❌ 文本生成 (completion)
  - ❌ 工作流 (workflow)

### 界面优化
- 普通用户导航栏只显示知识库和工作室
- 隐藏普通用户不需要的功能入口
- 保持管理员用户的完整功能访问

### 数据保护
- 升级过程完全保留原有数据
- 用户账户和权限设置不受影响
- 知识库和应用数据完整迁移