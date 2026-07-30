### Manual full session sync from the page

#### Feature/Change Name
Manually synchronize all local Codex sessions when the web page and local session list differ.

#### Prerequisites/Setup
1. Run the dev server with access to a Codex home containing multiple sessions.
2. Have at least one session that is missing or stale in the currently rendered sidebar.
3. Make light and dark themes available.

#### Steps
1. Open the app and locate the refresh icon in the session toolbar.
2. Click the icon and confirm it spins and cannot be clicked again while synchronization is running.
3. Wait for synchronization to finish.
4. Confirm sessions from all available list pages appear in the sidebar.
5. Keep a session open, change that session from another local Codex client, then click sync again.
6. Confirm the open conversation reloads the latest local messages.
7. Repeat the toolbar and loading-state checks in light and dark themes and in a 375px-wide mobile viewport.

#### Expected Results
- Manual sync bypasses the recent thread-list and message caches.
- All paginated local sessions are loaded sequentially into the page.
- The current conversation refreshes without changing the selected route.
- The control provides a disabled spinning state and remains readable in light and dark themes.
- A failed sync leaves the existing list usable and surfaces the existing page error state.

#### Rollback/Cleanup
- No cleanup is required; synchronization only reads local Codex session state.
