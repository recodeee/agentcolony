## Why

Quota-ready work already surfaced live `handoff_pending` quota relays, but released expired relays are stored as `weak_expired`. Those rows still represent resumable replacement work, and hiding them leaves quota-stopped tasks visible in health without a claimable ready item.

## What Changes

- Treat `weak_expired` quota claims as ready replacement work in `task_ready_for_agent`.
- Keep the exact `task_claim_quota_accept` action and claim args for released expired relays.
- Claim weak-expired quota rows through the expired quota path instead of the live baton accept path.

## Impact

Agents can pull both pending and released-expired quota-stopped work from `task_ready_for_agent`, with quota relays still ranked above ordinary ready work.
