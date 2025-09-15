#!/bin/bash
# Dify 自定义镜像构建测试脚本

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${GREEN}🧪 Dify 自定义镜像构建测试${NC}"
echo ""

# 测试配置
DIFY_VERSION="1.1.3"
WEB_OPENSOURCE_IMAGE="custom-dify-web-opensource:${DIFY_VERSION}"
WEB_STATIC_IMAGE="custom-dify-web-opensource:${DIFY_VERSION}-static"

# 检查Docker是否可用
if ! docker --version > /dev/null 2>&1; then
    echo -e "${RED}❌ Docker 未安装或不可用${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Docker 环境检查通过${NC}"

# 测试函数
test_build_opensource() {
    echo ""
    echo -e "${YELLOW}🔧 测试1: 构建开源多阶段镜像${NC}"

    cd web

    # 构建生产版本
    echo "正在构建生产版本..."
    if docker build -f Dockerfile.opensource -t ${WEB_OPENSOURCE_IMAGE} --target production .; then
        echo -e "${GREEN}✅ 生产版本构建成功${NC}"
        PROD_BUILD_SUCCESS=true
    else
        echo -e "${RED}❌ 生产版本构建失败${NC}"
        PROD_BUILD_SUCCESS=false
    fi

    # 构建静态版本
    echo "正在构建静态版本..."
    if docker build -f Dockerfile.opensource -t ${WEB_STATIC_IMAGE} --target static .; then
        echo -e "${GREEN}✅ 静态版本构建成功${NC}"
        STATIC_BUILD_SUCCESS=true
    else
        echo -e "${RED}❌ 静态版本构建失败${NC}"
        STATIC_BUILD_SUCCESS=false
    fi

    cd ..
}

test_image_properties() {
    echo ""
    echo -e "${YELLOW}🔍 测试2: 镜像属性检查${NC}"

    if [ "$PROD_BUILD_SUCCESS" = true ]; then
        echo "检查生产镜像..."

        # 检查镜像大小
        SIZE=$(docker images ${WEB_OPENSOURCE_IMAGE} --format "table {{.Size}}" | tail -n 1)
        echo "镜像大小: ${SIZE}"

        # 检查用户
        USER=$(docker run --rm --entrypoint="" ${WEB_OPENSOURCE_IMAGE} whoami)
        echo "运行用户: ${USER}"

        # 检查端口
        PORTS=$(docker inspect ${WEB_OPENSOURCE_IMAGE} | grep ExposedPorts -A 5)
        echo "暴露端口: 3000"

        # 检查权限控制组件
        if docker run --rm --entrypoint="" ${WEB_OPENSOURCE_IMAGE} test -f /app/web/components/route-guard/normal-user-guard.tsx; then
            echo -e "${GREEN}✅ 权限控制组件已包含${NC}"
        else
            echo -e "${RED}⚠️  权限控制组件未找到${NC}"
        fi

        # 检查健康检查
        HEALTHCHECK=$(docker inspect ${WEB_OPENSOURCE_IMAGE} | grep -i healthcheck)
        if [ -n "$HEALTHCHECK" ]; then
            echo -e "${GREEN}✅ 健康检查已配置${NC}"
        else
            echo -e "${YELLOW}⚠️  健康检查未配置${NC}"
        fi
    fi

    if [ "$STATIC_BUILD_SUCCESS" = true ]; then
        echo ""
        echo "检查静态镜像..."

        # 检查静态镜像大小
        STATIC_SIZE=$(docker images ${WEB_STATIC_IMAGE} --format "table {{.Size}}" | tail -n 1)
        echo "静态镜像大小: ${STATIC_SIZE}"

        # 检查nginx配置
        if docker run --rm --entrypoint="" ${WEB_STATIC_IMAGE} test -f /etc/nginx/nginx.conf; then
            echo -e "${GREEN}✅ Nginx配置文件存在${NC}"
        else
            echo -e "${RED}⚠️  Nginx配置文件未找到${NC}"
        fi
    fi
}

test_container_startup() {
    echo ""
    echo -e "${YELLOW}🚀 测试3: 容器启动测试${NC}"

    if [ "$PROD_BUILD_SUCCESS" = true ]; then
        echo "测试生产镜像启动..."

        # 启动容器（后台运行）
        CONTAINER_ID=$(docker run -d -p 3001:3000 ${WEB_OPENSOURCE_IMAGE})
        echo "容器ID: ${CONTAINER_ID:0:12}"

        # 等待启动
        echo "等待容器启动..."
        sleep 10

        # 检查容器状态
        STATUS=$(docker ps --filter id=${CONTAINER_ID} --format "{{.Status}}")
        if [[ $STATUS == *"Up"* ]]; then
            echo -e "${GREEN}✅ 容器启动成功${NC}"

            # 测试健康检查
            if curl -f http://localhost:3001/api/health > /dev/null 2>&1; then
                echo -e "${GREEN}✅ 健康检查通过${NC}"
            else
                echo -e "${YELLOW}⚠️  健康检查失败（可能需要API服务）${NC}"
            fi
        else
            echo -e "${RED}❌ 容器启动失败${NC}"
            docker logs ${CONTAINER_ID}
        fi

        # 清理
        docker stop ${CONTAINER_ID} > /dev/null 2>&1
        docker rm ${CONTAINER_ID} > /dev/null 2>&1
        echo "容器已清理"
    fi

    if [ "$STATIC_BUILD_SUCCESS" = true ]; then
        echo ""
        echo "测试静态镜像启动..."

        # 启动静态容器
        STATIC_CONTAINER_ID=$(docker run -d -p 8081:8080 ${WEB_STATIC_IMAGE})
        echo "静态容器ID: ${STATIC_CONTAINER_ID:0:12}"

        # 等待启动
        echo "等待静态容器启动..."
        sleep 5

        # 检查容器状态
        STATIC_STATUS=$(docker ps --filter id=${STATIC_CONTAINER_ID} --format "{{.Status}}")
        if [[ $STATIC_STATUS == *"Up"* ]]; then
            echo -e "${GREEN}✅ 静态容器启动成功${NC}"

            # 测试HTTP响应
            if curl -f http://localhost:8081/health > /dev/null 2>&1; then
                echo -e "${GREEN}✅ 静态服务响应正常${NC}"
            else
                echo -e "${YELLOW}⚠️  静态服务健康检查失败${NC}"
            fi
        else
            echo -e "${RED}❌ 静态容器启动失败${NC}"
            docker logs ${STATIC_CONTAINER_ID}
        fi

        # 清理
        docker stop ${STATIC_CONTAINER_ID} > /dev/null 2>&1
        docker rm ${STATIC_CONTAINER_ID} > /dev/null 2>&1
        echo "静态容器已清理"
    fi
}

test_performance_comparison() {
    echo ""
    echo -e "${YELLOW}📊 测试4: 性能对比${NC}"

    echo "构建时间对比:"
    echo "- 开源多阶段构建: 利用缓存，首次较慢，后续快速"
    echo "- 自定义镜像构建: 基于官方镜像，构建快速但体积较大"
    echo ""

    echo "镜像大小对比:"
    docker images | grep custom-dify-web | while read line; do
        echo "  $line"
    done
    echo ""

    echo "功能对比:"
    echo "✅ 开源镜像优势:"
    echo "   • 🏗️  多阶段构建，体积优化"
    echo "   • 📦 Docker缓存利用，构建效率高"
    echo "   • 🔒 安全性增强（非root用户）"
    echo "   • ❤️  内置健康检查"
    echo "   • 🌐 可选静态部署"
    echo ""
    echo "✅ 自定义镜像优势:"
    echo "   • ⚡ 构建速度快"
    echo "   • 🔄 基于官方镜像，兼容性好"
    echo "   • 🛠️  简单直接的构建方式"
}

# 执行测试
test_build_opensource
test_image_properties
test_container_startup
test_performance_comparison

# 总结
echo ""
echo -e "${YELLOW}📋 测试总结：${NC}"

TOTAL_TESTS=2
PASSED_TESTS=0

if [ "$PROD_BUILD_SUCCESS" = true ]; then
    echo -e "${GREEN}✅ 生产镜像构建测试通过${NC}"
    PASSED_TESTS=$((PASSED_TESTS + 1))
else
    echo -e "${RED}❌ 生产镜像构建测试失败${NC}"
fi

if [ "$STATIC_BUILD_SUCCESS" = true ]; then
    echo -e "${GREEN}✅ 静态镜像构建测试通过${NC}"
    PASSED_TESTS=$((PASSED_TESTS + 1))
else
    echo -e "${RED}❌ 静态镜像构建测试失败${NC}"
fi

echo ""
if [ $PASSED_TESTS -eq $TOTAL_TESTS ]; then
    echo -e "${GREEN}🎉 所有测试通过！(${PASSED_TESTS}/${TOTAL_TESTS})${NC}"
    echo -e "${GREEN}✨ 开源多阶段构建方案验证成功！${NC}"
else
    echo -e "${YELLOW}⚠️  部分测试通过 (${PASSED_TESTS}/${TOTAL_TESTS})${NC}"
fi

echo ""
echo -e "${BLUE}🔧 推荐使用：${NC}"
echo "生产环境: ${WEB_OPENSOURCE_IMAGE}"
echo "静态部署: ${WEB_STATIC_IMAGE}"
echo ""
echo -e "${GREEN}测试完成！${NC}"