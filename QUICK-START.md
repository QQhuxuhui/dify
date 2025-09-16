# 🚀 新功能开发快速指南

## 📋 开始之前

确保您已经配置好Git工作流环境：
- ✅ Git管理脚本已安装 (`scripts/` 目录)
- ✅ 当前在 `custom-dev-1.1.3` 分支
- ✅ 工作区状态干净

## 🌟 开发新功能的完整流程

### 步骤1: 检查Git状态
```bash
./scripts/git-status-check.sh
```

### 步骤2: 开始新功能
```bash
# 语法: ./scripts/start-feature.sh 功能名称
./scripts/start-feature.sh 用户权限增强
```

### 步骤3: 开发功能
```bash
# 在功能分支上开发
git add .
git commit -m "feat: 实现角色权限细粒度控制"

# 继续开发...
git commit -m "feat: 添加权限继承机制"
git commit -m "test: 添加权限测试用例"

# 定期推送
git push origin feature/用户权限增强
```

### 步骤4: 完成功能
```bash
./scripts/finish-feature.sh 用户权限增强
```

## 📝 提交信息规范

### 类型标识
- `feat`: 新功能
- `fix`: 修复问题
- `docs`: 文档更新
- `style`: 代码格式
- `refactor`: 重构
- `test`: 测试
- `chore`: 构建工具

### 示例
```bash
feat(auth): 添加多因素认证

- 实现SMS验证码
- 集成Google Authenticator
- 更新登录界面

影响: 用户需重新设置认证
```

## 🔧 常用命令参考

### 日常检查
```bash
# 完整状态检查
./scripts/git-status-check.sh

# 简单状态查看
git status
git log --oneline -10
```

### 分支操作
```bash
# 查看所有分支
git branch -a

# 切换分支
git checkout 分支名

# 删除已合并分支
git branch -d 分支名
```

### 同步操作
```bash
# 拉取最新代码
git pull origin custom-dev-1.1.3

# 推送当前分支
git push origin HEAD

# 强制同步(谨慎使用)
git reset --hard origin/分支名
```

## 🚨 紧急修复流程

### Hotfix (生产环境紧急修复)
```bash
git checkout main
git pull origin main
git checkout -b hotfix/安全漏洞修复
# 修复代码
git commit -m "fix: 修复SQL注入漏洞"
git checkout main
git merge hotfix/安全漏洞修复
git push origin main
git tag v1.1.3-hotfix.1
git push origin --tags
```

### Bugfix (开发环境修复)
```bash
git checkout custom-dev-1.1.3
git pull origin custom-dev-1.1.3
git checkout -b bugfix/登录页面异常
# 修复代码
git commit -m "fix: 修复登录页面响应式布局"
git checkout custom-dev-1.1.3
git merge bugfix/登录页面异常
git push origin custom-dev-1.1.3
```

## ⚡ 脚本工具说明

### `start-feature.sh`
- 自动切换到开发分支
- 拉取最新代码
- 创建功能分支
- 推送到远程

### `finish-feature.sh`
- 合并功能到开发分支
- 推送合并结果
- 清理本地和远程分支

### `git-status-check.sh`
- 全面的Git状态检查
- 工作区状态诊断
- 分支同步状态
- 磁盘使用统计

## 🎯 最佳实践

### DO's ✅
- 功能分支保持小而专注
- 提交信息清晰描述变更
- 定期推送避免代码丢失
- 合并前进行代码审查

### DON'Ts ❌
- 在主分支直接开发
- 创建过长的功能分支
- 强制推送到共享分支
- 忽略合并冲突

## 📞 需要帮助?

如果遇到问题：
1. 运行 `./scripts/git-status-check.sh` 诊断
2. 查看 `GIT-WORKFLOW.md` 详细文档
3. 使用 `git help 命令` 查看帮助