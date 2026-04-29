# Tasks

## 1. Extraction

- [x] Inspect PostToolUse edit ingestion.
- [x] Extract normalized file paths for direct edit tools.
- [x] Extract Bash write paths from in-place `sed` and redirects.
- [x] Extract `apply_patch` header paths.
- [x] Filter pseudo paths.
- [x] Store `metadata.extracted_paths` while preserving `metadata.file_path`.

## 2. Verification

- [x] Add Bash parser tests for in-place `sed`.
- [x] Add PostToolUse tests for Bash redirect metadata.
- [x] Add PostToolUse tests for `apply_patch` metadata and auto-claims.
- [x] Run focused verification.
  - `pnpm --filter @colony/hooks test -- bash-parser auto-claim runner`
  - `pnpm --filter @colony/hooks typecheck`
  - `pnpm --filter @colony/core test -- task-thread`
  - `pnpm --filter @colony/core typecheck`
  - `pnpm --filter @colony/storage test -- coordination-activity`
  - `pnpm --filter @colony/storage typecheck`
  - `pnpm exec biome check packages/hooks/src/handlers/post-tool-use.ts packages/hooks/src/bash-parser.ts packages/hooks/test/bash-parser.test.ts packages/hooks/test/auto-claim.test.ts packages/hooks/test/runner.test.ts packages/storage/src/tool-classes.ts packages/storage/src/storage.ts packages/storage/test/coordination-activity.test.ts packages/core/src/task-thread.ts`

## 3. Completion

- [x] Run `openspec validate --specs`.
- [ ] Commit, push, open/update PR, wait for merge, and cleanup sandbox.
