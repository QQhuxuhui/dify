#!/bin/bash
# 开始新功能开发脚本

set -e

FEATURE_NAME=$1
BASE_BRANCH="custom-dev-1.1.3"

if [ -z "$FEATURE_NAME" ]; then
    echo "❌ 用法: ./start-feature.sh 功能名称"
    echo "示例: ./start-feature.sh 用户权限管理"
    exit 1
fi

echo "🚀 开始新功能开发: $FEATURE_NAME"
echo "基础分支: $BASE_BRANCH"

# 检查当前工作区是否干净
if ! git diff-index --quiet HEAD --; then
    echo "⚠️  工作区有未提交的更改，请先提交或暂存"
    git status --porcelain
    exit 1
fi

# 切换到基础分支并拉取最新代码
echo "📥 切换到基础分支并拉取最新代码..."
git checkout $BASE_BRANCH
git pull origin $BASE_BRANCH

# 创建功能分支
BRANCH_NAME="feature/$FEATURE_NAME"
echo "🌿 创建功能分支: $BRANCH_NAME"
git checkout -b $BRANCH_NAME

# 推送到远程
echo "📤 推送分支到远程..."
git push -u origin $BRANCH_NAME

echo "✅ 功能分支创建成功!"
echo "📋 接下来:"
echo "   1. 开发您的功能"
echo "   2. 定期提交: git commit -m 'feat: 功能描述'"
echo "   3. 完成后运行: ./finish-feature.sh $FEATURE_NAME"