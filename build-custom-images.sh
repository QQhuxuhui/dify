#!/bin/bash
# Dify 自定义镜像本地构建脚本

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${GREEN}🚀 Dify 自定义镜像构建脚本${NC}"
echo ""

# 版本配置
DIFY_VERSION="1.1.3"
WEB_IMAGE_NAME="custom-dify-web:${DIFY_VERSION}"
API_IMAGE_NAME="custom-dify-api:${DIFY_VERSION}"

echo -e "${YELLOW}📋 构建配置：${NC}"
echo "Dify 版本: ${DIFY_VERSION}"
echo "Web 镜像: ${WEB_IMAGE_NAME}"
echo "API 镜像: ${API_IMAGE_NAME}"
echo ""

# 检查Docker是否可用
if ! docker --version > /dev/null 2>&1; then
    echo -e "${RED}❌ Docker 未安装或不可用${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Docker 环境检查通过${NC}"

# 步骤1: 构建Web镜像
echo ""
echo -e "${YELLOW}🔧 步骤1: 构建Web镜像${NC}"
echo "正在构建包含权限控制功能的Web镜像..."

cd web
if docker build -f ../docker/Dockerfile.web -t ${WEB_IMAGE_NAME} .; then
    echo -e "${GREEN}✅ Web镜像构建成功${NC}"
    WEB_BUILD_SUCCESS=true
else
    echo -e "${RED}❌ Web镜像构建失败${NC}"
    WEB_BUILD_SUCCESS=false
fi
cd ..

# 步骤2: 构建API镜像
echo ""
echo -e "${YELLOW}🔧 步骤2: 构建API镜像${NC}"
echo "正在构建包含检索增强功能的API镜像..."

cd api
if docker build -f Dockerfile.custom -t ${API_IMAGE_NAME} .; then
    echo -e "${GREEN}✅ API镜像构建成功${NC}"
    API_BUILD_SUCCESS=true
else
    echo -e "${RED}❌ API镜像构建失败${NC}"
    API_BUILD_SUCCESS=false
fi
cd ..

# 步骤3: 验证镜像
echo ""
echo -e "${YELLOW}🔍 步骤3: 验证构建结果${NC}"

echo "已构建的镜像列表："
docker images | grep custom-dify

echo ""
if [ "$WEB_BUILD_SUCCESS" = true ] && [ "$API_BUILD_SUCCESS" = true ]; then
    echo -e "${GREEN}🎉 所有镜像构建完成！${NC}"
    
    # 功能验证
    echo ""
    echo -e "${YELLOW}🔍 功能验证：${NC}"
    
    echo "验证Web权限控制组件..."
    if docker run --rm --entrypoint="" ${WEB_IMAGE_NAME} test -f /app/web/components/route-guard/normal-user-guard.tsx; then
        echo -e "${GREEN}✅ Web权限控制组件已包含${NC}"
    else
        echo -e "${RED}⚠️  Web权限控制组件未找到${NC}"
    fi
    
    echo "验证API检索增强功能..."
    if docker run --rm --entrypoint="" ${API_IMAGE_NAME} grep -q "document_ids_filter" /app/api/core/rag/datasource/retrieval_service.py; then
        echo -e "${GREEN}✅ API检索增强功能已包含${NC}"
    else
        echo -e "${RED}⚠️  API检索增强功能未找到${NC}"
    fi
    
elif [ "$WEB_BUILD_SUCCESS" = true ]; then
    echo -e "${YELLOW}⚠️  仅Web镜像构建成功${NC}"
elif [ "$API_BUILD_SUCCESS" = true ]; then
    echo -e "${YELLOW}⚠️  仅API镜像构建成功${NC}"
else
    echo -e "${RED}❌ 所有镜像构建失败${NC}"
    exit 1
fi

# 使用说明
echo ""
echo -e "${YELLOW}📋 使用说明：${NC}"
echo ""
echo "1. 在docker-compose.yaml中使用自定义镜像："
echo "   web:"
echo "     image: ${WEB_IMAGE_NAME}"
echo "   api:"
echo "     image: ${API_IMAGE_NAME}"
echo ""
echo "2. 启动服务："
echo "   ${BLUE}docker compose up -d${NC}"
echo ""
echo "3. 导出镜像（用于传输到其他环境）："
echo "   ${BLUE}docker save -o custom-dify-web.tar ${WEB_IMAGE_NAME}${NC}"
echo "   ${BLUE}docker save -o custom-dify-api.tar ${API_IMAGE_NAME}${NC}"
echo ""
echo "4. 在其他环境导入镜像："
echo "   ${BLUE}docker load -i custom-dify-web.tar${NC}"
echo "   ${BLUE}docker load -i custom-dify-api.tar${NC}"

echo ""
echo -e "${GREEN}✨ 构建完成！您现在拥有包含所有自定义功能的Dify镜像。${NC}"