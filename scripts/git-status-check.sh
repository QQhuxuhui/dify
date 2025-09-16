#!/bin/bash
# Git状态检查脚本

echo "🌳 Git分支状态检查"
echo "==================="

# 当前分支信息
echo "📍 当前分支:"
CURRENT_BRANCH=$(git branch --show-current)
echo "   $CURRENT_BRANCH"

# 检查工作区状态
echo -e "\n💾 工作区状态:"
if git diff-index --quiet HEAD --; then
    echo "   ✅ 工作区干净"
else
    echo "   ⚠️  有未提交的更改:"
    git status --porcelain | head -10
fi

# 检查是否有未推送的提交
echo -e "\n📤 推送状态:"
UNPUSHED=$(git log @{u}.. --oneline 2>/dev/null | wc -l)
if [ $UNPUSHED -eq 0 ]; then
    echo "   ✅ 所有提交已推送"
else
    echo "   ⚠️  有 $UNPUSHED 个未推送的提交"
fi

# 检查是否有未拉取的提交
echo -e "\n📥 拉取状态:"
git fetch --quiet
UNPULLED=$(git log ..@{u} --oneline 2>/dev/null | wc -l)
if [ $UNPULLED -eq 0 ]; then
    echo "   ✅ 分支是最新的"
else
    echo "   ⚠️  远程有 $UNPULLED 个新提交"
fi

# 显示本地分支
echo -e "\n🌿 本地分支:"
git branch | sed 's/^/   /'

# 显示功能分支
echo -e "\n🚀 功能分支:"
FEATURE_BRANCHES=$(git branch | grep "feature/" | wc -l)
if [ $FEATURE_BRANCHES -eq 0 ]; then
    echo "   ✅ 无活跃功能分支"
else
    git branch | grep "feature/" | sed 's/^/   /'
fi

# 显示最近的提交
echo -e "\n📝 最近提交 (5条):"
git log --oneline -5 | sed 's/^/   /'

# 检查未合并的分支
echo -e "\n🔀 未合并的分支:"
UNMERGED=$(git branch --no-merged | grep -v "main\|custom-dev" | wc -l)
if [ $UNMERGED -eq 0 ]; then
    echo "   ✅ 所有分支已合并"
else
    git branch --no-merged | grep -v "main\|custom-dev" | sed 's/^/   /'
fi

# 磁盘使用情况
echo -e "\n💾 Git仓库大小:"
du -sh .git | sed 's/^/   /'

echo -e "\n📊 分支统计:"
echo "   总分支数: $(git branch -a | wc -l)"
echo "   本地分支: $(git branch | wc -l)"
echo "   远程分支: $(git branch -r | wc -l)"