### Mobile sidebar controls and custom system name

#### Prerequisites / setup

- Run the app with at least one thread available in the sidebar.
- Use a mobile viewport at `375x812` and a tablet viewport at `768x1024`.
- Start with the `codex-web-local.system-name.v1` and `codex-web-local.mobile-sidebar-collapsed.v1` local-storage entries removed.

#### Actions

1. Load the app at the mobile viewport and confirm the sidebar opens without first pressing the expand button.
2. Close the sidebar with the backdrop, refresh, and confirm the manual closed preference is respected; manually reopen it for the remaining checks.
3. Inspect the collapse, search, local-session import, and new-thread controls in light theme.
4. Confirm every mobile toolbar control has a `44x44` CSS-pixel hit area and that the row does not overflow the drawer.
5. Open Settings, enter `Team Console` in **System name**, and close Settings.
6. Confirm `Team Console` appears at the right of the sidebar toolbar and in the browser tab when no thread title is active.
7. Refresh the page and confirm both the open sidebar preference and custom name persist.
8. Switch to dark theme and repeat the toolbar and settings-field checks at both viewports.
9. Enter a long system name and confirm it truncates visually without moving or shrinking the toolbar buttons.
10. Clear the System name field.

#### Expected results

- Mobile toolbar buttons remain stable at `44x44` with legible `20x20` icons; desktop buttons use a compact `36x36` size.
- A mobile viewport with no saved sidebar preference starts with the drawer open; explicit close/open choices persist independently from the desktop sidebar.
- The custom name persists across refresh and remains readable in light and dark themes.
- Long names use the available toolbar space and truncate with an ellipsis instead of overflowing.
- Clearing the field removes the stored preference and restores `Codex`.
- Changing the name performs no API requests and does not refresh the thread list.

#### Rollback / cleanup

- Clear the System name field, then remove `codex-web-local.system-name.v1` and `codex-web-local.mobile-sidebar-collapsed.v1` from local storage.
