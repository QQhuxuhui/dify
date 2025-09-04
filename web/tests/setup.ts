/**
 * Jest Test Setup Configuration
 * 
 * Global test setup for Story 1.3 permission system tests.
 */

import '@testing-library/jest-dom'

// Mock Next.js modules
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(() => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
  })),
  usePathname: jest.fn(() => '/test'),
  useSearchParams: jest.fn(() => new URLSearchParams()),
  useParams: jest.fn(() => ({})),
}))

// Mock window.localStorage
const localStorageMock = {
  getItem: jest.fn((key: string) => {
    const item = (global as any).__localStorage__[key]
    return item ? item : null
  }),
  setItem: jest.fn((key: string, value: string) => {
    ;(global as any).__localStorage__[key] = value
  }),
  removeItem: jest.fn((key: string) => {
    delete (global as any).__localStorage__[key]
  }),
  clear: jest.fn(() => {
    ;(global as any).__localStorage__ = {}
  }),
  length: 0,
  key: jest.fn(() => null),
}

// Initialize localStorage mock
;(global as any).__localStorage__ = {}
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
  writable: true,
})

// Mock window.addEventListener for storage events
const eventListeners: Record<string, Function[]> = {}
window.addEventListener = jest.fn((event: string, callback: Function) => {
  if (!eventListeners[event]) {
    eventListeners[event] = []
  }
  eventListeners[event].push(callback)
})

window.removeEventListener = jest.fn((event: string, callback: Function) => {
  if (eventListeners[event]) {
    eventListeners[event] = eventListeners[event].filter(cb => cb !== callback)
  }
})

// Helper to trigger storage events
;(global as any).triggerStorageEvent = (key: string, newValue: string | null, oldValue: string | null = null) => {
  const storageEvent = new StorageEvent('storage', {
    key,
    newValue,
    oldValue,
    storageArea: localStorage,
  })
  
  if (eventListeners.storage) {
    eventListeners.storage.forEach(callback => callback(storageEvent))
  }
}

// Mock crypto for encryption tests
Object.defineProperty(global, 'crypto', {
  value: {
    randomUUID: jest.fn(() => 'mock-uuid-1234'),
    subtle: {
      encrypt: jest.fn(),
      decrypt: jest.fn(),
    },
  },
})

// Mock performance API
Object.defineProperty(global, 'performance', {
  value: {
    now: jest.fn(() => Date.now()),
    mark: jest.fn(),
    measure: jest.fn(),
    memory: {
      usedJSHeapSize: 1000000,
      totalJSHeapSize: 2000000,
      jsHeapSizeLimit: 4000000,
    },
  },
})

// Mock console methods to reduce noise during tests
const originalConsoleError = console.error
const originalConsoleWarn = console.warn
const originalConsoleLog = console.log

console.error = (...args) => {
  // Only show errors that aren't expected test errors
  const message = args[0]
  if (
    typeof message === 'string' && 
    !message.includes('Warning: ') &&
    !message.includes('React Router')
  ) {
    originalConsoleError(...args)
  }
}

console.warn = (...args) => {
  // Suppress React warnings during tests
  const message = args[0]
  if (
    typeof message === 'string' && 
    !message.includes('Warning: ') &&
    !message.includes('useLayoutEffect')
  ) {
    originalConsoleWarn(...args)
  }
}

// Global test utilities
;(global as any).createMockUser = (roleType: 'admin' | 'user') => ({
  id: `user-${roleType}-${Date.now()}`,
  email: `${roleType}@test.com`,
  name: `Test ${roleType}`,
  status: 'active',
  created_at: '2024-01-01T00:00:00Z',
  last_active_at: '2024-01-01T12:00:00Z',
  role: {
    id: `role-${roleType}-${Date.now()}`,
    name: roleType,
    description: `Test ${roleType} Role`,
    is_active: true,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
})

// Clean up after each test
afterEach(() => {
  // Clear localStorage
  ;(global as any).__localStorage__ = {}
  
  // Clear all mocks
  jest.clearAllMocks()
  
  // Clear event listeners
  Object.keys(eventListeners).forEach(key => {
    eventListeners[key] = []
  })
})

// Global error handler for tests
window.addEventListener('error', (event) => {
  console.error('Global error in test:', event.error)
})

window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection in test:', event.reason)
})

// Mock fetch for API tests
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({}),
    text: () => Promise.resolve(''),
    headers: new Headers(),
    status: 200,
    statusText: 'OK',
  })
) as jest.Mock

// Test environment information
console.log('🧪 Story 1.3 Permission System Test Environment Ready')
console.log(`   - Jest version: ${require('jest/package.json').version}`)
console.log(`   - Testing Library React version: ${require('@testing-library/react/package.json').version}`)
console.log(`   - Node.js version: ${process.version}`)

export {}