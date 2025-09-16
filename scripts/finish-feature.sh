#!/bin/bash
# 完成功能开发脚本

set -e

FEATURE_NAME=$1
BASE_BRANCH="custom-dev-1.1.3"
BRANCH_NAME="feature/$FEATURE_NAME"

if [ -z "$FEATURE_NAME" ]; then
    echo "❌ 用法: ./finish-feature.sh 功能名称"
    exit 1
fi

echo "🏁 完成功能开发: $FEATURE_NAME"

# 检查是否在功能分支上
CURRENT_BRANCH=$(git branch --show-current)
if [ "$CURRENT_BRANCH" != "$BRANCH_NAME" ]; then
    echo "⚠️  请先切换到功能分支: git checkout $BRANCH_NAME"
    exit 1
fi

# 检查工作区是否干净
if ! git diff-index --quiet HEAD --; then
    echo "⚠️  工作区有未提交的更改，请先提交"
    git status --porcelain
    exit 1
fi

# 推送最新的功能分支代码
echo "📤 推送功能分支最新代码..."
git push origin $BRANCH_NAME

# 切换到基础分支并拉取最新代码
echo "📥 切换到基础分支: $BASE_BRANCH"
git checkout $BASE_BRANCH
git pull origin $BASE_BRANCH

# 合并功能分支
echo "🔀 合并功能分支到 $BASE_BRANCH"
git merge $BRANCH_NAME --no-ff -m "Merge $BRANCH_NAME into $BASE_BRANCH"

# 推送合并结果
echo "📤 推送合并结果..."
git push origin $BASE_BRANCH

# 删除本地功能分支
echo "🗑️  删除本地功能分支..."
git branch -d $BRANCH_NAME

# 删除远程功能分支
echo "🗑️  删除远程功能分支..."
git push origin --delete $BRANCH_NAME

echo "✅ 功能 $FEATURE_NAME 已成功合并到 $BASE_BRANCH!"
echo "📋 分支清理完成"