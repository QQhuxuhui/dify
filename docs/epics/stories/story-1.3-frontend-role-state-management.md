# Story 1.3: 前端用户角色状态管理

## Story Details

**Story ID**: STORY-1.3  
**Epic**: [Epic 001 - 页面级权限控制系统实现](../epic-001-page-level-permission-control.md)  
**Priority**: P0 - Critical  
**Effort**: 13 Story Points  
**Sprint**: Sprint 2  

## User Story

**As a** 前端开发者  
**I want** 在前端应用中管理和访问用户角色状态  
**So that** 可以基于用户角色动态控制UI组件的显示和页面访问权限  

## Business Context

### Problem Statement
前端应用需要实时了解用户角色信息，以便动态渲染UI组件和控制页面访问权限，但当前缺乏角色状态管理机制。

### Business Value
- 实现前端权限控制的基础设施
- 提供一致的角色状态访问接口
- 支持实时的权限状态同步
- 为UI组件提供角色上下文

## Acceptance Criteria

### AC1: 用户状态管理扩展
```typescript
// types/user.ts
interface UserRole {
  id: string;
  name: 'admin' | 'user';
  description: string;
}

interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  role: UserRole; // 新增字段
}

// stores/user-store.ts
interface UserState {
  user: User | null;
  isAuthenticated: boolean;
  role: UserRole | null; // 便捷访问
}
```

**验证标准**:
- ✅ 用户状态接口包含角色信息
- ✅ 提供角色的便捷访问属性
- ✅ 与现有用户状态管理兼容
- ✅ TypeScript类型定义完整

### AC2: 角色状态管理Hooks
```typescript
// hooks/use-user-role.ts
export const useUserRole = () => {
  const { user } = useUser();
  
  return {
    role: user?.role,
    isAdmin: user?.role?.name === 'admin',
    isUser: user?.role?.name === 'user',
    hasRole: (roleName: string) => user?.role?.name === roleName,
    hasAnyRole: (roleNames: string[]) => roleNames.includes(user?.role?.name || ''),
  };
};

// hooks/use-permission.ts  
export const usePermission = () => {
  const { role } = useUserRole();
  
  return {
    canAccess: (requiredRoles: string[]) => {
      return requiredRoles.includes(role?.name || '');
    },
    canAccessRoute: (routePath: string) => {
      // Route permission checking logic
    },
  };
};
```

**验证标准**:
- ✅ 提供便捷的角色查询Hook
- ✅ 实现权限检查Hook
- ✅ 支持路由权限验证
- ✅ Hook返回值类型安全

### AC3: 角色状态持久化
```typescript
// utils/role-storage.ts
export const RoleStorage = {
  setRole: (role: UserRole) => {
    localStorage.setItem('user_role', JSON.stringify(role));
  },
  
  getRole: (): UserRole | null => {
    const stored = localStorage.getItem('user_role');
    return stored ? JSON.parse(stored) : null;
  },
  
  clearRole: () => {
    localStorage.removeItem('user_role');
  },
};
```

**验证标准**:
- ✅ 角色信息本地存储和恢复
- ✅ 页面刷新后状态保持
- ✅ 登出时清理角色数据
- ✅ 存储数据加密和验证

### AC4: 后端同步机制
```typescript
// services/user-service.ts
export const UserService = {
  getCurrentUser: async (): Promise<User> => {
    const response = await fetch('/api/user/profile');
    const userData = await response.json();
    return userData;
  },
  
  refreshUserRole: async (): Promise<UserRole> => {
    const user = await UserService.getCurrentUser();
    return user.role;
  },
};

// hooks/use-user-sync.ts
export const useUserSync = () => {
  const { setUser } = useUser();
  
  const syncUserData = useCallback(async () => {
    const userData = await UserService.getCurrentUser();
    setUser(userData);
  }, [setUser]);
  
  return { syncUserData };
};
```

**验证标准**:
- ✅ 实现用户数据同步API调用
- ✅ 支持角色信息实时刷新
- ✅ 错误处理和重试机制
- ✅ 同步状态指示器

### AC5: 工具函数和类型定义
```typescript
// utils/permission-utils.ts
export const PermissionUtils = {
  isAdmin: (user: User | null): boolean => {
    return user?.role?.name === 'admin';
  },
  
  canAccessChat: (user: User | null): boolean => {
    return ['admin', 'user'].includes(user?.role?.name || '');
  },
  
  canAccessKnowledgeBase: (user: User | null): boolean => {
    return ['admin', 'user'].includes(user?.role?.name || '');
  },
  
  canAccessAdminPanel: (user: User | null): boolean => {
    return user?.role?.name === 'admin';
  },
};
```

**验证标准**:
- ✅ 提供常用权限检查工具函数
- ✅ 类型安全的权限验证
- ✅ 覆盖主要功能模块权限
- ✅ 易于扩展和维护

## Technical Specifications

### State Management Architecture
```typescript
// 使用Zustand进行状态管理
interface UserStore {
  // State
  user: User | null;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  setUser: (user: User) => void;
  updateRole: (role: UserRole) => void;
  clearUser: () => void;
  fetchUser: () => Promise<void>;
  
  // Computed
  isAuthenticated: boolean;
  currentRole: UserRole | null;
  permissions: string[];
}

const useUserStore = create<UserStore>((set, get) => ({
  // Implementation...
}));
```

### React Context Integration
```typescript
// contexts/permission-context.tsx
interface PermissionContextType {
  user: User | null;
  role: UserRole | null;
  permissions: string[];
  hasPermission: (permission: string) => boolean;
  canAccess: (route: string) => boolean;
}

export const PermissionProvider: React.FC<{ children: React.ReactNode }> = ({
  children
}) => {
  // Context implementation...
};
```

### Type Definitions
```typescript
// types/permissions.ts
export type RoleName = 'admin' | 'user';
export type Permission = 'chat' | 'knowledge_base' | 'admin_panel' | 'user_management';

export interface RoutePermission {
  path: string;
  requiredRoles: RoleName[];
  fallbackPath?: string;
}

export const ROUTE_PERMISSIONS: RoutePermission[] = [
  { path: '/chat', requiredRoles: ['admin', 'user'] },
  { path: '/knowledge-base', requiredRoles: ['admin', 'user'] },
  { path: '/admin', requiredRoles: ['admin'], fallbackPath: '/chat' },
];
```

## Integration Verification

### IV1: 现有用户状态管理兼容性
**测试场景**:
- 现有登录/登出流程正常工作
- 用户状态更新不影响现有组件
- 状态管理性能无显著下降

**验收标准**:
- ✅ 现有功能100%正常工作
- ✅ 组件渲染性能无回归
- ✅ 状态更新不引起不必要重渲染

### IV2: 角色状态实时同步验证
**测试场景**:
- 用户角色变更实时反映在UI
- 页面刷新后角色状态正确恢复
- 多标签页角色状态同步

**验收标准**:
- ✅ 角色变更<1秒内UI更新
- ✅ 页面刷新状态100%保持
- ✅ 跨标签页状态同步正确

### IV3: Hook和工具函数可用性验证
**测试场景**:
- Hook在各种组件中正确工作
- 工具函数返回准确的权限判断
- TypeScript类型检查无错误

**验收标准**:
- ✅ Hook在所有场景下稳定工作
- ✅ 权限判断100%准确
- ✅ TypeScript编译无错误或警告

## Implementation Tasks

### Core State Management
- [ ] 扩展用户状态接口，添加角色字段
- [ ] 实现角色状态管理逻辑
- [ ] 创建角色数据持久化机制
- [ ] 集成现有Zustand用户store

### Hooks Development
- [ ] 开发useUserRole Hook
- [ ] 实现usePermission Hook  
- [ ] 创建useUserSync Hook
- [ ] 编写Hook单元测试

### Utility Functions
- [ ] 实现权限检查工具函数
- [ ] 创建路由权限配置
- [ ] 开发角色存储工具
- [ ] 编写类型定义文件

### Integration & Testing
- [ ] 集成现有用户认证流程
- [ ] 实现后端API数据同步
- [ ] 编写集成测试
- [ ] 性能优化和测试

## Definition of Done

### Functionality
- ✅ 角色状态管理完全集成
- ✅ Hook和工具函数全部可用
- ✅ 状态持久化和同步正常
- ✅ 权限检查逻辑准确

### Code Quality  
- ✅ TypeScript类型定义完整
- ✅ 单元测试覆盖率>90%
- ✅ 代码review通过
- ✅ ESLint和Prettier检查通过

### Performance
- ✅ 状态管理无性能回归
- ✅ Hook使用不引起过度渲染
- ✅ 本地存储操作优化
- ✅ API调用合理缓存

### Integration
- ✅ 与现有系统完全兼容
- ✅ 错误处理机制完善
- ✅ 日志记录适当
- ✅ 文档和注释完整

## Risks & Mitigation

### Technical Risks
**Risk**: 状态管理复杂性导致bug
- *Probability*: Medium
- *Impact*: Medium
- *Mitigation*: 充分的单元测试 + 状态管理最佳实践

**Risk**: 角色状态同步延迟或失败
- *Probability*: Low
- *Impact*: Medium  
- *Mitigation*: 重试机制 + 错误处理 + 用户反馈

### Performance Risks
**Risk**: Hook使用导致过度渲染
- *Probability*: Medium
- *Impact*: Low
- *Mitigation*: React.memo + useMemo + 性能监控

### Integration Risks  
**Risk**: 与现有状态管理冲突
- *Probability*: Low
- *Impact*: Medium
- *Mitigation*: 渐进式迁移 + 兼容性测试

## Dependencies

### Upstream Dependencies
- Story 1.2: 后端API权限验证 (需要用户角色API)
- 现有用户认证和状态管理系统
- TypeScript和React Hook配置

### Downstream Dependencies
- Story 1.4需要角色状态查询
- Story 1.5需要用户角色Hook
- All UI stories依赖角色状态管理

---

**Story Status**: Ready (等待Story 1.2 API部分完成)  
**Assignee**: Frontend Development Team  
**Reviewer**: Frontend Lead  
**Created**: 2025-09-02  
**Last Updated**: 2025-09-02