import { afterEach, describe, expect, it, vi } from 'vitest'
import { copyTextToClipboard, copyTextWithSelectionFallback } from './clipboard'

function installDocumentFallback(copyResult: boolean) {
  const savedRange = { id: 'saved-range' } as unknown as Range
  const currentRange = {
    cloneRange: vi.fn(() => savedRange),
  } as unknown as Range
  const selection = {
    rangeCount: 1,
    getRangeAt: vi.fn(() => currentRange),
    removeAllRanges: vi.fn(),
    addRange: vi.fn(),
  }
  const activeElement = {
    focus: vi.fn(),
  }
  const textarea = {
    value: '',
    style: {} as Record<string, string>,
    setAttribute: vi.fn(),
    focus: vi.fn(),
    select: vi.fn(),
    setSelectionRange: vi.fn(),
  }
  const body = {
    appendChild: vi.fn(),
    removeChild: vi.fn(),
  }
  const execCommand = vi.fn(() => copyResult)

  vi.stubGlobal('document', {
    activeElement,
    body,
    createElement: vi.fn(() => textarea),
    execCommand,
    getSelection: vi.fn(() => selection),
  })

  return {
    activeElement,
    body,
    execCommand,
    savedRange,
    selection,
    textarea,
  }
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('copyTextWithSelectionFallback', () => {
  it('copies synchronously and restores the previous focus and selection', () => {
    const dom = installDocumentFallback(true)

    expect(copyTextWithSelectionFallback('ONES-123 information')).toBe(true)
    expect(dom.execCommand).toHaveBeenCalledWith('copy')
    expect(dom.textarea.value).toBe('ONES-123 information')
    expect(dom.textarea.focus).toHaveBeenCalledWith({ preventScroll: true })
    expect(dom.textarea.select).toHaveBeenCalledOnce()
    expect(dom.textarea.setSelectionRange).toHaveBeenCalledWith(0, 20)
    expect(dom.body.removeChild).toHaveBeenCalledWith(dom.textarea)
    expect(dom.selection.removeAllRanges).toHaveBeenCalledOnce()
    expect(dom.selection.addRange).toHaveBeenCalledWith(dom.savedRange)
    expect(dom.activeElement.focus).toHaveBeenCalledWith({ preventScroll: true })
  })

  it('keeps a successful copy result when focus and selection restoration fail', () => {
    const dom = installDocumentFallback(true)
    dom.selection.addRange.mockImplementation(() => {
      throw new Error('stale range')
    })
    dom.activeElement.focus.mockImplementation(() => {
      throw new Error('focus options unsupported')
    })

    expect(copyTextWithSelectionFallback('ONES-321 information')).toBe(true)
    expect(dom.body.removeChild).toHaveBeenCalledWith(dom.textarea)
  })

  it('retries focus without options for older WebViews', () => {
    const dom = installDocumentFallback(true)
    dom.textarea.focus
      .mockImplementationOnce(() => {
        throw new Error('focus options unsupported')
      })
      .mockImplementationOnce(() => undefined)

    expect(copyTextWithSelectionFallback('ONES-654 information')).toBe(true)
    expect(dom.textarea.focus).toHaveBeenNthCalledWith(1, { preventScroll: true })
    expect(dom.textarea.focus).toHaveBeenNthCalledWith(2)
    expect(dom.execCommand).toHaveBeenCalledWith('copy')
  })
})

describe('copyTextToClipboard', () => {
  it('uses the synchronous fallback before an asynchronous clipboard write', async () => {
    const dom = installDocumentFallback(true)
    const writeText = vi.fn(async () => undefined)
    vi.stubGlobal('navigator', { clipboard: { writeText } })

    await copyTextToClipboard('ONES-456 information')

    expect(dom.execCommand).toHaveBeenCalledOnce()
    expect(writeText).not.toHaveBeenCalled()
  })

  it('uses the Clipboard API when the synchronous fallback is unavailable', async () => {
    installDocumentFallback(false)
    const writeText = vi.fn(async () => undefined)
    vi.stubGlobal('navigator', { clipboard: { writeText } })

    await copyTextToClipboard('ONES-789 information')

    expect(writeText).toHaveBeenCalledWith('ONES-789 information')
  })

  it('rejects when neither copy strategy succeeds', async () => {
    installDocumentFallback(false)
    const clipboardError = new Error('permission denied')
    vi.stubGlobal('navigator', {
      clipboard: {
        writeText: vi.fn(async () => Promise.reject(clipboardError)),
      },
    })

    await expect(copyTextToClipboard('ONES-000 information')).rejects.toBe(clipboardError)
  })
})
