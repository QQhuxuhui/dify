# Epic 1: 探索页面聊天界面全屏模式

**Epic Goal**: 为从探索页面进入的对话助手提供沉浸式全屏聊天体验，类似DeepSeek的简洁布局设计

**Integration Requirements**: 保持所有现有功能完全可用，通过非侵入式的界面增强来实现新的用户体验

## Story 1.1 实现全屏布局模式切换基础架构

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

## Story 1.2 添加菜单切换按钮和覆盖式侧边栏

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

## Story 1.3 实现聊天窗口居中布局

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

## Story 1.4 添加对话Logo和名称显示

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

## Story 1.5 自定义输入框占位符和样式优化

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