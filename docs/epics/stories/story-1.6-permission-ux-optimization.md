# Story 1.6: 权限验证用户体验优化

## Story Details

**Story ID**: STORY-1.6  
**Epic**: [Epic 001 - 页面级权限控制系统实现](../epic-001-page-level-permission-control.md)  
**Priority**: P1 - High  
**Effort**: 8 Story Points  
**Sprint**: Sprint 3  

## User Story

**As a** 最终用户  
**I want** 在遇到权限限制时获得清晰友好的提示  
**So that** 我能理解访问限制的原因，知道如何继续使用系统  

## Business Context

### Problem Statement
当用户遇到权限限制时，系统需要提供清晰、友好的用户体验，帮助用户理解限制原因并提供合适的后续操作建议。

### Business Value
- 改善用户在权限限制场景下的体验
- 减少用户因权限问题产生的困惑和挫折
- 提供清晰的系统使用指引
- 增强用户对权限系统的理解和接受度

## Acceptance Criteria

### AC1: 友好的权限提示组件
```typescript
// components/base/permission-denied.tsx
interface PermissionDeniedProps {
  requiredRoles: string[];
  currentRole?: string;
  feature?: string;
  showContactSupport?: boolean;
  onGoBack?: () => void;
  onGoToAllowed?: () => void;
}

export const PermissionDenied: React.FC<PermissionDeniedProps> = ({
  requiredRoles,
  currentRole,
  feature,
  showContactSupport = false,
  onGoBack,
  onGoToAllowed
}) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { getDefaultRouteForRole } = useRouteUtils();
  
  const handleGoToAllowed = () => {
    if (onGoToAllowed) {
      onGoToAllowed();
    } else {
      const defaultRoute = getDefaultRouteForRole(currentRole);
      navigate(defaultRoute);
    }
  };
  
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] p-8">
      <div className="text-center max-w-md">
        {/* 友好的图标 */}
        <div className="mb-6">
          <ShieldX className="w-16 h-16 text-yellow-500 mx-auto" />
        </div>
        
        {/* 主标题 */}
        <h2 className="text-2xl font-semibold text-gray-900 mb-3">
          {t('permission.denied.title')}
        </h2>
        
        {/* 详细说明 */}
        <p className="text-gray-600 mb-6 leading-relaxed">
          {feature ? (
            t('permission.denied.feature_message', { feature })
          ) : (
            t('permission.denied.general_message')
          )}
        </p>
        
        {/* 角色信息卡片 */}
        <div className="bg-gray-50 rounded-lg p-4 mb-6 text-sm">
          <div className="flex justify-between items-center mb-2">
            <span className="text-gray-500">{t('permission.current_role')}</span>
            <span className="font-medium text-gray-900">
              {t(`role.${currentRole}`) || t('role.unknown')}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-500">{t('permission.required_role')}</span>
            <span className="font-medium text-gray-900">
              {requiredRoles.map(role => t(`role.${role}`)).join(', ')}
            </span>
          </div>
        </div>
        
        {/* 操作按钮 */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Button 
            onClick={handleGoToAllowed}
            className="flex-1"
          >
            <Home className="w-4 h-4 mr-2" />
            {t('permission.go_to_allowed')}
          </Button>
          
          {onGoBack && (
            <Button 
              variant="outline" 
              onClick={onGoBack}
              className="flex-1"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              {t('permission.go_back')}
            </Button>
          )}
        </div>
        
        {/* 联系支持 */}
        {showContactSupport && (
          <div className="mt-6 pt-4 border-t border-gray-200">
            <p className="text-sm text-gray-500 mb-2">
              {t('permission.need_help')}
            </p>
            <Button variant="link" size="sm">
              <Mail className="w-4 h-4 mr-2" />
              {t('permission.contact_support')}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};
```

**验证标准**:
- ✅ 提供清晰的权限拒绝说明
- ✅ 显示当前用户角色和所需角色
- ✅ 包含友好的图标和视觉元素
- ✅ 提供明确的后续操作建议

### AC2: 实时权限状态提示
```typescript
// components/base/permission-banner.tsx
interface PermissionBannerProps {
  type: 'info' | 'warning' | 'error';
  role: string;
  feature?: string;
  dismissible?: boolean;
}

export const PermissionBanner: React.FC<PermissionBannerProps> = ({
  type,
  role,
  feature,
  dismissible = true
}) => {
  const [isVisible, setIsVisible] = useState(true);
  const { t } = useTranslation();
  
  if (!isVisible) return null;
  
  const getIcon = () => {
    switch (type) {
      case 'info': return <Info className="w-5 h-5" />;
      case 'warning': return <AlertTriangle className="w-5 h-5" />;
      case 'error': return <AlertCircle className="w-5 h-5" />;
    }
  };
  
  const getBgColor = () => {
    switch (type) {
      case 'info': return 'bg-blue-50 border-blue-200 text-blue-800';
      case 'warning': return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      case 'error': return 'bg-red-50 border-red-200 text-red-800';
    }
  };
  
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        className={cn(
          "border rounded-lg p-4 mb-4",
          getBgColor()
        )}
      >
        <div className="flex items-start">
          <div className="flex-shrink-0">
            {getIcon()}
          </div>
          <div className="ml-3 flex-1">
            <p className="text-sm font-medium">
              {feature ? (
                t(`permission.banner.${type}_with_feature`, { 
                  role: t(`role.${role}`),
                  feature 
                })
              ) : (
                t(`permission.banner.${type}`, { role: t(`role.${role}`) })
              )}
            </p>
          </div>
          {dismissible && (
            <button
              onClick={() => setIsVisible(false)}
              className="flex-shrink-0 ml-3"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
```

**验证标准**:
- ✅ 根据场景显示不同类型的提示横幅
- ✅ 支持信息、警告、错误三种状态
- ✅ 包含平滑的显示和消失动画
- ✅ 提供可关闭选项

### AC3: 交互式权限引导
```typescript
// components/base/permission-guide.tsx
interface GuideStep {
  id: string;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface PermissionGuideProps {
  userRole: string;
  onComplete?: () => void;
}

export const PermissionGuide: React.FC<PermissionGuideProps> = ({
  userRole,
  onComplete
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const { t } = useTranslation();
  
  const getStepsForRole = (role: string): GuideStep[] => {
    if (role === 'user') {
      return [
        {
          id: 'welcome',
          title: t('guide.user.welcome.title'),
          description: t('guide.user.welcome.description'),
        },
        {
          id: 'chat_access',
          title: t('guide.user.chat.title'),
          description: t('guide.user.chat.description'),
          action: {
            label: t('guide.user.chat.action'),
            onClick: () => navigate('/chat')
          }
        },
        {
          id: 'knowledge_access',
          title: t('guide.user.knowledge.title'),
          description: t('guide.user.knowledge.description'),
          action: {
            label: t('guide.user.knowledge.action'),
            onClick: () => navigate('/knowledge-base')
          }
        },
        {
          id: 'limitations',
          title: t('guide.user.limitations.title'),
          description: t('guide.user.limitations.description'),
        }
      ];
    }
    
    return []; // 管理员通常不需要引导
  };
  
  const steps = getStepsForRole(userRole);
  const currentStepData = steps[currentStep];
  
  if (steps.length === 0) return null;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg max-w-md w-full mx-4 p-6">
        {/* 进度指示器 */}
        <div className="flex justify-center mb-6">
          <div className="flex space-x-2">
            {steps.map((_, index) => (
              <div
                key={index}
                className={cn(
                  "w-2 h-2 rounded-full",
                  index <= currentStep ? "bg-primary" : "bg-gray-300"
                )}
              />
            ))}
          </div>
        </div>
        
        {/* 步骤内容 */}
        <div className="text-center">
          <h3 className="text-lg font-semibold mb-3">
            {currentStepData.title}
          </h3>
          <p className="text-gray-600 mb-6">
            {currentStepData.description}
          </p>
          
          {/* 操作按钮 */}
          <div className="flex justify-between">
            <Button 
              variant="outline"
              onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
              disabled={currentStep === 0}
            >
              {t('guide.previous')}
            </Button>
            
            {currentStepData.action ? (
              <Button onClick={currentStepData.action.onClick}>
                {currentStepData.action.label}
              </Button>
            ) : (
              <Button
                onClick={() => {
                  if (currentStep === steps.length - 1) {
                    onComplete?.();
                  } else {
                    setCurrentStep(currentStep + 1);
                  }
                }}
              >
                {currentStep === steps.length - 1 ? t('guide.finish') : t('guide.next')}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
```

**验证标准**:
- ✅ 为普通用户提供系统使用引导
- ✅ 解释可用功能和访问限制
- ✅ 包含交互式步骤和进度显示
- ✅ 支持跳过和重新查看

### AC4: 国际化错误消息
```typescript
// locales/permission-messages.ts
export const permissionMessages = {
  'zh-CN': {
    'permission.denied.title': '访问受限',
    'permission.denied.general_message': '很抱歉，您当前的用户角色无权访问此功能。',
    'permission.denied.feature_message': '访问"{feature}"功能需要更高的用户权限。',
    'permission.current_role': '当前角色',
    'permission.required_role': '所需角色',
    'permission.go_to_allowed': '前往可用功能',
    'permission.go_back': '返回上页',
    'permission.need_help': '需要更多权限？',
    'permission.contact_support': '联系系统管理员',
    'permission.banner.info': '您当前以{role}身份登录',
    'permission.banner.warning': '某些功能对{role}用户不可用',
    'permission.banner.error': '权限验证失败，请重新登录',
    'role.admin': '管理员',
    'role.user': '普通用户',
    'role.unknown': '未知角色',
    'guide.user.welcome.title': '欢迎使用Dify',
    'guide.user.welcome.description': '作为普通用户，您可以使用对话和知识库功能。',
    'guide.user.chat.title': 'AI对话功能',
    'guide.user.chat.description': '与AI助手进行智能对话，获得帮助和解答。',
    'guide.user.chat.action': '开始对话',
    'guide.user.knowledge.title': '知识库管理',
    'guide.user.knowledge.description': '上传和管理您的文档，让AI更好地理解您的需求。',
    'guide.user.knowledge.action': '管理知识库',
    'guide.user.limitations.title': '功能说明',
    'guide.user.limitations.description': '系统配置和高级管理功能需要管理员权限。',
    'guide.previous': '上一步',
    'guide.next': '下一步',
    'guide.finish': '完成',
    'guide.skip': '跳过引导'
  },
  'en': {
    'permission.denied.title': 'Access Restricted',
    'permission.denied.general_message': 'Sorry, your current user role does not have permission to access this feature.',
    'permission.denied.feature_message': 'Accessing "{feature}" requires higher user permissions.',
    'permission.current_role': 'Current Role',
    'permission.required_role': 'Required Role',
    'permission.go_to_allowed': 'Go to Available Features',
    'permission.go_back': 'Go Back',
    'permission.need_help': 'Need more permissions?',
    'permission.contact_support': 'Contact Administrator',
    'permission.banner.info': 'You are currently logged in as {role}',
    'permission.banner.warning': 'Some features are not available for {role} users',
    'permission.banner.error': 'Permission verification failed, please login again',
    'role.admin': 'Administrator',
    'role.user': 'User',
    'role.unknown': 'Unknown Role',
    'guide.user.welcome.title': 'Welcome to Dify',
    'guide.user.welcome.description': 'As a regular user, you can use chat and knowledge base features.',
    'guide.user.chat.title': 'AI Chat Feature',
    'guide.user.chat.description': 'Have intelligent conversations with AI assistant for help and answers.',
    'guide.user.chat.action': 'Start Chatting',
    'guide.user.knowledge.title': 'Knowledge Base Management',
    'guide.user.knowledge.description': 'Upload and manage your documents to help AI better understand your needs.',
    'guide.user.knowledge.action': 'Manage Knowledge Base',
    'guide.user.limitations.title': 'Feature Information',
    'guide.user.limitations.description': 'System configuration and advanced management features require administrator permissions.',
    'guide.previous': 'Previous',
    'guide.next': 'Next',
    'guide.finish': 'Finish',
    'guide.skip': 'Skip Guide'
  }
};
```

**验证标准**:
- ✅ 所有权限相关消息支持中英文
- ✅ 错误提示文本清晰友好
- ✅ 用户引导内容完整翻译
- ✅ 角色名称本地化

### AC5: 与现有通知系统集成
```typescript
// hooks/use-permission-notifications.ts
export const usePermissionNotifications = () => {
  const { toast } = useToast();
  const { t } = useTranslation();
  
  const showPermissionDenied = (requiredRoles: string[], feature?: string) => {
    toast({
      variant: 'destructive',
      title: t('permission.denied.title'),
      description: feature 
        ? t('permission.denied.feature_message', { feature })
        : t('permission.denied.general_message'),
      action: (
        <ToastAction altText={t('permission.go_to_allowed')}>
          {t('permission.go_to_allowed')}
        </ToastAction>
      ),
    });
  };
  
  const showRoleChanged = (newRole: string) => {
    toast({
      title: t('permission.role_changed.title'),
      description: t('permission.role_changed.message', { role: t(`role.${newRole}`) }),
    });
  };
  
  const showPermissionRestored = () => {
    toast({
      variant: 'default',
      title: t('permission.restored.title'),
      description: t('permission.restored.message'),
    });
  };
  
  return {
    showPermissionDenied,
    showRoleChanged,
    showPermissionRestored,
  };
};
```

**验证标准**:
- ✅ 与现有Toast通知系统集成
- ✅ 提供一致的通知样式和交互
- ✅ 支持操作按钮和自动消失
- ✅ 权限变更实时通知

## Technical Specifications

### Error Boundary Integration
```typescript
// error-boundaries/permission-error-boundary.tsx
export class PermissionErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  
  static getDerivedStateFromError(error: Error) {
    if (error.name === 'PermissionError') {
      return { hasError: true, error };
    }
    return null;
  }
  
  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    if (error.name === 'PermissionError') {
      console.error('Permission Error:', error, errorInfo);
    }
  }
  
  render() {
    if (this.state.hasError) {
      return (
        <PermissionDenied
          requiredRoles={this.state.error?.requiredRoles || []}
          currentRole={this.state.error?.currentRole}
          feature={this.state.error?.feature}
        />
      );
    }
    
    return this.props.children;
  }
}
```

### Accessibility Support
```typescript
// 无障碍访问增强
const PermissionDeniedA11y: React.FC<PermissionDeniedProps> = (props) => {
  useEffect(() => {
    // 屏幕阅读器公告
    const announcement = document.createElement('div');
    announcement.setAttribute('aria-live', 'polite');
    announcement.setAttribute('aria-atomic', 'true');
    announcement.className = 'sr-only';
    announcement.textContent = t('permission.denied.screen_reader');
    document.body.appendChild(announcement);
    
    // 焦点管理
    const focusElement = document.querySelector('[data-permission-focus]');
    if (focusElement) {
      (focusElement as HTMLElement).focus();
    }
    
    return () => {
      document.body.removeChild(announcement);
    };
  }, []);
  
  return <PermissionDenied {...props} />;
};
```

## Integration Verification

### IV1: 通知系统一致性验证
**测试场景**:
- 权限提示与现有错误处理样式一致
- Toast通知行为符合系统规范
- 错误信息显示时机正确

**验收标准**:
- ✅ 视觉样式100%一致
- ✅ 通知行为符合用户期望
- ✅ 错误处理响应及时(<1秒)

### IV2: 多语言支持验证
**测试场景**:
- 中英文切换时权限提示正确显示
- 所有权限相关文本完整翻译
- 文本长度在不同语言下适配良好

**验收标准**:
- ✅ 多语言文本100%覆盖
- ✅ UI布局在不同语言下正常
- ✅ 语言切换响应及时

### IV3: 无障碍访问验证
**测试场景**:
- 屏幕阅读器正确读取权限信息
- 键盘导航功能完整
- 颜色对比度符合WCAG标准

**验收标准**:
- ✅ 屏幕阅读器兼容性100%
- ✅ 键盘操作无障碍
- ✅ 颜色对比度≥4.5:1

## Implementation Tasks

### Core Components
- [ ] 实现PermissionDenied主组件
- [ ] 创建PermissionBanner提示组件
- [ ] 开发PermissionGuide引导组件
- [ ] 集成现有通知系统

### User Experience
- [ ] 设计友好的错误页面布局
- [ ] 实现平滑的动画效果
- [ ] 创建交互式用户引导
- [ ] 优化移动端体验

### Internationalization
- [ ] 编写完整的多语言文本
- [ ] 实现动态文本替换
- [ ] 测试不同语言下的UI适配
- [ ] 添加RTL语言支持预留

### Integration & Testing
- [ ] 集成权限检查流程
- [ ] 编写组件单元测试
- [ ] 进行用户体验测试
- [ ] 无障碍访问测试

## Definition of Done

### User Experience
- ✅ 权限限制提示清晰友好
- ✅ 用户引导简洁有效
- ✅ 错误恢复路径明确
- ✅ 移动端体验良好

### Functionality
- ✅ 所有权限场景覆盖
- ✅ 多语言支持完整
- ✅ 与现有系统集成良好
- ✅ 无障碍访问支持

### Code Quality
- ✅ 组件设计可复用
- ✅ TypeScript类型完整
- ✅ 测试覆盖率>80%
- ✅ 性能优化合理

## Risks & Mitigation

### User Experience Risks
**Risk**: 错误提示过于频繁影响用户体验
- *Probability*: Medium
- *Impact*: Medium  
- *Mitigation*: 智能提示频率控制 + 用户反馈收集

**Risk**: 多语言文本不够准确或友好
- *Probability*: Low
- *Impact*: Medium
- *Mitigation*: 专业翻译review + 用户测试验证

### Technical Risks
**Risk**: 组件过度复杂影响性能
- *Probability*: Low
- *Impact*: Low
- *Mitigation*: 组件拆分 + 懒加载 + 性能监控

## Dependencies

### Upstream Dependencies
- Story 1.3: 前端用户角色状态管理 (必需)
- Story 1.4: 路由权限控制 (必需)
- 现有通知和错误处理系统

### Downstream Dependencies
- 用户培训和帮助文档
- 客户支持流程优化
- 系统管理员工具集成

---

**Story Status**: Ready (等待Story 1.3和1.4完成)  
**Assignee**: Frontend Development Team  
**Reviewer**: UX Designer + Product Manager  
**Created**: 2025-09-02  
**Last Updated**: 2025-09-02