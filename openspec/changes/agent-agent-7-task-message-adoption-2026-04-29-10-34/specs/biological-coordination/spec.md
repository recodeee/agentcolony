## ADDED Requirements

### Requirement: Inbox Messages Advertise Directed Replies

`attention_inbox` SHALL make the directed `task_message` reply and mark-read path obvious for unread messages.

#### Scenario: Needs-reply message includes action hints

- **GIVEN** a participant receives an unread `task_message` with `urgency="needs_reply"`
- **WHEN** the participant calls `attention_inbox`
- **THEN** the unread message item includes `reply_tool: "task_message"`
- **AND** it includes `suggested_reply_args` with `task_id`, recipient `session_id`, recipient `agent`, sender `to_session_id`, `reply_to`, and placeholder `content`
- **AND** it includes `mark_read_tool: "task_message_mark_read"`

### Requirement: Task Posts Nudge Directed Coordination

`task_post` SHALL remain non-blocking while nudging likely directed coordination toward `task_message`.

#### Scenario: Agent mention or action request gets a compact hint

- **WHEN** `task_post` content names an agent or asks for action/reply
- **THEN** the post is still recorded
- **AND** the response hint includes `For directed agent coordination, use task_message.`
