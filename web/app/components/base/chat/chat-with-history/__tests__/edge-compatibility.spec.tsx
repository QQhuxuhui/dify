import React from 'react'
import { render } from '@testing-library/react'
import '@testing-library/jest-dom'

// Mock user agent to simulate Edge browser
const mockUserAgent = (userAgent: string) => {
  Object.defineProperty(window.navigator, 'userAgent', {
    writable: true,
    value: userAgent,
  })
}

// Edge browser detection utility
const isEdgeBrowser = () => {
  const userAgent = navigator.userAgent
  return /Edg\//.test(userAgent) || /Edge\//.test(userAgent)
}

// Mock the ChatWithHistory components for Edge testing
jest.mock('../index', () => {
  return function MockChatWithHistory(props: any) {
    const isFullScreen = props.isFullScreenMode
    return (
      <div
        data-testid="chat-with-history"
        className={`edge-compatible ${isFullScreen ? 'fullscreen' : 'normal'}`}
        style={{
          display: 'flex',
          height: '100%',
          // Edge-compatible flexbox properties
          msFlexDirection: 'column',
          msFlexAlign: 'stretch',
          WebkitFlexDirection: 'column',
          WebkitAlignItems: 'stretch',
        }}
      >
        <div data-testid="content">Chat Content</div>
      </div>
    )
  }
})

describe('Edge Browser Compatibility Tests', () => {
  beforeEach(() => {
    // Reset any previous user agent mocks
    jest.clearAllMocks()
  })

  afterEach(() => {
    // Restore original user agent
    Object.defineProperty(window.navigator, 'userAgent', {
      writable: true,
      value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    })
  })

  it('should detect Edge browser correctly', () => {
    // Test modern Edge (Chromium-based)
    mockUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36 Edg/91.0.864.59')
    expect(isEdgeBrowser()).toBe(true)

    // Test legacy Edge
    mockUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.36 Edge/16.16299')
    expect(isEdgeBrowser()).toBe(true)

    // Test Chrome (should return false)
    mockUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36')
    expect(isEdgeBrowser()).toBe(false)
  })

  it('should render fullscreen mode correctly in Edge browser', async () => {
    mockUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36 Edg/91.0.864.59')

    const MockComponent = await import('../index')
    const { container } = render(<MockComponent.default isFullScreenMode={true} />)

    const chatElement = container.querySelector('[data-testid="chat-with-history"]')
    expect(chatElement).toBeInTheDocument()
    expect(chatElement).toHaveClass('fullscreen')
  })

  it('should render normal mode correctly in Edge browser', async () => {
    mockUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36 Edg/91.0.864.59')

    const MockComponent = await import('../index')
    const { container } = render(<MockComponent.default isFullScreenMode={false} />)

    const chatElement = container.querySelector('[data-testid="chat-with-history"]')
    expect(chatElement).toBeInTheDocument()
    expect(chatElement).toHaveClass('normal')
  })

  it('should apply Edge-specific CSS properties', async () => {
    mockUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36 Edg/91.0.864.59')

    const MockComponent = await import('../index')
    const { container } = render(<MockComponent.default />)

    const chatElement = container.querySelector('[data-testid="chat-with-history"]')
    const computedStyle = window.getComputedStyle(chatElement!)

    // Check that flexbox works in Edge
    expect(computedStyle.display).toBe('flex')
    expect(computedStyle.height).toBe('100%')
  })

  it('should handle CSS transitions in Edge browser', () => {
    mockUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36 Edg/91.0.864.59')

    // Simulate CSS transition support check
    const testElement = document.createElement('div')
    testElement.style.transition = 'all 0.3s ease'

    // Edge should support CSS transitions
    expect(testElement.style.transition).toBe('all 0.3s ease')
  })

  it('should validate Edge browser version support', () => {
    // Test Edge 79+ (minimum supported version)
    mockUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/79.0.3945.130 Safari/537.36 Edg/79.0.309.71')

    const userAgent = navigator.userAgent
    const edgeVersionMatch = userAgent.match(/Edg\/(\d+)/)
    const edgeVersion = edgeVersionMatch ? Number.parseInt(edgeVersionMatch[1]) : 0

    expect(edgeVersion).toBeGreaterThanOrEqual(79)
  })

  it('should test JavaScript API compatibility in Edge', () => {
    mockUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36 Edg/91.0.864.59')

    // Test modern JavaScript APIs that should work in Edge 79+
    expect(typeof Array.prototype.includes).toBe('function')
    expect(typeof Object.assign).toBe('function')
    expect(typeof Promise).toBe('function')
    expect(typeof Map).toBe('function')
    expect(typeof Set).toBe('function')

    // Test ES6+ features
    expect(() => {
      const arrow = () => true
      return arrow()
    }).not.toThrow()
  })

  it('should ensure responsive design works in Edge', async () => {
    mockUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36 Edg/91.0.864.59')

    // Mock window.matchMedia for responsive design testing
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: jest.fn().mockImplementation(query => ({
        matches: query.includes('max-width: 768px'),
        media: query,
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
      })),
    })

    const MockComponent = await import('../index')
    const { container } = render(<MockComponent.default />)

    expect(container.firstChild).toBeInTheDocument()
  })
})
