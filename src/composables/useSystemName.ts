import { computed, ref } from 'vue'

export const DEFAULT_SYSTEM_NAME = 'Codex'
export const SYSTEM_NAME_MAX_LENGTH = 32

const SYSTEM_NAME_STORAGE_KEY = 'codex-web-local.system-name.v1'

function limitSystemName(value: string): string {
  return Array.from(value).slice(0, SYSTEM_NAME_MAX_LENGTH).join('')
}

export function normalizeSystemName(value: string): string {
  return limitSystemName(value.trim())
}

function loadSystemName(): string {
  if (typeof window === 'undefined') return ''
  try {
    return normalizeSystemName(window.localStorage.getItem(SYSTEM_NAME_STORAGE_KEY) ?? '')
  } catch {
    return ''
  }
}

export function useSystemName() {
  const systemNameDraft = ref(loadSystemName())
  const systemName = computed(() => normalizeSystemName(systemNameDraft.value) || DEFAULT_SYSTEM_NAME)

  function setSystemName(value: string): void {
    systemNameDraft.value = limitSystemName(value)
    if (typeof window === 'undefined') return

    const normalized = normalizeSystemName(value)
    try {
      if (normalized) {
        window.localStorage.setItem(SYSTEM_NAME_STORAGE_KEY, normalized)
      } else {
        window.localStorage.removeItem(SYSTEM_NAME_STORAGE_KEY)
      }
    } catch {
      // Keep the in-memory preference usable when browser storage is unavailable.
    }
  }

  return {
    systemName,
    systemNameDraft,
    setSystemName,
  }
}
