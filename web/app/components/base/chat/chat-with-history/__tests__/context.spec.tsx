import React from 'react'
import { renderHook } from '@testing-library/react'
import '@testing-library/jest-dom'
import { ChatWithHistoryContext, useChatWithHistoryContext } from '../context'
import type { ChatWithHistoryContextValue } from '../context'

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
  ...overrides,
})

describe('ChatWithHistoryContext', () => {
  it('should provide default context values including fullscreen mode', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <ChatWithHistoryContext.Provider value={createMockContextValue()}>
        {children}
      </ChatWithHistoryContext.Provider>
    )

    const { result } = renderHook(() => useChatWithHistoryContext(), { wrapper })

    expect(result.current.isFullScreenMode).toBe(false)
    expect(result.current.setIsFullScreenMode).toBeDefined()
    expect(typeof result.current.setIsFullScreenMode).toBe('function')
  })

  it('should provide fullscreen mode state when set to true', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <ChatWithHistoryContext.Provider value={createMockContextValue({ isFullScreenMode: true })}>
        {children}
      </ChatWithHistoryContext.Provider>
    )

    const { result } = renderHook(() => useChatWithHistoryContext(), { wrapper })

    expect(result.current.isFullScreenMode).toBe(true)
  })

  it('should provide setIsFullScreenMode function that can be called', () => {
    const mockSetIsFullScreenMode = jest.fn()
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <ChatWithHistoryContext.Provider
        value={createMockContextValue({
          isFullScreenMode: false,
          setIsFullScreenMode: mockSetIsFullScreenMode,
        })}
      >
        {children}
      </ChatWithHistoryContext.Provider>
    )

    const { result } = renderHook(() => useChatWithHistoryContext(), { wrapper })

    // Call the setIsFullScreenMode function
    result.current.setIsFullScreenMode(true)

    expect(mockSetIsFullScreenMode).toHaveBeenCalledWith(true)
  })

  it('should maintain all existing context properties with fullscreen mode addition', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <ChatWithHistoryContext.Provider value={createMockContextValue()}>
        {children}
      </ChatWithHistoryContext.Provider>
    )

    const { result } = renderHook(() => useChatWithHistoryContext(), { wrapper })

    // Check that all essential properties are still present
    expect(result.current.currentConversationId).toBeDefined()
    expect(result.current.handleNewConversation).toBeDefined()
    expect(result.current.sidebarCollapseState).toBeDefined()
    expect(result.current.isFullScreenMode).toBeDefined()
    expect(result.current.setIsFullScreenMode).toBeDefined()
  })
})
