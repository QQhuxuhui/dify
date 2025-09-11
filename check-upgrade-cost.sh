#!/bin/bash
# 检查升级成本对比脚本

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${GREEN}=== Dify 升级成本对比分析 ===${NC}"
echo ""

# 1. 检查当前镜像大小
echo -e "${YELLOW}📊 当前镜像大小分析：${NC}"
echo ""
echo "容器服务                镜像大小      说明"
echo "----------------------------------------"

# API镜像
api_size=$(docker images langgenius/dify-api:1.1.3 --format "{{.Size}}" 2>/dev/null || echo "未下载")
echo -e "🔧 API服务              ${BLUE}${api_size}${NC}        后端核心服务"

# Web镜像  
web_size=$(docker images langgenius/dify-web:1.1.3 --format "{{.Size}}" 2>/dev/null || echo "未下载")
echo -e "🌐 Web服务              ${BLUE}${web_size}${NC}        前端界面服务（需要升级）"

# Worker镜像
worker_size=$(docker images langgenius/dify-api:1.1.3 --format "{{.Size}}" 2>/dev/null || echo "与API相同")
echo -e "⚙️  Worker服务          ${BLUE}${worker_size}${NC}        后台任务处理"

# 数据库镜像
db_size=$(docker images postgres:15-alpine --format "{{.Size}}" 2>/dev/null || echo "未下载")
echo -e "🗄️  数据库服务          ${BLUE}${db_size}${NC}         PostgreSQL数据库"

# Redis镜像
redis_size=$(docker images redis:6-alpine --format "{{.Size}}" 2>/dev/null || echo "未下载")
echo -e "⚡ Redis服务           ${BLUE}${redis_size}${NC}         内存缓存服务"

echo ""
echo -e "${YELLOW}💰 升级成本对比：${NC}"
echo ""

# 全量升级 vs 单容器升级对比
echo "升级方式              需要下载      停机时间      数据风险      复杂度"
echo "----------------------------------------------------------------"
echo -e "${RED}全量升级              ~2.5GB        5-10分钟      中等          高${NC}"
echo -e "${GREEN}仅升级Web容器         ~200MB        30-60秒       很低          低${NC}"

echo ""
echo -e "${YELLOW}🎯 推荐方案：仅升级Web容器${NC}"
echo ""
echo "✅ 优势："
echo "   • 只需重新构建Web镜像（基于官方镜像+你的修改）"
echo "   • 数据库、Redis、API服务完全不受影响"  
echo "   • 停机时间最短，风险最低"
echo "   • 构建时间约2-5分钟，重启约30秒"
echo ""

# 检查当前运行状态
echo -e "${YELLOW}📋 当前运行状态：${NC}"
if command -v docker-compose &> /dev/null; then
    echo ""
    docker-compose ps | head -1
    docker-compose ps | grep -E "(web|api|worker|db|redis)" | while read line; do
        service=$(echo $line | awk '{print $1}')
        status=$(echo $line | awk '{print $NF}')
        if [[ $status == *"Up"* ]]; then
            echo -e "   ${GREEN}✅ $service: 运行中${NC}"
        else
            echo -e "   ${RED}❌ $service: $status${NC}"
        fi
    done
else
    echo "   ⚠️  docker-compose 未安装或不在PATH中"
fi

echo ""
echo -e "${YELLOW}🚀 执行建议：${NC}"
echo "1. 运行: ${GREEN}./upgrade-web-only.sh${NC}"
echo "2. 或参考: ${GREEN}UPGRADE_WEB_ONLY.md${NC} 手动执行"
echo ""
echo -e "${BLUE}💡 提示：你的修改主要集中在前端权限控制，只升级Web容器即可实现所有功能！${NC}"