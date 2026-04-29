## 1. Directed Message Adoption

- [x] Inspect `attention_inbox`, `task_message`, and `task_post`.
- [x] Add `suggested_reply_args` to unread message action hints.
- [x] Keep `reply_tool: "task_message"` and `mark_read_tool: "task_message_mark_read"` on inbox message items.
- [x] Broaden `task_post` nudge when content names an agent or asks for action/reply.
- [x] Update docs for the inbox message action shape.

## 2. Verification

- [x] Add MCP integration test for directed message -> `attention_inbox` -> mark-read/reply path.
- [x] Add/adjust regression tests for `task_post` nudge behavior and core inbox payload shape.
- [x] Run TypeScript checks for touched packages.
- [x] Run Biome check for touched files.
- [x] Run targeted Vitest suites after `better-sqlite3` native binding is available.
- [x] Run OpenSpec validation.

## 3. Completion / Cleanup

- [x] Commit changes.
- [ ] Push branch.
- [ ] Open/update PR and record URL.
- [ ] Verify PR state is `MERGED`.
- [ ] Verify sandbox worktree cleanup.
