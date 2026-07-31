### Feature: pnpm 11 reproducible source install

#### Prerequisites
- Node.js 18 or newer and pnpm 11.9.0 are available.
- The checkout is on a clean `custom/main` release commit.

#### Steps
1. Run `pnpm install --frozen-lockfile` from the repository root.
2. Run `pnpm run test:unit`.
3. Run `pnpm run build`.
4. Run `node .\dist-cli\index.js --help` on Windows or `node ./dist-cli/index.js --help` on Linux.
5. Run `git status --short`.

#### Expected Results
- The frozen install accepts the tracked lockfile without changing it.
- Build scripts run only for the packages explicitly allowed in `pnpm-workspace.yaml`.
- Unit tests, the frontend and CLI builds, and the CLI help smoke test complete successfully.
- The worktree remains clean.

#### Rollback/Cleanup
- Remove any generated `dist/` and `dist-cli/` directories if the build artifacts are no longer needed; they are ignored by Git.
