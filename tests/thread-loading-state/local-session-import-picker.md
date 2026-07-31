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
6. Reopen the dialog and confirm the sessions imported in step 4 are absent from the candidate list and count.
7. Import another session and confirm both the previous and new imports remain visible in the sidebar.
8. Import every remaining session, reopen the dialog, and confirm the empty state says all local sessions are already imported and `Import 0` is disabled.
9. Repeat the dialog checks in light and dark themes and in 375x812 and 768x1024 viewports.

#### Expected Results
- Loading candidates does not change the visible thread list before confirmation.
- Every `thread/list` page is fetched sequentially from the codex-mobile host.
- Search, select-all, candidate counts, and bounded DOM batches operate only over sessions whose stable thread IDs are not already imported.
- Confirming merges newly selected IDs with the persisted imported thread IDs without duplicates or loss of earlier imports.
- Reopening the picker never offers an already imported session again.
- Importing does not copy, rewrite, archive, or delete local session files.

#### Rollback/Cleanup
- Clear `codex-web-local.imported-local-thread-ids.v1` from browser local storage and reload the app when the imported sidebar state must be reset. Original Codex session files remain untouched.
