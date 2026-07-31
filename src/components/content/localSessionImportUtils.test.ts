import { describe, expect, it } from 'vitest'
import type { UiThread } from '../../types/codex'
import { filterUnimportedLocalSessions, mergeImportedLocalThreadIds } from './localSessionImportUtils'

function thread(id: string): UiThread {
  return {
    id,
    title: `Thread ${id}`,
    projectName: 'Project',
    cwd: '/tmp/project',
    hasWorktree: false,
    createdAtIso: '2026-07-31T00:00:00.000Z',
    updatedAtIso: '2026-07-31T00:00:00.000Z',
    preview: '',
    unread: false,
    inProgress: false,
  }
}

describe('filterUnimportedLocalSessions', () => {
  it('removes imported thread ids while preserving candidate order', () => {
    const threads = [thread('thread-a'), thread('thread-b'), thread('thread-c')]

    expect(filterUnimportedLocalSessions(threads, ['thread-b', ' thread-a ', 'thread-b'])).toEqual([
      threads[2],
    ])
    expect(threads.map((row) => row.id)).toEqual(['thread-a', 'thread-b', 'thread-c'])
  })

  it('returns all candidates when no imported ids are stored', () => {
    const threads = [thread('thread-a'), thread('thread-b')]

    expect(filterUnimportedLocalSessions(threads, ['', '   '])).toEqual(threads)
  })
})

describe('mergeImportedLocalThreadIds', () => {
  it('adds newly imported ids without dropping or duplicating existing imports', () => {
    expect(mergeImportedLocalThreadIds(
      ['thread-a', 'thread-b'],
      [' thread-b ', 'thread-c', '', 'thread-c'],
    )).toEqual(['thread-a', 'thread-b', 'thread-c'])
  })
})
