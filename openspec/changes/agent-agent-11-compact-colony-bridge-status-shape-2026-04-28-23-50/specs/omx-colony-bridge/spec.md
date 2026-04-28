## MODIFIED Requirements

### Requirement: Colony Exposes an OMX HUD Status Shape

Colony SHALL expose one compact bridge status payload for OMX HUD and status
overlays so OMX does not parse multiple independent Colony tools.

#### Scenario: HUD renders from compact previews

- **WHEN** OMX needs active-lane, attention, ready-work, and claim state for a
  compact display
- **THEN** `bridge_status` returns `hivemind.lane_preview`,
  `attention_counts`, `ready_work_preview`, `claimed_file_count`,
  `claimed_file_preview`, and `next_action`
- **AND** `next` remains a compatibility alias for `next_action`.
