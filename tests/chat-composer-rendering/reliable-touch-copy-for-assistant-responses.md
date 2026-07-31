### Feature: Reliable touch copy for assistant responses

#### Prerequisites
- Start the app from this repository (`pnpm run dev --host 127.0.0.1 --port 4173`).
- Open a thread containing an assistant response with representative ONES information, including an issue key, title, URL, and Markdown table.
- Have a desktop browser and a touch device or touch emulation available.

#### Steps
1. On desktop, hover the assistant response and click `Copy` once.
2. Paste into a plain-text input and compare the full text with the rendered ONES response.
3. Focus the copy button with the keyboard and repeat the copy action.
4. At 375x812 and 768x1024 touch viewports, locate the same response without hovering and click `Copy` once.
5. Paste again and verify the issue key, title, URL, and table rows are present exactly once.
6. Repeat steps 1-5 in both light and dark themes.
7. In browser developer tools, deny Clipboard API permission while leaving legacy selection copy available, then click `Copy` and paste the result.
8. Block both clipboard strategies, click `Copy`, and confirm the button temporarily changes to `Copy failed`; restore clipboard access and click it again.

#### Expected Results
- The copy control is always visible and has a practical touch target on touch devices; desktop hover and keyboard focus also reveal it.
- One click copies the complete response, including ONES identifiers, URLs, and Markdown table source, without duplicating content.
- Copy works when the asynchronous Clipboard API is unavailable or denied but selection copy is allowed.
- Clipboard operations preserve the previously focused control and text selection.
- A successful copy temporarily shows `Copied`; a blocked copy shows `Copy failed` and remains retryable.
- Idle, copied, and failed states remain readable in both light and dark themes.

#### Rollback/Cleanup
- Restore the browser's clipboard permission and any previous theme or viewport settings.
- Restore previous clipboard contents manually if required.
