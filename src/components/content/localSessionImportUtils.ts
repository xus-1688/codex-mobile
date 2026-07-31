import type { UiThread } from '../../types/codex'

function normalizeThreadIds(threadIds: readonly string[]): Set<string> {
  return new Set(threadIds.map((threadId) => threadId.trim()).filter(Boolean))
}

export function filterUnimportedLocalSessions(
  threads: readonly UiThread[],
  importedThreadIds: readonly string[],
): UiThread[] {
  const importedIds = normalizeThreadIds(importedThreadIds)
  if (importedIds.size === 0) return [...threads]
  return threads.filter((thread) => !importedIds.has(thread.id))
}

export function mergeImportedLocalThreadIds(
  importedThreadIds: readonly string[],
  newThreadIds: readonly string[],
): string[] {
  return Array.from(normalizeThreadIds([...importedThreadIds, ...newThreadIds]))
}
