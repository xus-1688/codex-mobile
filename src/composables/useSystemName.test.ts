import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { DEFAULT_SYSTEM_NAME, SYSTEM_NAME_MAX_LENGTH, normalizeSystemName, useSystemName } from './useSystemName'

const SYSTEM_NAME_STORAGE_KEY = 'codex-web-local.system-name.v1'

function createLocalStorage() {
  const values = new Map<string, string>()
  return {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => values.set(key, value),
    removeItem: (key: string) => values.delete(key),
  }
}

describe('useSystemName', () => {
  let localStorage: ReturnType<typeof createLocalStorage>

  beforeEach(() => {
    localStorage = createLocalStorage()
    vi.stubGlobal('window', { localStorage })
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('uses Codex by default and persists a custom system name', () => {
    const state = useSystemName()

    expect(state.systemName.value).toBe(DEFAULT_SYSTEM_NAME)
    state.setSystemName('  Team Console  ')

    expect(state.systemName.value).toBe('Team Console')
    expect(localStorage.getItem(SYSTEM_NAME_STORAGE_KEY)).toBe('Team Console')
  })

  it('clears blank names and restores the default display name', () => {
    const state = useSystemName()
    state.setSystemName('Custom')
    state.setSystemName('   ')

    expect(state.systemName.value).toBe(DEFAULT_SYSTEM_NAME)
    expect(localStorage.getItem(SYSTEM_NAME_STORAGE_KEY)).toBeNull()
  })

  it('limits long names without splitting Unicode code points', () => {
    const longName = `${'x'.repeat(SYSTEM_NAME_MAX_LENGTH)}\u{1F600}extra`
    const normalized = normalizeSystemName(longName)

    expect(Array.from(normalized)).toHaveLength(SYSTEM_NAME_MAX_LENGTH)
    expect(normalized).toBe('x'.repeat(SYSTEM_NAME_MAX_LENGTH))
  })
})
