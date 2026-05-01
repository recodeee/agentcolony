## MODIFIED Requirements

### Requirement: Agents Pull Work By Response Threshold

Colony SHALL expose ready work for agents to pull, ranked by fit and current
local context.

#### Scenario: agent asks for ready work

- **WHEN** an agent calls `task_ready_for_agent`
- **THEN** Colony ranks unblocked work using plan availability, capability
  hints, agent profile, live claim conflicts, and recent release density
- **AND** the agent chooses and claims the work through normal task-plan tools

#### Scenario: response threshold is not assignment

- **WHEN** ready-work ranking names the best fit
- **THEN** the result is a pull signal, not a command
- **AND** any eligible agent can still inspect, claim, decline, reinforce, or
  hand off based on current context

#### Scenario: quota-stopped replacement work is ready

- **GIVEN** a quota handoff or relay has left file claims in `handoff_pending`
  or `weak_expired`
- **WHEN** an eligible agent calls `task_ready_for_agent`
- **THEN** Colony surfaces a `quota_relay_ready` item with task, owner, files,
  age, expiry, branch, and repo context
- **AND** the item includes `next_tool: task_claim_quota_accept` with exact
  claim args
- **AND** quota replacement work ranks ahead of ordinary ready plan work
