### Local session import picker

#### Feature/Change Name
Load sessions stored on the computer running codex-mobile, then choose which sessions appear in the browser.

#### Prerequisites/Setup
1. Run codex-mobile with a `CODEX_HOME` containing multiple session JSONL files.
2. Configure at least one remote workspace, such as an SSH workspace, so unrelated local sessions are initially filtered from the sidebar.
3. Make light and dark themes available.

#### Steps
1. Open the app and click the local-session import icon in the session toolbar.
2. Confirm the dialog loads sessions from the codex-mobile host rather than presenting remote workspace placeholders as sessions.
3. Search by session title, project name, and local cwd.
4. Select one or more sessions and confirm the import.
5. Confirm only the selected local sessions are added to the sidebar; existing remote workspace entries remain unchanged.
6. Reopen the dialog and confirm the imported sessions remain selected.
7. Clear a previous selection, confirm again, and verify that session is removed from the imported sidebar set without deleting its JSONL file.
8. Repeat the dialog checks in light and dark themes and in 375x812 and 768x1024 viewports.

#### Expected Results
- Loading candidates does not change the visible thread list before confirmation.
- Every `thread/list` page is fetched sequentially from the codex-mobile host.
- Search and selection operate over the complete loaded candidate set while the DOM renders results in bounded batches.
- Confirming persists the exact imported thread IDs in browser storage and applies the existing workspace filter plus those IDs.
- Importing does not copy, rewrite, archive, or delete local session files.

#### Rollback/Cleanup
- Reopen the picker, clear the imported selections, and confirm. Original Codex session files remain untouched.
