#!/bin/bash
echo "🚀 启动Dify开发环境"

# 检查Redis
echo "📋 检查Redis服务..."
if redis-cli ping > /dev/null 2>&1; then
    echo "✅ Redis 运行正常"
else
    echo "❌ Redis 未运行，请先启动Redis服务"
    exit 1
fi

# 检查PostgreSQL
echo "📋 检查PostgreSQL服务..."
if pg_isready -h localhost -p 5432 > /dev/null 2>&1; then
    echo "✅ PostgreSQL 运行正常"
else
    echo "❌ PostgreSQL 未运行，请检查Docker PostgreSQL容器"
    exit 1
fi

# 启动Qdrant
echo "📋 启动Qdrant..."
if ! docker ps | grep -q qdrant; then
    docker run -d --name qdrant -p 6333:6333 -e QDRANT__SERVICE__HTTP_PORT=6333 qdrant/qdrant:latest
    echo "✅ Qdrant 已启动"
else
    echo "✅ Qdrant 已运行"
fi

echo ""
echo "🔧 环境准备完毕！"
echo ""
echo "📝 接下来请按以下步骤启动:"
echo "1. 启动API后端服务："
echo "   cd api && source .venv/bin/activate && python -m flask run --host=0.0.0.0 --port=5001"
echo ""
echo "2. 启动Web前端服务 (新终端)："  
echo "   cd web && pnpm dev"
echo ""
echo "3. 访问: http://localhost:3000"
echo ""
echo "🎯 改造功能测试："
echo "- 管理员用户: 完整功能"
echo "- 普通用户: 仅显示数据集(知识库)功能"