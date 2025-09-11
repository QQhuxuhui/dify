# Dify Web容器单独升级指南

## 概述

基于你的修改分析，主要变更集中在前端Web容器，因此可以只升级Web容器，大幅降低升级成本和风险。

## 修改内容概述

你的自定义功能主要包括：
- ✨ **用户权限控制**: 普通用户只能访问知识库功能
- 🛡️ **路由保护**: 防止普通用户访问受限页面  
- 🎨 **界面优化**: 基于角色显示/隐藏功能模块
- 📱 **用户体验**: 简化普通用户界面，精确权限控制

## 快速升级步骤

### 方式一：自动化脚本升级（推荐）

```bash
# 1. 赋予执行权限
chmod +x upgrade-web-only.sh

# 2. 执行升级脚本
./upgrade-web-only.sh
```

### 方式二：手动分步升级

```bash
# 1. 停止Web容器
docker-compose stop web

# 2. 备份当前容器（可选）
docker commit dify-web-1 dify-web-backup:$(date +%Y%m%d_%H%M%S)

# 3. 构建自定义镜像
docker build -t custom-dify-web:1.1.3 -f docker/Dockerfile.web .

# 4. 备份配置文件
cp docker-compose.yaml docker-compose.yaml.backup

# 5. 修改docker-compose.yaml中web服务的镜像
sed -i 's|langgenius/dify-web:1.1.3|custom-dify-web:1.1.3|' docker-compose.yaml

# 6. 启动新Web容器
docker-compose up -d web

# 7. 检查运行状态
docker-compose ps web
docker-compose logs web
```

## 升级验证

升级完成后，请验证以下功能：

### 管理员用户验证
- ✅ 可以访问所有功能模块（应用、知识库、工具、插件等）
- ✅ 导航栏显示完整菜单
- ✅ 功能权限不受影响

### 普通用户验证  
- ✅ 只显示知识库(数据集)入口
- ✅ 直接访问受限URL会被重定向到 `/datasets`
- ✅ 可以正常创建和管理知识库
- ✅ 可以上传文档和管理数据集
- ✅ 无法看到应用、工具、插件等模块

## 回滚方案

如果升级后出现问题，可以快速回滚：

```bash
# 停止当前Web容器
docker-compose stop web

# 恢复原始配置
cp docker-compose.yaml.backup docker-compose.yaml

# 启动原始Web容器
docker-compose up -d web
```

## 升级优势

### 💰 成本优势
- **最小化影响**: 只升级Web容器，其他容器保持不变
- **快速部署**: 构建时间约2-5分钟，重启时间约30秒
- **资源节约**: 无需重新下载和初始化数据库、向量库等服务

### 🛡️ 风险控制  
- **数据安全**: 数据库、Redis、存储卷完全不受影响
- **服务连续**: API服务持续运行，最小化停机时间
- **快速回滚**: 30秒内可恢复到升级前状态

### ⚡ 技术优势
- **增量更新**: 基于官方镜像，只应用你的修改
- **向前兼容**: 保持与Dify 1.1.3的完全兼容性  
- **热升级**: 支持不停止其他服务的情况下升级

## 注意事项

1. **权限验证**: 升级后务必测试不同角色用户的权限控制
2. **功能测试**: 验证知识库创建、文档上传等核心功能
3. **日志监控**: 观察升级后的容器日志，确保无错误
4. **备份重要**: 虽然影响范围小，仍建议做好备份

## 故障排除

### 常见问题

**Q: 构建镜像失败**
```bash
# 检查文件是否存在
ls -la web/app/components/header/index.tsx
ls -la web/components/route-guard/normal-user-guard.tsx

# 清理Docker缓存重试
docker system prune -f
docker build --no-cache -t custom-dify-web:1.1.3 -f docker/Dockerfile.web .
```

**Q: Web容器启动失败**
```bash
# 查看详细错误日志
docker-compose logs web

# 检查容器状态
docker-compose ps web
```

**Q: 权限控制不生效**
- 检查浏览器缓存，尝试强制刷新（Ctrl+F5）
- 确认用户角色设置正确
- 查看浏览器控制台是否有JavaScript错误

---

升级完成后，你将拥有一个具备精细化权限控制的Dify系统，满足企业级多用户场景需求！