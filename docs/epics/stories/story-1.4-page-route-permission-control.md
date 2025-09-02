# Story 1.4: 页面路由权限控制实现

## Story Details

**Story ID**: STORY-1.4  
**Epic**: [Epic 001 - 页面级权限控制系统实现](../epic-001-page-level-permission-control.md)  
**Priority**: P0 - Critical  
**Effort**: 21 Story Points  
**Sprint**: Sprint 2-3  

## User Story

**As a** 前端开发者  
**I want** 实现页面级别的访问控制  
**So that** 普通用户只能访问授权的页面，未授权访问时自动重定向到合适的页面  

## Business Context

### Problem Statement
当前应用缺乏页面级权限控制，需要实现基于用户角色的路由保护机制，确保用户只能访问授权的页面。

### Business Value
- 实现细粒度的页面访问控制
- 防止未授权用户访问敏感页面
- 提供良好的用户体验和导航
- 建立安全的前端权限边界

## Acceptance Criteria

### AC1: ProtectedRoute组件实现
```typescript
// components/base/protected-route.tsx
interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRoles: string[];
  fallbackPath?: string;
  showFallback?: boolean;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredRoles,
  fallbackPath = '/chat',
  showFallback = false
}) => {
  const { user, role } = useUserRole();
  const { canAccess } = usePermission();
  
  if (!user) {
    return <Navigate to="/signin" replace />;
  }
  
  if (!canAccess(requiredRoles)) {
    if (showFallback) {
      return <UnauthorizedFallback requiredRoles={requiredRoles} />;
    }
    return <Navigate to={fallbackPath} replace />;
  }
  
  return <>{children}</>;
};
```

**验证标准**:
- ✅ 实现基于角色的路由保护
- ✅ 支持自定义重定向路径
- ✅ 提供未授权访问提示选项
- ✅ 与React Router v6集成

### AC2: 页面权限配置系统
```typescript
// config/route-permissions.ts
export interface RoutePermissionConfig {
  path: string;
  requiredRoles: string[];
  fallbackPath: string;
  exact?: boolean;
  children?: RoutePermissionConfig[];
}

export const ROUTE_PERMISSIONS: RoutePermissionConfig[] = [
  // Admin-only routes
  {
    path: '/admin',
    requiredRoles: ['admin'],
    fallbackPath: '/chat',
    children: [
      { path: '/admin/users', requiredRoles: ['admin'], fallbackPath: '/chat' },
      { path: '/admin/settings', requiredRoles: ['admin'], fallbackPath: '/chat' },
      { path: '/admin/system', requiredRoles: ['admin'], fallbackPath: '/chat' },
    ]
  },
  
  // User accessible routes
  {
    path: '/chat',
    requiredRoles: ['admin', 'user'],
    fallbackPath: '/signin'
  },
  {
    path: '/knowledge-base',
    requiredRoles: ['admin', 'user'],
    fallbackPath: '/signin'
  },
  
  // Public routes
  { path: '/signin', requiredRoles: [], fallbackPath: '/chat' },
  { path: '/forgot-password', requiredRoles: [], fallbackPath: '/chat' },
];
```

**验证标准**:
- ✅ 配置涵盖所有主要路由
- ✅ 支持嵌套路由权限
- ✅ 普通用户只能访问对话和知识库
- ✅ 管理员保持完整访问权限

### AC3: 路由权限中间件
```typescript
// hooks/use-route-protection.ts
export const useRouteProtection = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, role } = useUserRole();
  
  const checkRoutePermission = useCallback((path: string) => {
    const config = findRouteConfig(path, ROUTE_PERMISSIONS);
    if (!config) return true; // Allow if no config found
    
    if (!user) return false;
    if (config.requiredRoles.length === 0) return true; // Public route
    
    return config.requiredRoles.includes(role?.name || '');
  }, [user, role]);
  
  const redirectToAuthorized = useCallback(() => {
    const config = findRouteConfig(location.pathname, ROUTE_PERMISSIONS);
    if (config && !checkRoutePermission(location.pathname)) {
      navigate(config.fallbackPath, { replace: true });
    }
  }, [location.pathname, navigate, checkRoutePermission]);
  
  return { checkRoutePermission, redirectToAuthorized };
};
```

**验证标准**:
- ✅ 实现路由权限检查逻辑
- ✅ 支持自动重定向机制
- ✅ 与React Router导航集成
- ✅ 处理嵌套路由权限

### AC4: 未授权访问处理
```typescript
// components/base/unauthorized-fallback.tsx
interface UnauthorizedFallbackProps {
  requiredRoles: string[];
  currentPath?: string;
}

export const UnauthorizedFallback: React.FC<UnauthorizedFallbackProps> = ({
  requiredRoles,
  currentPath
}) => {
  const { t } = useTranslation();
  const { role } = useUserRole();
  const navigate = useNavigate();
  
  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <div className="text-center">
        <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
        <h2 className="text-2xl font-semibold mb-2">
          {t('access.denied.title')}
        </h2>
        <p className="text-gray-600 mb-4">
          {t('access.denied.message', { 
            required: requiredRoles.join(', '),
            current: role?.name || 'none'
          })}
        </p>
        <Button onClick={() => navigate('/chat')}>
          {t('access.denied.goToChat')}
        </Button>
      </div>
    </div>
  );
};
```

**验证标准**:
- ✅ 提供友好的未授权访问页面
- ✅ 显示当前用户角色和所需角色
- ✅ 提供返回授权页面的快捷操作
- ✅ 支持国际化和主题一致性

### AC5: 路由重定向逻辑
```typescript
// utils/route-redirect.ts
export const RouteRedirectUtils = {
  getDefaultRouteForRole: (role: string | null): string => {
    switch (role) {
      case 'admin':
        return '/admin'; // 管理员默认到管理页面
      case 'user':
        return '/chat';  // 普通用户默认到对话页面
      default:
        return '/signin'; // 未认证用户到登录页面
    }
  },
  
  getFallbackRoute: (attemptedPath: string, userRole: string | null): string => {
    const config = findRouteConfig(attemptedPath, ROUTE_PERMISSIONS);
    
    if (config?.fallbackPath) {
      return config.fallbackPath;
    }
    
    return RouteRedirectUtils.getDefaultRouteForRole(userRole);
  },
};

// 登录后重定向逻辑
export const useLoginRedirect = () => {
  const { role } = useUserRole();
  const location = useLocation();
  
  const getRedirectPath = useCallback(() => {
    // 检查是否有预期的重定向路径
    const state = location.state as { from?: { pathname: string } };
    const from = state?.from?.pathname;
    
    if (from && checkRoutePermission(from)) {
      return from;
    }
    
    return RouteRedirectUtils.getDefaultRouteForRole(role?.name || null);
  }, [role, location.state]);
  
  return { getRedirectPath };
};
```

**验证标准**:
- ✅ 实现智能的路由重定向逻辑
- ✅ 登录后根据角色重定向到合适页面
- ✅ 支持登录前路径记忆和恢复
- ✅ 处理多种重定向场景

## Technical Specifications

### Route Protection Architecture
```typescript
// App.tsx 路由保护集成
function App() {
  return (
    <Router>
      <Routes>
        {/* Public routes */}
        <Route path="/signin" element={<SignIn />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        
        {/* Protected routes */}
        <Route path="/chat/*" element={
          <ProtectedRoute requiredRoles={['admin', 'user']}>
            <ChatLayout />
          </ProtectedRoute>
        } />
        
        <Route path="/knowledge-base/*" element={
          <ProtectedRoute requiredRoles={['admin', 'user']}>
            <KnowledgeBaseLayout />
          </ProtectedRoute>
        } />
        
        <Route path="/admin/*" element={
          <ProtectedRoute requiredRoles={['admin']} fallbackPath="/chat">
            <AdminLayout />
          </ProtectedRoute>
        } />
        
        {/* Default redirect */}
        <Route path="/" element={<Navigate to="/chat" replace />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Router>
  );
}
```

### Permission Checking Performance
```typescript
// 优化的权限检查，避免重复计算
const useOptimizedPermissionCheck = () => {
  const { user, role } = useUserRole();
  
  const permissionCache = useMemo(() => {
    if (!user || !role) return new Map();
    
    const cache = new Map<string, boolean>();
    
    ROUTE_PERMISSIONS.forEach(config => {
      const hasPermission = config.requiredRoles.length === 0 || 
                           config.requiredRoles.includes(role.name);
      cache.set(config.path, hasPermission);
    });
    
    return cache;
  }, [user, role]);
  
  return { permissionCache };
};
```

### Browser History Integration
```typescript
// 处理浏览器前进/后退按钮
export const useHistoryPermissionGuard = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { checkRoutePermission } = useRouteProtection();
  
  useEffect(() => {
    if (!checkRoutePermission(location.pathname)) {
      const fallbackPath = RouteRedirectUtils.getFallbackRoute(
        location.pathname,
        role?.name || null
      );
      navigate(fallbackPath, { replace: true });
    }
  }, [location.pathname]);
};
```

## Integration Verification

### IV1: 管理员访问权限验证
**测试场景**:
- 管理员用户可访问所有现有页面
- 路由跳转和导航功能正常
- 管理员特有页面正确显示

**验收标准**:
- ✅ 管理员100%页面访问权限保持
- ✅ 现有导航和路由功能无回归
- ✅ 页面加载和跳转性能正常

### IV2: 普通用户权限限制验证
**测试场景**:
- 普通用户只能访问对话和知识库页面
- 访问管理员页面自动重定向到对话页面
- 直接URL访问受限页面被正确拦截

**验收标准**:
- ✅ 普通用户访问限制100%有效
- ✅ 重定向到对话页面<1秒完成
- ✅ URL直接访问拦截率100%

### IV3: 浏览器导航行为验证
**测试场景**:
- 前进/后退按钮在权限控制下正确工作
- 页面刷新后权限状态保持
- 多标签页权限状态同步

**验收标准**:
- ✅ 浏览器导航功能完全正常
- ✅ 页面刷新权限检查<500ms
- ✅ 跨标签页权限同步准确

## Implementation Tasks

### Core Route Protection
- [ ] 实现ProtectedRoute组件
- [ ] 创建路由权限配置系统
- [ ] 开发权限检查逻辑
- [ ] 集成React Router v6

### User Experience  
- [ ] 实现未授权访问提示组件
- [ ] 创建智能重定向逻辑
- [ ] 开发登录后路径恢复
- [ ] 优化页面切换动画

### Performance & Integration
- [ ] 实现权限检查缓存
- [ ] 优化路由渲染性能
- [ ] 集成浏览器历史记录
- [ ] 添加错误边界处理

### Testing & Documentation
- [ ] 单元测试：组件和Hook
- [ ] 集成测试：路由保护流程
- [ ] E2E测试：完整用户流程
- [ ] 性能测试：路由切换速度

## Definition of Done

### Security & Functionality
- ✅ 路由权限控制100%有效
- ✅ 无权限绕过漏洞
- ✅ 重定向逻辑完全正确
- ✅ 错误处理完善

### User Experience
- ✅ 页面切换流畅自然
- ✅ 未授权提示友好清晰
- ✅ 浏览器导航行为正常
- ✅ 响应式设计兼容

### Performance  
- ✅ 路由切换<300ms
- ✅ 权限检查<50ms
- ✅ 内存使用优化
- ✅ 无性能回归

### Code Quality
- ✅ TypeScript类型完整
- ✅ 测试覆盖率>90%
- ✅ 代码review通过
- ✅ 文档完整准确

## Risks & Mitigation

### Security Risks
**Risk**: 前端路由保护被绕过
- *Probability*: Low
- *Impact*: High
- *Mitigation*: 后端API双重验证 + 客户端代码混淆

**Risk**: 权限状态不同步导致访问异常
- *Probability*: Medium  
- *Impact*: Medium
- *Mitigation*: 实时状态同步 + 权限状态验证

### User Experience Risks
**Risk**: 过度重定向影响用户体验
- *Probability*: Medium
- *Impact*: Low
- *Mitigation*: 智能重定向逻辑 + 用户反馈收集

### Performance Risks
**Risk**: 权限检查影响页面加载速度
- *Probability*: Low
- *Impact*: Low  
- *Mitigation*: 权限缓存 + 异步检查 + 性能监控

## Dependencies

### Upstream Dependencies
- Story 1.3: 前端用户角色状态管理 (必需)
- React Router v6配置
- 用户认证状态管理

### Downstream Dependencies  
- Story 1.5需要路由权限检查
- Story 1.6需要重定向机制
- All UI components需要权限上下文

---

**Story Status**: Blocked (等待Story 1.3完成)  
**Assignee**: Frontend Development Team  
**Reviewer**: Frontend Lead + Security Review  
**Created**: 2025-09-02  
**Last Updated**: 2025-09-02