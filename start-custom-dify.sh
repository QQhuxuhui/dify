#!/bin/bash
# 启动自定义Dify应用的脚本

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${GREEN}🚀 启动自定义Dify应用${NC}"
echo ""

# 配置文件
COMPOSE_FILE="docker-compose.custom.yaml"
ENV_FILE=".env.custom"

# 检查配置文件是否存在
if [ ! -f "$COMPOSE_FILE" ]; then
    echo -e "${RED}❌ Docker Compose配置文件不存在: $COMPOSE_FILE${NC}"
    exit 1
fi

if [ ! -f "$ENV_FILE" ]; then
    echo -e "${RED}❌ 环境变量配置文件不存在: $ENV_FILE${NC}"
    exit 1
fi

echo -e "${YELLOW}📋 配置信息：${NC}"
echo "Docker Compose文件: $COMPOSE_FILE"
echo "环境变量文件: $ENV_FILE"
echo ""

# 读取镜像配置
WEB_IMAGE=$(grep "CUSTOM_DIFY_WEB_IMAGE" $ENV_FILE | grep -v "^#" | cut -d'=' -f2)
API_IMAGE=$(grep "CUSTOM_DIFY_API_IMAGE" $ENV_FILE | grep -v "^#" | cut -d'=' -f2)

echo -e "${YELLOW}🎯 使用的自定义镜像：${NC}"
echo "Web镜像: ${WEB_IMAGE:-custom-dify-web:1.1.3}"
echo "API镜像: ${API_IMAGE:-custom-dify-api:1.1.3}"
echo ""

# 检查Docker是否运行
if ! docker info > /dev/null 2>&1; then
    echo -e "${RED}❌ Docker未运行，请启动Docker${NC}"
    exit 1
fi

# 创建必要的目录
echo -e "${YELLOW}📁 创建必要的目录...${NC}"
mkdir -p volumes/app/storage
mkdir -p volumes/db/data  
mkdir -p volumes/redis/data
mkdir -p volumes/weaviate
mkdir -p volumes/sandbox/dependencies
mkdir -p volumes/sandbox/conf
mkdir -p volumes/plugin_daemon

# 验证配置文件
echo -e "${YELLOW}🔍 验证配置文件...${NC}"
if docker compose -f $COMPOSE_FILE --env-file $ENV_FILE config --quiet; then
    echo -e "${GREEN}✅ 配置文件验证通过${NC}"
else
    echo -e "${RED}❌ 配置文件验证失败${NC}"
    exit 1
fi

# 选择启动模式
echo ""
echo -e "${YELLOW}请选择启动模式：${NC}"
echo "1) 前台启动 (查看日志)"
echo "2) 后台启动 (daemon模式)"
echo -n "请输入选择 [1-2]: "

if [ -z "$1" ]; then
    read -r choice
else
    choice=$1
fi

case $choice in
    1)
        echo ""
        echo -e "${YELLOW}🚀 前台启动Dify服务...${NC}"
        echo -e "${BLUE}提示: 按 Ctrl+C 停止服务${NC}"
        echo ""
        docker compose -f $COMPOSE_FILE --env-file $ENV_FILE up
        ;;
    2)
        echo ""
        echo -e "${YELLOW}🚀 后台启动Dify服务...${NC}"
        docker compose -f $COMPOSE_FILE --env-file $ENV_FILE up -d
        
        echo ""
        echo -e "${GREEN}✅ 服务已在后台启动${NC}"
        echo ""
        echo -e "${YELLOW}📋 常用命令：${NC}"
        echo "查看服务状态: ${BLUE}docker compose -f $COMPOSE_FILE ps${NC}"
        echo "查看日志: ${BLUE}docker compose -f $COMPOSE_FILE logs -f${NC}"
        echo "停止服务: ${BLUE}docker compose -f $COMPOSE_FILE down${NC}"
        echo "重启服务: ${BLUE}docker compose -f $COMPOSE_FILE restart${NC}"
        
        # 等待服务启动并显示状态
        echo ""
        echo -e "${YELLOW}⏳ 等待服务启动中...${NC}"
        sleep 10
        
        echo ""
        echo -e "${YELLOW}📊 服务状态：${NC}"
        docker compose -f $COMPOSE_FILE ps
        
        echo ""
        echo -e "${GREEN}🎉 Dify自定义版本已启动！${NC}"
        echo -e "${BLUE}访问地址: http://localhost${NC}"
        ;;
    *)
        echo -e "${RED}❌ 无效选择${NC}"
        exit 1
        ;;
esac