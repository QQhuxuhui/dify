# User Interface Enhancement Goals

## Integration with Existing UI

新的全屏布局将复用现有的聊天组件和样式系统，主要通过调整布局结构和添加状态控制来实现。继续使用Tailwind CSS类名和现有的主题色彩方案，确保视觉一致性。

## Modified/New Screens and Views

**修改的界面**:
- 探索页面聊天界面 (`/explore/installed/[appId]`) - 新增全屏模式
- ChatWithHistory组件 - 支持全屏/常规两种布局模式
- 聊天头部区域 - 新增Logo和名称显示

**新增的UI元素**:
- 左上角菜单切换按钮
- 覆盖式侧边菜单面板
- 居中的对话Logo和名称展示区域

## UI Consistency Requirements

- 菜单按钮使用现有的图标库和按钮样式
- 侧边菜单保持原有的组件结构和交互逻辑
- 聊天区域保持现有的消息样式和输入框设计
- 动画效果使用一致的缓动函数和时长标准
