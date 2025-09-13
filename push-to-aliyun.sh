#!/bin/bash
# 推送自定义Dify镜像到阿里云容器镜像服务

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${GREEN}🚀 推送Dify自定义镜像到阿里云${NC}"
echo ""

# 阿里云配置
REGISTRY="registry.cn-hangzhou.aliyuncs.com"
NAMESPACE="hxh_bigdata"
VERSION="1.1.3"

WEB_IMAGE="${REGISTRY}/${NAMESPACE}/custom-dify-web:${VERSION}"
API_IMAGE="${REGISTRY}/${NAMESPACE}/custom-dify-api:${VERSION}"

echo -e "${YELLOW}📋 推送配置：${NC}"
echo "阿里云仓库: ${REGISTRY}"
echo "命名空间: ${NAMESPACE}"
echo "版本: ${VERSION}"
echo ""
echo "目标镜像:"
echo "  - ${WEB_IMAGE}"
echo "  - ${API_IMAGE}"
echo ""

# 检查镜像是否存在
echo -e "${YELLOW}🔍 检查本地镜像...${NC}"
if docker images | grep -q "${REGISTRY}/${NAMESPACE}/custom-dify-web.*${VERSION}"; then
    echo -e "${GREEN}✅ Web镜像标签已准备${NC}"
else
    echo -e "${RED}❌ Web镜像标签未找到${NC}"
    exit 1
fi

if docker images | grep -q "${REGISTRY}/${NAMESPACE}/custom-dify-api.*${VERSION}"; then
    echo -e "${GREEN}✅ API镜像标签已准备${NC}"
else
    echo -e "${RED}❌ API镜像标签未找到${NC}"
    exit 1
fi

echo ""
echo -e "${YELLOW}🔑 请先登录阿里云容器镜像服务：${NC}"
echo -e "${BLUE}docker login --username=13004588605 ${REGISTRY}${NC}"
echo ""

# 等待用户确认登录
read -p "请输入密码完成登录后按回车继续..."

echo ""
echo -e "${YELLOW}📤 开始推送镜像...${NC}"

# 推送Web镜像
echo ""
echo -e "${YELLOW}📦 推送Web镜像 (495MB)...${NC}"
if docker push ${WEB_IMAGE}; then
    echo -e "${GREEN}✅ Web镜像推送成功${NC}"
    WEB_SUCCESS=true
else
    echo -e "${RED}❌ Web镜像推送失败${NC}"
    WEB_SUCCESS=false
fi

# 推送API镜像
echo ""
echo -e "${YELLOW}📦 推送API镜像 (2.05GB)...${NC}"
if docker push ${API_IMAGE}; then
    echo -e "${GREEN}✅ API镜像推送成功${NC}"
    API_SUCCESS=true
else
    echo -e "${RED}❌ API镜像推送失败${NC}"
    API_SUCCESS=false
fi

# 推送结果总结
echo ""
echo -e "${YELLOW}📊 推送结果总结：${NC}"
if [ "$WEB_SUCCESS" = true ] && [ "$API_SUCCESS" = true ]; then
    echo -e "${GREEN}🎉 所有镜像推送成功！${NC}"
    
    echo ""
    echo -e "${YELLOW}📋 使用说明：${NC}"
    echo ""
    echo "在docker-compose.yaml中使用阿里云镜像："
    echo "  web:"
    echo "    image: ${WEB_IMAGE}"
    echo "  api:"
    echo "    image: ${API_IMAGE}"
    echo ""
    echo "拉取镜像命令："
    echo "  ${BLUE}docker pull ${WEB_IMAGE}${NC}"
    echo "  ${BLUE}docker pull ${API_IMAGE}${NC}"
    
elif [ "$WEB_SUCCESS" = true ]; then
    echo -e "${YELLOW}⚠️  仅Web镜像推送成功${NC}"
elif [ "$API_SUCCESS" = true ]; then
    echo -e "${YELLOW}⚠️  仅API镜像推送成功${NC}"
else
    echo -e "${RED}❌ 所有镜像推送失败${NC}"
    exit 1
fi

echo ""
echo -e "${GREEN}✨ 推送完成！您的自定义Dify镜像已上传到阿里云。${NC}"