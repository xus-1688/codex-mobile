### Per-thread full-access permission mode

#### Feature/Change Name
Choose full access for one chat so later turns can run without repeated approval prompts.

#### Prerequisites/Setup
1. Run the dev server with at least two existing threads.
2. Ensure the app can start Codex turns.
3. Make light and dark themes available.

#### Steps
1. Open thread A and select `Full access` from the composer permission menu.
2. Send a prompt that runs a command or edits a file.
3. Confirm the turn proceeds without an approval card.
4. Refresh the page, reopen thread A, and confirm `Full access` remains selected.
5. Open thread B and confirm it still shows `Default permissions`.
6. Start a new chat, select `Full access`, and send its first message.
7. Return to the new-chat page and confirm the next chat starts with `Default permissions`.
8. Repeat the menu and selected-state checks in light and dark themes.

#### Expected Results
- Full access sends `approvalPolicy: never` with the unrestricted Codex sandbox for the selected thread.
- The choice persists across page refreshes for that thread only.
- Other existing threads and later new chats keep their default permission configuration.
- The permission control remains readable and usable in light and dark themes.

#### Rollback/Cleanup
- Select `Default permissions` in test threads to remove their local full-access preference.
