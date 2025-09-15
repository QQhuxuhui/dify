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
WEB_OPENSOURCE_IMAGE_NAME="custom-dify-web-opensource:${DIFY_VERSION}"

# 构建方式选择
BUILD_MODE=${1:-"all"}  # all, web-only, api-only, web-opensource
ARCH=${2:-"arm64"}      # arm64 (客户服务器), amd64 (本地开发)

# 平台配置（支持客户ARM64服务器）
PLATFORM="linux/${ARCH}"
DOCKER_BUILD_ARGS="--platform ${PLATFORM} --build-arg HTTP_PROXY=http://127.0.0.1:10809 --build-arg HTTPS_PROXY=http://127.0.0.1:10809 --build-arg NO_PROXY=localhost,127.0.0.1 --load"

echo -e "${YELLOW}📋 构建配置：${NC}"
echo "Dify 版本: ${DIFY_VERSION}"
echo "构建模式: ${BUILD_MODE}"
echo "目标架构: ${ARCH}"
echo "Web 镜像: ${WEB_IMAGE_NAME}"
echo "API 镜像: ${API_IMAGE_NAME}"
echo "Web 开源镜像: ${WEB_OPENSOURCE_IMAGE_NAME}"
echo ""

# 检查Docker是否可用
if ! docker --version > /dev/null 2>&1; then
    echo -e "${RED}❌ Docker 未安装或不可用${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Docker 环境检查通过${NC}"

# 构建函数
build_web_custom() {
    echo ""
    echo -e "${YELLOW}🔧 构建Web自定义镜像（基于官方镜像）${NC}"
    echo "正在构建包含权限控制功能的Web镜像..."

    cd web
    if docker buildx build ${DOCKER_BUILD_ARGS} -f Dockerfile.custom -t ${WEB_IMAGE_NAME} .; then
        echo -e "${GREEN}✅ Web自定义镜像构建成功${NC}"
        WEB_BUILD_SUCCESS=true
    else
        echo -e "${RED}❌ Web自定义镜像构建失败${NC}"
        WEB_BUILD_SUCCESS=false
    fi
    cd ..
}

build_web_opensource() {
    echo ""
    echo -e "${YELLOW}🔧 构建Web开源镜像（多阶段构建）${NC}"
    echo "正在构建基于开源镜像的优化Web镜像..."

    cd web
    if docker buildx build ${DOCKER_BUILD_ARGS} -f Dockerfile.opensource -t ${WEB_OPENSOURCE_IMAGE_NAME} --target production .; then
        echo -e "${GREEN}✅ Web开源镜像构建成功${NC}"
        WEB_OPENSOURCE_BUILD_SUCCESS=true

        # 可选：构建静态版本
        echo -e "${YELLOW}🔧 构建静态文件版本${NC}"
        if docker buildx build ${DOCKER_BUILD_ARGS} -f Dockerfile.opensource -t ${WEB_OPENSOURCE_IMAGE_NAME}-static --target static .; then
            echo -e "${GREEN}✅ Web静态镜像构建成功${NC}"
        else
            echo -e "${YELLOW}⚠️  Web静态镜像构建失败（可选）${NC}"
        fi
    else
        echo -e "${RED}❌ Web开源镜像构建失败${NC}"
        WEB_OPENSOURCE_BUILD_SUCCESS=false
    fi
    cd ..
}

build_api() {
    echo ""
    echo -e "${YELLOW}🔧 构建API镜像${NC}"
    echo "正在构建包含检索增强功能的API镜像..."

    cd api
    if docker buildx build ${DOCKER_BUILD_ARGS} -f Dockerfile.custom -t ${API_IMAGE_NAME} .; then
        echo -e "${GREEN}✅ API镜像构建成功${NC}"
        API_BUILD_SUCCESS=true
    else
        echo -e "${RED}❌ API镜像构建失败${NC}"
        API_BUILD_SUCCESS=false
    fi
    cd ..
}

# 根据构建模式执行不同的构建策略
case ${BUILD_MODE} in
    "web-only")
        echo -e "${BLUE}🎯 仅构建Web自定义镜像${NC}"
        build_web_custom
        ;;
    "web-opensource")
        echo -e "${BLUE}🎯 仅构建Web开源镜像${NC}"
        build_web_opensource
        ;;
    "api-only")
        echo -e "${BLUE}🎯 仅构建API镜像${NC}"
        build_api
        ;;
    "all")
        echo -e "${BLUE}🎯 构建所有镜像${NC}"
        build_web_custom
        build_web_opensource
        build_api
        ;;
    *)
        echo -e "${RED}❌ 无效的构建模式: ${BUILD_MODE}${NC}"
        echo "用法: $0 [构建模式] [架构]"
        echo "构建模式: all, web-only, web-opensource, api-only"
        echo "架构: arm64 (客户服务器), amd64 (本地开发)"
        echo "示例: $0 web-opensource arm64"
        exit 1
        ;;
esac

# 验证构建结果
echo ""
echo -e "${YELLOW}🔍 步骤3: 验证构建结果${NC}"

echo "已构建的镜像列表："
docker images | grep custom-dify

# 统计构建结果
TOTAL_SUCCESS=0
TOTAL_ATTEMPTED=0

echo ""
if [ "$WEB_BUILD_SUCCESS" = true ]; then
    echo -e "${GREEN}✅ Web自定义镜像构建成功${NC}"
    TOTAL_SUCCESS=$((TOTAL_SUCCESS + 1))
fi
[ "$WEB_BUILD_SUCCESS" != "" ] && TOTAL_ATTEMPTED=$((TOTAL_ATTEMPTED + 1))

if [ "$WEB_OPENSOURCE_BUILD_SUCCESS" = true ]; then
    echo -e "${GREEN}✅ Web开源镜像构建成功${NC}"
    TOTAL_SUCCESS=$((TOTAL_SUCCESS + 1))
fi
[ "$WEB_OPENSOURCE_BUILD_SUCCESS" != "" ] && TOTAL_ATTEMPTED=$((TOTAL_ATTEMPTED + 1))

if [ "$API_BUILD_SUCCESS" = true ]; then
    echo -e "${GREEN}✅ API镜像构建成功${NC}"
    TOTAL_SUCCESS=$((TOTAL_SUCCESS + 1))
fi
[ "$API_BUILD_SUCCESS" != "" ] && TOTAL_ATTEMPTED=$((TOTAL_ATTEMPTED + 1))

echo ""
if [ $TOTAL_SUCCESS -eq $TOTAL_ATTEMPTED ] && [ $TOTAL_SUCCESS -gt 0 ]; then
    echo -e "${GREEN}🎉 所有镜像构建完成！(${TOTAL_SUCCESS}/${TOTAL_ATTEMPTED})${NC}"

    # 功能验证
    echo ""
    echo -e "${YELLOW}🔍 功能验证：${NC}"

    # 验证Web权限控制组件
    if [ "$WEB_BUILD_SUCCESS" = true ] || [ "$WEB_OPENSOURCE_BUILD_SUCCESS" = true ]; then
        echo "验证Web权限控制组件..."

        if [ "$WEB_BUILD_SUCCESS" = true ]; then
            if docker run --rm --entrypoint="" ${WEB_IMAGE_NAME} test -f /app/web/components/route-guard/normal-user-guard.tsx; then
                echo -e "${GREEN}✅ Web自定义镜像权限控制组件已包含${NC}"
            else
                echo -e "${RED}⚠️  Web自定义镜像权限控制组件未找到${NC}"
            fi
        fi

        if [ "$WEB_OPENSOURCE_BUILD_SUCCESS" = true ]; then
            if docker run --rm --entrypoint="" ${WEB_OPENSOURCE_IMAGE_NAME} test -f /app/web/components/route-guard/normal-user-guard.tsx; then
                echo -e "${GREEN}✅ Web开源镜像权限控制组件已包含${NC}"
            else
                echo -e "${RED}⚠️  Web开源镜像权限控制组件未找到${NC}"
            fi
        fi
    fi

    # 验证API功能
    if [ "$API_BUILD_SUCCESS" = true ]; then
        echo "验证API检索增强功能..."
        if docker run --rm --entrypoint="" ${API_IMAGE_NAME} grep -q "document_ids_filter" /app/api/core/rag/datasource/retrieval_service.py 2>/dev/null; then
            echo -e "${GREEN}✅ API检索增强功能已包含${NC}"
        else
            echo -e "${RED}⚠️  API检索增强功能未找到${NC}"
        fi
    fi

elif [ $TOTAL_SUCCESS -gt 0 ]; then
    echo -e "${YELLOW}⚠️  部分镜像构建成功 (${TOTAL_SUCCESS}/${TOTAL_ATTEMPTED})${NC}"
else
    echo -e "${RED}❌ 所有镜像构建失败${NC}"
    exit 1
fi

# 使用说明
echo ""
echo -e "${YELLOW}📋 使用说明：${NC}"
echo ""
echo -e "${BLUE}📖 构建选项：${NC}"
echo "  ./build-custom-images.sh               # 构建所有镜像"
echo "  ./build-custom-images.sh web-only      # 仅构建Web自定义镜像"
echo "  ./build-custom-images.sh web-opensource # 仅构建Web开源镜像"
echo "  ./build-custom-images.sh api-only      # 仅构建API镜像"
echo ""

if [ "$WEB_BUILD_SUCCESS" = true ] || [ "$WEB_OPENSOURCE_BUILD_SUCCESS" = true ]; then
    echo -e "${BLUE}🐳 Docker Compose配置：${NC}"
    echo "在docker-compose.yaml中使用镜像："
    echo "   web:"

    if [ "$WEB_BUILD_SUCCESS" = true ]; then
        echo "     image: ${WEB_IMAGE_NAME}          # 基于官方镜像的自定义版本"
    fi

    if [ "$WEB_OPENSOURCE_BUILD_SUCCESS" = true ]; then
        echo "     image: ${WEB_OPENSOURCE_IMAGE_NAME}  # 开源多阶段构建版本"
    fi

    if [ "$API_BUILD_SUCCESS" = true ]; then
        echo "   api:"
        echo "     image: ${API_IMAGE_NAME}"
    fi
    echo ""
fi

echo -e "${BLUE}🚀 启动服务：${NC}"
echo "   docker compose up -d"
echo ""

echo -e "${BLUE}📦 镜像导出（传输到其他环境）：${NC}"
if [ "$WEB_BUILD_SUCCESS" = true ]; then
    echo "   docker save -o custom-dify-web.tar ${WEB_IMAGE_NAME}"
fi
if [ "$WEB_OPENSOURCE_BUILD_SUCCESS" = true ]; then
    echo "   docker save -o custom-dify-web-opensource.tar ${WEB_OPENSOURCE_IMAGE_NAME}"
fi
if [ "$API_BUILD_SUCCESS" = true ]; then
    echo "   docker save -o custom-dify-api.tar ${API_IMAGE_NAME}"
fi
echo ""

echo -e "${BLUE}📥 镜像导入：${NC}"
if [ "$WEB_BUILD_SUCCESS" = true ]; then
    echo "   docker load -i custom-dify-web.tar"
fi
if [ "$WEB_OPENSOURCE_BUILD_SUCCESS" = true ]; then
    echo "   docker load -i custom-dify-web-opensource.tar"
fi
if [ "$API_BUILD_SUCCESS" = true ]; then
    echo "   docker load -i custom-dify-api.tar"
fi
echo ""

if [ "$WEB_OPENSOURCE_BUILD_SUCCESS" = true ]; then
    echo -e "${BLUE}🌟 开源镜像优势：${NC}"
    echo "   • 🏗️  多阶段构建，镜像体积更小"
    echo "   • 📦 利用Docker缓存，构建速度更快"
    echo "   • 🔒 更好的安全性（非root用户）"
    echo "   • ❤️  健康检查内置"
    echo "   • 🌐 可选静态文件版本（Nginx）"
    echo ""
fi

echo -e "${GREEN}✨ 构建完成！您现在拥有包含权限控制功能的优化Dify镜像。${NC}"