# Story 1.5: 导航菜单动态权限显示

## Story Details

**Story ID**: STORY-1.5  
**Epic**: [Epic 001 - 页面级权限控制系统实现](../epic-001-page-level-permission-control.md)  
**Priority**: P1 - High  
**Effort**: 13 Story Points  
**Sprint**: Sprint 3  

## User Story

**As a** 最终用户  
**I want** 看到基于我角色权限的导航菜单  
**So that** 我能清楚了解可以访问哪些功能，避免尝试访问无权限的页面  

## Business Context

### Problem Statement
当前导航菜单对所有用户显示相同内容，用户无法直观了解自己可以访问哪些功能，需要实现基于角色的动态菜单显示。

### Business Value
- 提供清晰的功能访问指引
- 减少用户尝试访问无权限页面
- 改善整体用户体验和导航效率
- 强化权限控制的用户感知

## Acceptance Criteria

### AC1: 动态导航组件实现
```typescript
// components/base/sidebar.tsx
interface NavigationItem {
  id: string;
  label: string;
  icon: React.ComponentType;
  path: string;
  requiredRoles: string[];
  children?: NavigationItem[];
}

const NAVIGATION_ITEMS: NavigationItem[] = [
  {
    id: 'chat',
    label: 'nav.chat',
    icon: MessageCircle,
    path: '/chat',
    requiredRoles: ['admin', 'user']
  },
  {
    id: 'knowledge-base',
    label: 'nav.knowledgeBase',
    icon: BookOpen,
    path: '/knowledge-base',
    requiredRoles: ['admin', 'user']
  },
  {
    id: 'admin',
    label: 'nav.admin',
    icon: Settings,
    path: '/admin',
    requiredRoles: ['admin'],
    children: [
      {
        id: 'admin-users',
        label: 'nav.admin.users',
        icon: Users,
        path: '/admin/users',
        requiredRoles: ['admin']
      },
      {
        id: 'admin-system',
        label: 'nav.admin.system', 
        icon: Cog,
        path: '/admin/system',
        requiredRoles: ['admin']
      }
    ]
  }
];

export const Sidebar: React.FC = () => {
  const { hasAnyRole } = useUserRole();
  const [filteredItems, setFilteredItems] = useState<NavigationItem[]>([]);
  
  useEffect(() => {
    const filterItems = (items: NavigationItem[]): NavigationItem[] => {
      return items.filter(item => {
        const hasAccess = hasAnyRole(item.requiredRoles);
        if (hasAccess && item.children) {
          item.children = filterItems(item.children);
        }
        return hasAccess;
      });
    };
    
    setFilteredItems(filterItems(NAVIGATION_ITEMS));
  }, [hasAnyRole]);
  
  return (
    <nav className="sidebar">
      {filteredItems.map(item => (
        <NavigationItem key={item.id} item={item} />
      ))}
    </nav>
  );
};
```

**验证标准**:
- ✅ 根据用户角色动态过滤菜单项
- ✅ 支持嵌套菜单权限控制
- ✅ 普通用户只显示对话和知识库菜单
- ✅ 管理员显示所有菜单项

### AC2: 角色标识显示
```typescript
// components/base/user-avatar.tsx
interface UserAvatarProps {
  showRoleIndicator?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export const UserAvatar: React.FC<UserAvatarProps> = ({
  showRoleIndicator = true,
  size = 'md'
}) => {
  const { user, role, isAdmin } = useUserRole();
  const { t } = useTranslation();
  
  return (
    <div className="relative">
      <Avatar size={size} src={user?.avatar} alt={user?.name} />
      
      {showRoleIndicator && role && (
        <div className={cn(
          "absolute -bottom-1 -right-1 rounded-full text-xs px-1.5 py-0.5",
          "bg-primary text-primary-foreground font-medium",
          isAdmin ? "bg-red-500" : "bg-blue-500"
        )}>
          {isAdmin ? (
            <Crown className="w-3 h-3" />
          ) : (
            <User className="w-3 h-3" />
          )}
        </div>
      )}
      
      <Tooltip>
        <TooltipTrigger>
          <div className="sr-only">{t('user.role.current')}</div>
        </TooltipTrigger>
        <TooltipContent>
          <p>{t(`user.role.${role?.name}`)}: {role?.description}</p>
        </TooltipContent>
      </Tooltip>
    </div>
  );
};
```

**验证标准**:
- ✅ 在用户头像显示角色标识
- ✅ 管理员和普通用户使用不同颜色/图标
- ✅ 鼠标悬停显示角色详细信息
- ✅ 支持不同尺寸和样式定制

### AC3: 菜单显示/隐藏动画
```typescript
// components/base/navigation-item.tsx
interface NavigationItemProps {
  item: NavigationItem;
  isActive?: boolean;
}

export const NavigationItem: React.FC<NavigationItemProps> = ({ 
  item, 
  isActive 
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const location = useLocation();
  const isCurrentRoute = location.pathname.startsWith(item.path);
  
  return (
    <AnimatePresence mode="wait">
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        transition={{ duration: 0.2, ease: "easeInOut" }}
        className={cn(
          "navigation-item",
          isCurrentRoute && "navigation-item--active"
        )}
      >
        <Link
          to={item.path}
          className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-accent transition-colors"
        >
          <item.icon className="w-5 h-5" />
          <span className="font-medium">{t(item.label)}</span>
          {item.children && (
            <ChevronRight 
              className={cn(
                "w-4 h-4 transition-transform",
                isExpanded && "rotate-90"
              )}
            />
          )}
        </Link>
        
        {item.children && (
          <AnimatePresence>
            {isExpanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="overflow-hidden"
              >
                <div className="ml-6 mt-2 space-y-1">
                  {item.children.map(child => (
                    <NavigationItem key={child.id} item={child} />
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </motion.div>
    </AnimatePresence>
  );
};
```

**验证标准**:
- ✅ 菜单项显示/隐藏使用平滑动画
- ✅ 动画时长和效果与现有UI一致
- ✅ 支持嵌套菜单的展开/收起动画
- ✅ 当前活动路由高亮显示

### AC4: 响应式菜单适配
```typescript
// hooks/use-responsive-navigation.ts
export const useResponsiveNavigation = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { width } = useWindowSize();
  
  useEffect(() => {
    if (width >= 768) {
      setIsMobileMenuOpen(false);
    }
    
    if (width >= 1024) {
      setIsCollapsed(false);
    }
  }, [width]);
  
  return {
    isMobileMenuOpen,
    setIsMobileMenuOpen,
    isCollapsed,
    setIsCollapsed,
    isMobile: width < 768,
    isDesktop: width >= 1024,
  };
};

// 响应式导航栏实现
export const ResponsiveNavigation: React.FC = () => {
  const { isMobile, isMobileMenuOpen, setIsMobileMenuOpen } = useResponsiveNavigation();
  
  if (isMobile) {
    return (
      <>
        <button onClick={() => setIsMobileMenuOpen(true)}>
          <Menu className="w-6 h-6" />
        </button>
        
        <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
          <SheetContent side="left">
            <Sidebar />
          </SheetContent>
        </Sheet>
      </>
    );
  }
  
  return <Sidebar />;
};
```

**验证标准**:
- ✅ 桌面端显示完整侧边栏导航
- ✅ 移动端显示汉堡菜单和抽屉导航
- ✅ 不同屏幕尺寸下菜单行为正确
- ✅ 触摸设备上的交互体验良好

### AC5: 国际化支持
```typescript
// locales/navigation.ts
export const navigationTranslations = {
  'zh-CN': {
    'nav.chat': '对话',
    'nav.knowledgeBase': '知识库',
    'nav.admin': '管理',
    'nav.admin.users': '用户管理',
    'nav.admin.system': '系统设置',
    'user.role.current': '当前角色',
    'user.role.admin': '管理员',
    'user.role.user': '普通用户'
  },
  'en': {
    'nav.chat': 'Chat',
    'nav.knowledgeBase': 'Knowledge Base',
    'nav.admin': 'Admin',
    'nav.admin.users': 'User Management',
    'nav.admin.system': 'System Settings',
    'user.role.current': 'Current Role',
    'user.role.admin': 'Administrator',
    'user.role.user': 'User'
  }
};
```

**验证标准**:
- ✅ 菜单文本支持中英文切换
- ✅ 角色显示文本完整国际化
- ✅ 工具提示和帮助文本多语言
- ✅ RTL语言支持预留

## Technical Specifications

### Component Architecture
```typescript
// 导航系统组件层次结构
NavigationProvider
├── ResponsiveNavigation
│   ├── Sidebar (Desktop)
│   └── MobileMenu (Mobile)
│       └── Sheet/Drawer
├── NavigationItem
│   ├── NavigationLink
│   └── SubNavigationItems (递归)
└── UserAvatar
    ├── RoleIndicator
    └── UserProfileDropdown
```

### Permission Integration
```typescript
// 权限集成策略
const useNavigationPermissions = () => {
  const { role, hasAnyRole } = useUserRole();
  
  const getVisibleItems = useMemo(() => {
    return (items: NavigationItem[]): NavigationItem[] => {
      return items.reduce((acc, item) => {
        if (hasAnyRole(item.requiredRoles)) {
          const filteredItem = { ...item };
          if (item.children) {
            filteredItem.children = getVisibleItems(item.children);
            // 如果所有子项都被过滤掉，也隐藏父项
            if (filteredItem.children.length === 0) {
              return acc;
            }
          }
          acc.push(filteredItem);
        }
        return acc;
      }, [] as NavigationItem[]);
    };
  }, [hasAnyRole]);
  
  return { getVisibleItems };
};
```

### Performance Optimization
```typescript
// 菜单渲染性能优化
const NavigationMemo = React.memo<NavigationItemProps>(
  ({ item, isActive }) => {
    // Component implementation
  },
  (prevProps, nextProps) => {
    return (
      prevProps.item.id === nextProps.item.id &&
      prevProps.isActive === nextProps.isActive
    );
  }
);

// 权限变化时避免不必要的重渲染
const useStableNavigationItems = (items: NavigationItem[]) => {
  const { hasAnyRole } = useUserRole();
  
  return useMemo(() => {
    return filterNavigationItems(items, hasAnyRole);
  }, [items, hasAnyRole]);
};
```

## Integration Verification

### IV1: 菜单样式一致性验证
**测试场景**:
- 动态菜单与现有设计系统完全一致
- 颜色、字体、间距符合设计规范
- 不同主题模式下正确显示

**验收标准**:
- ✅ 视觉设计100%符合设计系统
- ✅ 暗色/亮色主题适配正确
- ✅ 组件样式与现有UI无差异

### IV2: 菜单动画性能验证
**测试场景**:
- 菜单显示/隐藏动画流畅
- 角色切换时菜单更新平滑
- 移动端抽屉动画性能良好

**验收标准**:
- ✅ 动画帧率稳定在60fps
- ✅ 菜单切换延迟<200ms
- ✅ 无明显的动画卡顿或闪烁

### IV3: 多设备兼容性验证  
**测试场景**:
- 桌面端、平板、手机正确显示
- 触摸设备交互体验良好
- 不同分辨率下布局正确

**验收标准**:
- ✅ 所有目标设备正确显示
- ✅ 触摸点击区域≥44px
- ✅ 响应式布局无破坏

## Implementation Tasks

### Core Navigation Components
- [ ] 实现动态NavigationItem组件
- [ ] 创建权限过滤逻辑
- [ ] 开发UserAvatar角色显示
- [ ] 集成现有Sidebar组件

### Animation & UX
- [ ] 实现菜单显示/隐藏动画
- [ ] 创建响应式导航交互
- [ ] 优化触摸设备体验
- [ ] 添加键盘导航支持

### Internationalization
- [ ] 添加导航文本翻译
- [ ] 实现角色描述国际化
- [ ] 配置RTL语言支持预留
- [ ] 测试多语言切换

### Testing & Integration  
- [ ] 单元测试：组件渲染和权限过滤
- [ ] 视觉回归测试：设计一致性
- [ ] 响应式测试：多设备兼容性
- [ ] 性能测试：动画和渲染性能

## Definition of Done

### Functionality
- ✅ 基于角色的菜单过滤100%正确
- ✅ 角色标识显示准确
- ✅ 多设备响应式适配完善
- ✅ 国际化支持完整

### User Experience
- ✅ 菜单动画流畅自然
- ✅ 交互反馈及时准确
- ✅ 触摸设备体验良好
- ✅ 无障碍访问支持

### Performance
- ✅ 菜单渲染无性能问题
- ✅ 权限检查高效缓存
- ✅ 动画性能≥60fps
- ✅ 组件渲染优化完成

### Code Quality
- ✅ 组件设计模块化
- ✅ TypeScript类型完整
- ✅ 测试覆盖率>85%
- ✅ 代码review通过

## Risks & Mitigation

### User Experience Risks
**Risk**: 菜单频繁变化导致用户困惑
- *Probability*: Low
- *Impact*: Medium
- *Mitigation*: 平滑的过渡动画 + 用户角色说明

**Risk**: 角色标识不够明显
- *Probability*: Medium
- *Impact*: Low  
- *Mitigation*: 用户测试验证 + 设计优化

### Technical Risks
**Risk**: 动态菜单渲染性能问题
- *Probability*: Low
- *Impact*: Medium
- *Mitigation*: React.memo + 权限缓存 + 性能监控

### Integration Risks
**Risk**: 与现有导航组件冲突
- *Probability*: Low  
- *Impact*: Medium
- *Mitigation*: 渐进式迁移 + 兼容性测试

## Dependencies

### Upstream Dependencies  
- Story 1.3: 前端用户角色状态管理 (必需)
- Story 1.4: 路由权限控制 (可选，增强用户体验)
- 现有Sidebar和导航组件

### Downstream Dependencies
- Story 1.6可能需要导航相关的UX改进
- 用户培训和文档需要导航说明
- 未来的管理员面板需要导航集成

---

**Story Status**: Ready (等待Story 1.3完成)  
**Assignee**: Frontend Development Team  
**Reviewer**: UX Designer + Frontend Lead  
**Created**: 2025-09-02  
**Last Updated**: 2025-09-02