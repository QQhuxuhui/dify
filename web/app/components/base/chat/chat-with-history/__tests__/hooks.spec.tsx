import { renderHook } from '@testing-library/react'
import '@testing-library/jest-dom'
import { useChatWithHistory } from '../hooks'

// Mock the external dependencies
jest.mock('swr', () => ({
  __esModule: true,
  default: jest.fn(() => ({
    data: null,
    isLoading: false,
    error: null,
  })),
}))

jest.mock('ahooks', () => ({
  useAsyncEffect: jest.fn(),
  useLocalStorageState: jest.fn(() => [{}, jest.fn()]),
}))

jest.mock('react-i18next', () => ({
  useTranslation: jest.fn(() => ({
    t: (key: string) => key,
  })),
}))

jest.mock('@/hooks/use-app-favicon', () => ({
  useAppFavicon: jest.fn(),
}))

jest.mock('@/app/components/base/toast', () => ({
  useToastContext: jest.fn(() => ({
    notify: jest.fn(),
  })),
}))

jest.mock('@/i18n/i18next-config', () => ({
  changeLanguage: jest.fn(),
}))

// Mock service functions
jest.mock('@/service/share', () => ({
  fetchAppInfo: jest.fn(),
  fetchAppMeta: jest.fn(),
  fetchAppParams: jest.fn(),
  fetchChatList: jest.fn(),
  fetchConversations: jest.fn(),
  generationConversationName: jest.fn(),
  pinConversation: jest.fn(),
  renameConversation: jest.fn(),
  unpinConversation: jest.fn(),
  delConversation: jest.fn(),
  updateFeedback: jest.fn(),
}))

describe('useChatWithHistory with fullscreen mode', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should initialize with default fullscreen mode as false', () => {
    const { result } = renderHook(() => useChatWithHistory())

    expect(result.current.isFullScreenMode).toBe(false)
    expect(result.current.setIsFullScreenMode).toBeDefined()
    expect(typeof result.current.setIsFullScreenMode).toBe('function')
  })

  it('should initialize with provided fullscreen mode value', () => {
    const { result } = renderHook(() => useChatWithHistory(undefined, true))

    expect(result.current.isFullScreenMode).toBe(true)
  })

  it('should initialize fullscreen mode as false when initialFullScreenMode is explicitly false', () => {
    const { result } = renderHook(() => useChatWithHistory(undefined, false))

    expect(result.current.isFullScreenMode).toBe(false)
  })

  it('should include fullscreen mode state in returned object', () => {
    const { result } = renderHook(() => useChatWithHistory())

    const returnedKeys = Object.keys(result.current)
    expect(returnedKeys).toContain('isFullScreenMode')
    expect(returnedKeys).toContain('setIsFullScreenMode')
  })

  it('should maintain all existing hook functionality with fullscreen mode addition', () => {
    const { result } = renderHook(() => useChatWithHistory())

    // Check that all essential properties are still present
    expect(result.current.currentConversationId).toBeDefined()
    expect(result.current.handleNewConversation).toBeDefined()
    expect(result.current.handleStartChat).toBeDefined()
    expect(result.current.handleChangeConversation).toBeDefined()
    expect(result.current.sidebarCollapseState).toBeDefined()
    expect(result.current.handleSidebarCollapse).toBeDefined()
    expect(result.current.isFullScreenMode).toBeDefined()
    expect(result.current.setIsFullScreenMode).toBeDefined()
  })

  it('should work with installed app info and fullscreen mode', () => {
    const mockInstalledApp = {
      id: 'test-app',
      app: {
        name: 'Test App',
        icon_type: 'emoji',
        icon: '🤖',
        icon_background: '#000000',
        icon_url: null,
        use_icon_as_answer_icon: false,
      },
    }

    const { result } = renderHook(() => useChatWithHistory(mockInstalledApp, true))

    expect(result.current.isInstalledApp).toBe(true)
    expect(result.current.isFullScreenMode).toBe(true)
  })
})
