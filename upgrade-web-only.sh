#!/bin/bash
# 只升级Web容器的低成本升级脚本

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}开始只升级Web容器的低成本升级...${NC}"

# 1. 检查当前环境
echo -e "${YELLOW}1. 检查当前环境...${NC}"
if [ ! -f "docker-compose.yaml" ]; then
    echo -e "${RED}错误: 未找到 docker-compose.yaml 文件${NC}"
    exit 1
fi

if [ ! -d "web" ]; then
    echo -e "${RED}错误: 未找到 web 目录${NC}"
    exit 1
fi

# 2. 备份当前Web容器
echo -e "${YELLOW}2. 备份当前Web容器和数据...${NC}"
docker-compose stop web
docker commit $(docker-compose ps -q web 2>/dev/null || echo "none") dify-web-backup:$(date +%Y%m%d_%H%M%S) 2>/dev/null || true

# 3. 构建新的Web镜像
echo -e "${YELLOW}3. 构建自定义Web镜像...${NC}"
echo "正在基于官方镜像 langgenius/dify-web:1.1.3 构建自定义镜像..."
docker build -t custom-dify-web:1.1.3 -f docker/Dockerfile.web .

# 验证镜像构建成功
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ 自定义Web镜像构建成功${NC}"
else
    echo -e "${RED}❌ 镜像构建失败${NC}"
    exit 1
fi

# 4. 更新docker-compose.yaml（临时修改）
echo -e "${YELLOW}4. 更新Web服务镜像配置...${NC}"
cp docker-compose.yaml docker-compose.yaml.backup
sed -i 's|image: langgenius/dify-web:1.1.3|image: custom-dify-web:1.1.3|' docker-compose.yaml

# 5. 启动新Web容器
echo -e "${YELLOW}5. 启动新Web容器...${NC}"
docker-compose up -d web

# 6. 健康检查
echo -e "${YELLOW}6. 等待Web服务启动...${NC}"
sleep 10

# 检查Web服务是否正常运行
if docker-compose ps web | grep -q "Up"; then
    echo -e "${GREEN}✅ Web容器升级成功！${NC}"
    echo -e "${GREEN}升级完成！只升级了Web容器，其他容器保持不变。${NC}"
    echo ""
    echo -e "${YELLOW}验证步骤：${NC}"
    echo "1. 访问你的Dify应用检查功能是否正常"
    echo "2. 检查普通用户权限控制是否生效"
    echo "3. 测试知识库和工作室功能"
    echo ""
    echo -e "${YELLOW}如需回滚：${NC}"
    echo "docker-compose stop web"
    echo "cp docker-compose.yaml.backup docker-compose.yaml"
    echo "docker-compose up -d web"
else
    echo -e "${RED}❌ Web容器启动失败，开始回滚...${NC}"
    cp docker-compose.yaml.backup docker-compose.yaml
    docker-compose up -d web
    echo -e "${RED}已回滚到原始状态${NC}"
    exit 1
fi