function focusWithoutScrolling(value: unknown): void {
  if (!value || typeof value !== 'object' || !('focus' in value) || typeof value.focus !== 'function') return

  try {
    value.focus({ preventScroll: true })
  } catch {
    try {
      value.focus()
    } catch {
      // Focus restoration is best-effort in embedded browsers.
    }
  }
}

export function copyTextWithSelectionFallback(text: string): boolean {
  if (typeof document === 'undefined') return false

  const activeElement = document.activeElement
  let selection: Selection | null = null
  const savedRanges: Range[] = []
  try {
    selection = document.getSelection?.() ?? null
    if (selection) {
      for (let index = 0; index < selection.rangeCount; index += 1) {
        savedRanges.push(selection.getRangeAt(index).cloneRange())
      }
    }
  } catch {
    selection = null
  }

  const textarea = document.createElement('textarea')
  textarea.value = text
  textarea.setAttribute('readonly', 'true')
  textarea.setAttribute('aria-hidden', 'true')
  textarea.style.position = 'fixed'
  textarea.style.top = '0'
  textarea.style.left = '0'
  textarea.style.width = '1px'
  textarea.style.height = '1px'
  textarea.style.padding = '0'
  textarea.style.border = '0'
  textarea.style.fontSize = '16px'
  textarea.style.opacity = '0'
  textarea.style.pointerEvents = 'none'
  let didAppendTextarea = false

  try {
    document.body.appendChild(textarea)
    didAppendTextarea = true
    focusWithoutScrolling(textarea)
    textarea.select()
    textarea.setSelectionRange(0, text.length)
    return document.execCommand('copy')
  } catch {
    return false
  } finally {
    if (didAppendTextarea) {
      try {
        document.body.removeChild(textarea)
      } catch {
        // The temporary node may already have been removed by an embedded host.
      }
    }
    try {
      if (selection) {
        selection.removeAllRanges()
        for (const range of savedRanges) {
          selection.addRange(range)
        }
      }
    } catch {
      // Copy success must not be replaced by a stale selection restoration error.
    }
    focusWithoutScrolling(activeElement)
  }
}

export async function copyTextToClipboard(text: string): Promise<void> {
  // Run the selection path before the first await so mobile browsers keep the
  // user activation from the click that initiated the copy.
  if (copyTextWithSelectionFallback(text)) return

  if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text)
    return
  }

  throw new Error('Copy failed')
}
