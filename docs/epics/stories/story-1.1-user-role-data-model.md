# Story 1.1: 用户角色数据模型设计与实现

## Story Details

**Story ID**: STORY-1.1  
**Epic**: [Epic 001 - 页面级权限控制系统实现](../epic-001-page-level-permission-control.md)  
**Priority**: P0 - Critical  
**Effort**: 13 Story Points  
**Sprint**: Sprint 1  

## User Story

**As a** 系统开发者  
**I want** 建立用户角色的数据模型和数据库结构  
**So that** 系统能够存储和管理用户的角色信息，为权限控制提供数据基础  

## Business Context

### Problem Statement
当前系统缺乏用户角色管理机制，需要建立数据基础来支持角色权限控制功能的实现。

### Business Value
- 建立权限控制的数据基础
- 确保现有用户数据的完整性和连续性
- 为未来角色系统扩展提供可扩展的数据结构

## Acceptance Criteria

### AC1: 数据库表结构设计
```sql
-- 创建用户角色表
CREATE TABLE user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 添加用户角色关联字段
ALTER TABLE accounts ADD COLUMN role_id UUID REFERENCES user_roles(id);
```

**验证标准**:
- ✅ 用户角色表包含必要字段：id, name, description, is_active, timestamps
- ✅ 支持角色类型：'admin', 'user'
- ✅ 建立用户与角色的外键关联关系

### AC2: 数据库迁移脚本
**验证标准**:
- ✅ 创建可逆的数据库迁移脚本
- ✅ 为现有用户设置默认角色(admin)
- ✅ 迁移脚本包含完整的回滚逻辑
- ✅ 迁移过程中确保数据完整性

### AC3: SQLAlchemy模型实现
```python
class UserRole(db.Model):
    __tablename__ = 'user_roles'
    
    id = db.Column(StringUUID, primary_key=True, default=lambda: str(uuid.uuid4()))
    name = db.Column(db.String(50), nullable=False, unique=True)
    description = db.Column(db.Text)
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    users = db.relationship('Account', backref='role', lazy='dynamic')
```

**验证标准**:
- ✅ UserRole模型包含所有必需字段和关系
- ✅ Account模型扩展包含role_id字段
- ✅ 实现基础CRUD操作方法

### AC4: 角色初始化和种子数据
**验证标准**:
- ✅ 创建默认角色：admin(管理员)、user(普通用户)
- ✅ 为现有用户分配admin角色，保持现有访问权限
- ✅ 提供角色数据的种子脚本

### AC5: 基础API端点
```python
# 角色查询API
GET /api/roles
GET /api/roles/<role_id>

# 用户角色API  
GET /api/users/<user_id>/role
PUT /api/users/<user_id>/role
```

**验证标准**:
- ✅ 实现角色查询API端点
- ✅ 实现用户角色查询和更新API
- ✅ API响应包含完整的角色信息

## Technical Specifications

### Database Schema Design
```sql
-- 完整的表结构
CREATE TABLE user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(50) NOT NULL UNIQUE CHECK (name IN ('admin', 'user')),
    description TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 用户表扩展
ALTER TABLE accounts 
ADD COLUMN role_id UUID REFERENCES user_roles(id) DEFAULT (SELECT id FROM user_roles WHERE name = 'admin');

-- 索引优化
CREATE INDEX idx_accounts_role_id ON accounts(role_id);
CREATE INDEX idx_user_roles_name ON user_roles(name);
```

### Migration Strategy
1. **Phase 1**: 创建user_roles表和初始数据
2. **Phase 2**: 添加role_id字段到accounts表
3. **Phase 3**: 为现有用户设置默认角色
4. **Phase 4**: 添加外键约束和索引

### Performance Considerations
- **索引策略**: role_id和name字段建立索引
- **查询优化**: 用户角色查询使用JOIN优化
- **缓存策略**: 角色信息适合Redis缓存

## Integration Verification

### IV1: 现有用户登录流程验证
**测试场景**:
- 现有用户能正常登录系统
- 登录后能访问所有现有功能
- 用户会话信息包含角色数据

**验收标准**:
- ✅ 100%现有用户登录成功率
- ✅ 无功能访问权限丢失
- ✅ 用户对象包含role字段

### IV2: 数据库迁移完整性验证  
**测试场景**:
- 迁移脚本执行成功，无数据丢失
- 回滚脚本正确工作
- 数据完整性约束验证通过

**验收标准**:
- ✅ 迁移前后用户数据一致性100%
- ✅ 回滚功能正常，数据可恢复
- ✅ 外键约束和索引正确建立

### IV3: 性能影响验证
**测试场景**:
- 用户查询性能对比
- 登录流程响应时间测量
- 数据库查询执行计划分析

**验收标准**:
- ✅ 用户查询响应时间增长<5%
- ✅ 登录流程响应时间增长<10ms
- ✅ 数据库查询使用索引，避免全表扫描

## Implementation Tasks

### Backend Tasks
- [ ] 设计并创建用户角色数据模型
- [ ] 编写数据库迁移脚本
- [ ] 实现SQLAlchemy模型和关系
- [ ] 创建角色CRUD操作
- [ ] 实现基础API端点
- [ ] 编写单元测试

### Database Tasks  
- [ ] 设计数据库表结构
- [ ] 创建迁移和回滚脚本
- [ ] 设置索引优化策略
- [ ] 准备种子数据
- [ ] 验证数据完整性约束

### Testing Tasks
- [ ] 单元测试：模型和API
- [ ] 集成测试：数据库操作
- [ ] 迁移测试：前后数据一致性
- [ ] 性能测试：查询响应时间
- [ ] 回滚测试：数据恢复验证

## Definition of Done

### Code Quality
- ✅ 代码review通过，符合项目编码规范
- ✅ 单元测试覆盖率>90%
- ✅ 集成测试全部通过
- ✅ 性能测试符合基准要求

### Documentation
- ✅ API文档更新，包含新增端点
- ✅ 数据库schema文档更新  
- ✅ 迁移操作手册完成
- ✅ 代码注释完整，包含docstring

### Deployment Ready
- ✅ 迁移脚本在staging环境验证通过
- ✅ 回滚脚本测试通过
- ✅ 生产环境部署检查清单完成
- ✅ 监控和告警配置就绪

## Risks & Mitigation

### Technical Risks
**Risk**: 迁移过程中数据丢失或损坏
- *Probability*: Low
- *Impact*: High  
- *Mitigation*: 完整的数据备份 + 分阶段迁移 + 回滚验证

**Risk**: 外键约束影响现有操作
- *Probability*: Medium
- *Impact*: Medium
- *Mitigation*: 渐进式约束添加 + 充分的集成测试

### Integration Risks  
**Risk**: 现有API客户端兼容性问题
- *Probability*: Low
- *Impact*: Medium
- *Mitigation*: 向后兼容的API设计 + 版本控制策略

## Dependencies

### Upstream Dependencies
- 现有用户认证系统稳定性
- 数据库迁移工具就绪
- Flask-SQLAlchemy配置正确

### Downstream Dependencies  
- Story 1.2需要角色模型API
- Story 1.3需要角色数据结构
- 所有后续story依赖基础数据模型

---

**Story Status**: Ready for Development  
**Assignee**: Backend Development Team  
**Reviewer**: Technical Lead  
**Created**: 2025-09-02  
**Last Updated**: 2025-09-02