## Why

Colony health shows `task_post` usage but no `task_message` usage, so directed coordination stays hidden in shared task posts.

## What Changes

- Make unread inbox messages expose `suggested_reply_args` beside the existing reply and mark-read tool hints.
- Broaden `task_post` hints so posts that name an agent or ask for action/reply nudge callers toward `task_message`.
- Add an integration test for the directed message -> `attention_inbox` -> mark-read/reply path.

## Impact

Existing `task_post` calls still succeed. Directed coordination becomes obvious from the inbox payload and from compact `task_post` hints.
