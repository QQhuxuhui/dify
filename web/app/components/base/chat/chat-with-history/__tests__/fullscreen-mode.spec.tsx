import React from 'react'
import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import { ChatWithHistoryContext } from '../context'
import type { ChatWithHistoryContextValue } from '../context'
import ChatWithHistory from '../index'

// Mock the child components
jest.mock('../sidebar', () => {
  return function MockSidebar() {
    return <div data-testid="sidebar">Sidebar</div>
  }
})

jest.mock('../header', () => {
  return function MockHeader() {
    return <div data-testid="header">Header</div>
  }
})

jest.mock('../header-in-mobile', () => {
  return function MockHeaderInMobile() {
    return <div data-testid="header-in-mobile">Header In Mobile</div>
  }
})

jest.mock('../chat-wrapper', () => {
  return function MockChatWrapper() {
    return <div data-testid="chat-wrapper">Chat Wrapper</div>
  }
})

jest.mock('@/hooks/use-breakpoints', () => ({
  __esModule: true,
  default: jest.fn(() => 'desktop'),
  MediaType: {
    mobile: 'mobile',
    tablet: 'tablet',
    desktop: 'desktop',
  },
}))

const createMockContextValue = (overrides: Partial<ChatWithHistoryContextValue> = {}): ChatWithHistoryContextValue => ({
  currentConversationId: '',
  appPrevChatTree: [],
  pinnedConversationList: [],
  conversationList: [],
  newConversationInputs: {},
  newConversationInputsRef: { current: {} },
  handleNewConversationInputsChange: jest.fn(),
  inputsForms: [],
  handleNewConversation: jest.fn(),
  handleStartChat: jest.fn(),
  handleChangeConversation: jest.fn(),
  handlePinConversation: jest.fn(),
  handleUnpinConversation: jest.fn(),
  handleDeleteConversation: jest.fn(),
  conversationRenaming: false,
  handleRenameConversation: jest.fn(),
  handleNewConversationCompleted: jest.fn(),
  chatShouldReloadKey: '',
  isMobile: false,
  isInstalledApp: false,
  handleFeedback: jest.fn(),
  currentChatInstanceRef: { current: { handleStop: jest.fn() } },
  sidebarCollapseState: false,
  handleSidebarCollapse: jest.fn(),
  clearChatList: false,
  setClearChatList: jest.fn(),
  isResponding: false,
  setIsResponding: jest.fn(),
  isFullScreenMode: false,
  setIsFullScreenMode: jest.fn(),
  appInfoLoading: false,
  appChatListDataLoading: false,
  ...overrides,
})

describe('ChatWithHistory Fullscreen Mode', () => {
  it('should render sidebar in normal mode', () => {
    const mockContextValue = createMockContextValue({
      isFullScreenMode: false,
      sidebarCollapseState: false,
    })

    render(
      <ChatWithHistoryContext.Provider value={mockContextValue}>
        <ChatWithHistory />
      </ChatWithHistoryContext.Provider>,
    )

    expect(screen.getByTestId('sidebar')).toBeInTheDocument()
  })

  it('should not render sidebar in fullscreen mode', () => {
    const mockContextValue = createMockContextValue({
      isFullScreenMode: true,
      sidebarCollapseState: false,
    })

    render(
      <ChatWithHistoryContext.Provider value={mockContextValue}>
        <ChatWithHistory />
      </ChatWithHistoryContext.Provider>,
    )

    expect(screen.queryByTestId('sidebar')).not.toBeInTheDocument()
  })

  it('should not render collapsed sidebar panel in fullscreen mode', () => {
    const mockContextValue = createMockContextValue({
      isFullScreenMode: true,
      sidebarCollapseState: true,
    })

    render(
      <ChatWithHistoryContext.Provider value={mockContextValue}>
        <ChatWithHistory />
      </ChatWithHistoryContext.Provider>,
    )

    // In fullscreen mode, even if sidebar is collapsed, the panel should not be rendered
    expect(screen.queryByTestId('sidebar')).not.toBeInTheDocument()
  })

  it('should render collapsed sidebar panel in normal mode when sidebar is collapsed', () => {
    const mockContextValue = createMockContextValue({
      isFullScreenMode: false,
      sidebarCollapseState: true,
    })

    render(
      <ChatWithHistoryContext.Provider value={mockContextValue}>
        <ChatWithHistory />
      </ChatWithHistoryContext.Provider>,
    )

    // In normal mode with collapsed sidebar, the sidebar should still be present but hidden
    expect(screen.getByTestId('sidebar')).toBeInTheDocument()
  })

  it('should always render chat wrapper regardless of fullscreen mode', () => {
    const normalModeContext = createMockContextValue({
      isFullScreenMode: false,
    })

    const { rerender } = render(
      <ChatWithHistoryContext.Provider value={normalModeContext}>
        <ChatWithHistory />
      </ChatWithHistoryContext.Provider>,
    )

    expect(screen.getByTestId('chat-wrapper')).toBeInTheDocument()

    const fullscreenModeContext = createMockContextValue({
      isFullScreenMode: true,
    })

    rerender(
      <ChatWithHistoryContext.Provider value={fullscreenModeContext}>
        <ChatWithHistory />
      </ChatWithHistoryContext.Provider>,
    )

    expect(screen.getByTestId('chat-wrapper')).toBeInTheDocument()
  })

  it('should always render header in desktop mode regardless of fullscreen mode', () => {
    const normalModeContext = createMockContextValue({
      isFullScreenMode: false,
      isMobile: false,
    })

    const { rerender } = render(
      <ChatWithHistoryContext.Provider value={normalModeContext}>
        <ChatWithHistory />
      </ChatWithHistoryContext.Provider>,
    )

    expect(screen.getByTestId('header')).toBeInTheDocument()

    const fullscreenModeContext = createMockContextValue({
      isFullScreenMode: true,
      isMobile: false,
    })

    rerender(
      <ChatWithHistoryContext.Provider value={fullscreenModeContext}>
        <ChatWithHistory />
      </ChatWithHistoryContext.Provider>,
    )

    expect(screen.getByTestId('header')).toBeInTheDocument()
  })

  it('should render mobile header in mobile mode regardless of fullscreen mode', () => {
    const mobileModeContext = createMockContextValue({
      isFullScreenMode: false,
      isMobile: true,
    })

    const { rerender } = render(
      <ChatWithHistoryContext.Provider value={mobileModeContext}>
        <ChatWithHistory />
      </ChatWithHistoryContext.Provider>,
    )

    expect(screen.getByTestId('header-in-mobile')).toBeInTheDocument()
    expect(screen.queryByTestId('header')).not.toBeInTheDocument()

    const mobileFullscreenContext = createMockContextValue({
      isFullScreenMode: true,
      isMobile: true,
    })

    rerender(
      <ChatWithHistoryContext.Provider value={mobileFullscreenContext}>
        <ChatWithHistory />
      </ChatWithHistoryContext.Provider>,
    )

    expect(screen.getByTestId('header-in-mobile')).toBeInTheDocument()
    expect(screen.queryByTestId('header')).not.toBeInTheDocument()
  })
})
