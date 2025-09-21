# Intro Project Analysis and Context

## Existing Project Overview

**Analysis Source**:
- Document-project output available at: `docs/brownfield-architecture.md`
- IDE-based fresh analysis of chat interface components

**Current Project State**:
Dify是一个开源LLM应用开发平台，采用Next.js React前端 + Python Flask后端的微服务架构。探索页面允许用户浏览和使用其他用户创建的对话助手应用。当前的聊天界面采用传统的左侧边栏布局，包含对话历史和设置功能。

## Available Documentation Analysis

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

## Enhancement Scope Definition

**Enhancement Type**:
- ✅ UI/UX Overhaul (局部界面重构)
- ✅ New Feature Addition (菜单切换功能)

**Enhancement Description**:
为从探索页面进入的对话助手创建全屏沉浸式聊天体验。默认隐藏左侧菜单，聊天窗口居中显示类似DeepSeek的简洁布局，通过左上角按钮可呼出原有菜单功能。

**Impact Assessment**:
- ✅ Moderate Impact (some existing code changes)

## Goals and Background Context

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
