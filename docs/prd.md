# Dify Brownfield Enhancement PRD

## Intro Project Analysis and Context

### Existing Project Overview

**Analysis Source**:
- Document-project output available at: `docs/brownfield-architecture.md`
- IDE-based fresh analysis of chat interface components

**Current Project State**:
Dify是一个开源LLM应用开发平台，采用Next.js React前端 + Python Flask后端的微服务架构。探索页面允许用户浏览和使用其他用户创建的对话助手应用。当前的聊天界面采用传统的左侧边栏布局，包含对话历史和设置功能。

### Available Documentation Analysis

**Available Documentation**:
- ✅ Tech Stack Documentation (from document-project)
- ✅ Source Tree/Architecture (from document-project)
- ✅ API Documentation (from document-project)
- ✅ Technical Debt Documentation (from document-project)
- ✅ Chat Interface Components Analysis (from code exploration)

**Key Components Identified**:
- `web/app/components/base/chat/chat-with-history/index.tsx` - 主聊天界面
- `web/app/components/explore/installed-app/index.tsx` - 探索页面应用入口
- `web/app/(commonLayout)/explore/installed/[appId]/page.tsx` - 探索页面路由

### Enhancement Scope Definition

**Enhancement Type**:
- ✅ UI/UX Overhaul (局部界面重构)
- ✅ New Feature Addition (菜单切换功能)

**Enhancement Description**:
为从探索页面进入的对话助手创建全屏沉浸式聊天体验。默认隐藏左侧菜单，聊天窗口居中显示类似DeepSeek的简洁布局，通过左上角按钮可呼出原有菜单功能。

**Impact Assessment**:
- ✅ Moderate Impact (some existing code changes)

### Goals and Background Context

**Goals**:
- 提供更沉浸式的聊天体验，减少界面干扰元素
- 增加屏幕利用率，创造更聚焦的对话环境
- 保持所有现有功能可访问性（通过按钮呼出菜单）
- 提升对话应用的品牌展示效果（Logo和名称显示）
- 提供类似DeepSeek的现代化聊天界面体验

**Background Context**:
当前聊天界面采用传统的左侧菜单固定布局，在探索页面使用他人创建的对话助手时，用户更专注于对话本身而非管理功能。参考DeepSeek等现代AI聊天产品的设计理念，简洁居中的布局能提供更好的用户体验。此增强仅针对从探索页面进入的场景，不影响用户自己的应用管理界面。

**Change Log**:
| Change | Date | Version | Description | Author |
|--------|------|---------|-------------|--------|
| Initial | 2025-09-21 | 1.0 | 探索页面聊天界面全屏模式增强 | BMad Master |

## Requirements

### Functional Requirements

**FR1**: 从探索页面进入对话助手时，聊天界面默认为全屏模式，左侧菜单完全隐藏
**FR2**: 在聊天界面左上角添加菜单切换按钮，点击可呼出/隐藏左侧菜单
**FR3**: 全屏模式下，聊天窗口水平居中显示，垂直位置略低于页面中心
**FR4**: 在聊天窗口上方显示对话应用的Logo和名称
**FR5**: 聊天输入框占位符文本显示为"给 DeepSeek 发送消息"
**FR6**: 菜单呼出时覆盖在聊天内容上方，不推动布局
**FR7**: 点击菜单外区域或再次点击按钮时自动隐藏菜单
**FR8**: 保留所有现有的对话历史、设置等功能访问能力

### Non Functional Requirements

**NFR1**: 界面切换动画流畅，菜单显示/隐藏转场时间不超过300ms
**NFR2**: 全屏布局在1920x1080分辨率下聊天窗口最大宽度不超过800px
**NFR3**: 增强功能不影响现有聊天界面的加载性能
**NFR4**: 保持与现有组件库和设计系统的一致性
**NFR5**: 代码修改集中在聊天相关组件，不影响其他业务模块

### Compatibility Requirements

**CR1**: 现有API兼容性 - 不修改任何后端API接口，仅前端界面调整
**CR2**: 组件兼容性 - 保持现有ChatWithHistory组件的Props接口不变
**CR3**: 路由兼容性 - 保持现有探索页面路由结构不变
**CR4**: 功能兼容性 - 所有现有聊天功能（历史记录、设置、文件上传等）完全保留

## User Interface Enhancement Goals

### Integration with Existing UI

新的全屏布局将复用现有的聊天组件和样式系统，主要通过调整布局结构和添加状态控制来实现。继续使用Tailwind CSS类名和现有的主题色彩方案，确保视觉一致性。

### Modified/New Screens and Views

**修改的界面**:
- 探索页面聊天界面 (`/explore/installed/[appId]`) - 新增全屏模式
- ChatWithHistory组件 - 支持全屏/常规两种布局模式
- 聊天头部区域 - 新增Logo和名称显示

**新增的UI元素**:
- 左上角菜单切换按钮
- 覆盖式侧边菜单面板
- 居中的对话Logo和名称展示区域

### UI Consistency Requirements

- 菜单按钮使用现有的图标库和按钮样式
- 侧边菜单保持原有的组件结构和交互逻辑
- 聊天区域保持现有的消息样式和输入框设计
- 动画效果使用一致的缓动函数和时长标准

## Technical Constraints and Integration Requirements

### Existing Technology Stack

**Languages**: TypeScript, JavaScript
**Frameworks**: Next.js 14.x (App Router), React 18.x
**UI Library**: Tailwind CSS, 自定义组件库
**State Management**: React Context + Custom Hooks
**Build System**: Next.js 内置构建系统

### Integration Approach

**Frontend Integration Strategy**:
- 在ChatWithHistory组件中添加布局模式状态管理
- 通过Context传递全屏模式标识
- 使用CSS Module或Tailwind条件类名控制布局切换

**Component Integration Strategy**:
- 扩展现有的useChatWithHistoryContext Hook
- 在installedApp组件中检测来源并传递全屏模式参数
- 复用现有的Sidebar组件，添加覆盖模式支持

**Styling Integration Strategy**:
- 使用Tailwind CSS的响应式和状态类名
- 保持现有的CSS类名结构，避免破坏性变更
- 添加新的布局相关CSS类，使用BEM命名约定

### Code Organization and Standards

**File Structure Approach**:
在现有聊天组件目录结构内添加新功能，不创建新的顶级目录

**Modified Files**:
- `web/app/components/explore/installed-app/index.tsx` - 传递全屏模式参数
- `web/app/components/base/chat/chat-with-history/index.tsx` - 主布局逻辑修改
- `web/app/components/base/chat/chat-with-history/header.tsx` - 添加Logo显示
- `web/app/components/base/chat/chat-with-history/sidebar.tsx` - 支持覆盖模式

**Naming Conventions**:
遵循现有的camelCase变量命名和kebab-case CSS类名约定

### Deployment and Operations

**Build Process Integration**: 无需修改现有构建流程，纯前端功能增强
**Configuration Management**: 可通过环境变量控制功能开关（可选）
**Monitoring and Logging**: 复用现有的前端错误监控和用户行为分析

### Risk Assessment and Mitigation

**Technical Risks**:
- 布局修改可能影响现有CSS样式的层叠关系
- 状态管理复杂化可能导致组件渲染性能问题

**Integration Risks**:
- 新增的Context状态可能与现有状态管理产生冲突
- 组件Props接口变更可能影响其他调用方

**Mitigation Strategies**:
- 使用渐进式开发，先实现基础布局再添加交互功能
- 充分的单元测试覆盖状态变更逻辑
- 在开发环境中进行全面的回归测试

## Epic and Story Structure

### Epic Approach

**Epic Structure Decision**: 单一综合性Epic，因为所有功能变更都紧密相关且服务于同一个用户体验目标。这些修改需要协调进行以确保一致的用户体验。

## Epic 1: 探索页面聊天界面全屏模式

**Epic Goal**: 为从探索页面进入的对话助手提供沉浸式全屏聊天体验，类似DeepSeek的简洁布局设计

**Integration Requirements**: 保持所有现有功能完全可用，通过非侵入式的界面增强来实现新的用户体验

### Story 1.1 实现全屏布局模式切换基础架构

As a 开发者,
I want 建立全屏模式的状态管理和布局控制基础,
so that 后续功能可以基于稳定的架构进行开发.

**Acceptance Criteria**:
1. 在ChatWithHistoryContext中添加isFullScreenMode状态
2. 修改ChatWithHistory组件支持全屏/常规两种布局模式
3. 在探索页面入口传递全屏模式参数
4. 全屏模式下左侧边栏完全隐藏

**Integration Verification**:
- IV1: 现有聊天功能在常规模式下保持完全正常
- IV2: 组件Props接口保持向后兼容
- IV3: 布局切换不影响聊天消息的显示和滚动

### Story 1.2 添加菜单切换按钮和覆盖式侧边栏

As a 用户,
I want 在全屏模式下通过左上角按钮访问侧边菜单,
so that 我可以在需要时访问历史记录和设置功能.

**Acceptance Criteria**:
1. 在全屏模式下聊天界面左上角显示菜单切换按钮
2. 点击按钮时侧边栏以覆盖模式显示在内容上方
3. 点击菜单外区域或再次点击按钮时菜单自动隐藏
4. 菜单显示/隐藏有流畅的动画效果(≤300ms)

**Integration Verification**:
- IV1: 覆盖模式的侧边栏保持所有原有功能正常
- IV2: 菜单切换不影响正在进行的对话
- IV3: 动画性能在低端设备上也保持流畅

### Story 1.3 实现聊天窗口居中布局

As a 用户,
I want 聊天窗口在全屏模式下居中显示,
so that 我可以获得更专注和美观的对话体验.

**Acceptance Criteria**:
1. 全屏模式下聊天窗口水平居中显示
2. 聊天窗口垂直位置略低于页面中心(约60%位置)
3. 大屏幕下聊天窗口最大宽度限制为800px
4. 保持原有的圆角和阴影样式

**Integration Verification**:
- IV1: 消息列表滚动行为保持正常
- IV2: 输入框位置和功能不受影响
- IV3: 文件上传等交互功能正常显示

### Story 1.4 添加对话Logo和名称显示

As a 用户,
I want 在聊天窗口上方看到对话应用的Logo和名称,
so that 我可以清楚知道正在与哪个助手对话.

**Acceptance Criteria**:
1. 在居中聊天窗口上方显示对话应用的Logo
2. Logo下方显示对话应用的名称
3. Logo和名称也采用居中对齐
4. 样式与整体设计保持一致

**Integration Verification**:
- IV1: Logo加载失败时有合适的fallback显示
- IV2: 长名称时有适当的截断处理
- IV3: 不影响聊天区域的可用空间

### Story 1.5 自定义输入框占位符和样式优化

As a 用户,
I want 输入框显示自定义的提示文本,
so that 界面更加个性化和友好.

**Acceptance Criteria**:
1. 输入框占位符文本显示为"给 DeepSeek 发送消息"
2. 保持输入框的所有现有功能(文件上传、表情等)
3. 输入框样式与新的居中布局协调
4. 多行输入时的自动调整功能正常

**Integration Verification**:
- IV1: 所有输入相关功能保持完全正常
- IV2: 快捷键和键盘导航功能不受影响
- IV3: 输入验证和错误提示正常显示