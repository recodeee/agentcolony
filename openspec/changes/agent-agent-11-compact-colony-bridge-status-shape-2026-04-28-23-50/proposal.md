# Compact Colony Bridge Status Shape

## Problem

OMX needs one MCP call that can render Colony coordination state in a HUD/status
surface without keeping `omx_state_*` tools hot or hydrating observation bodies.

## Scope

- Extend the existing `bridge_status` payload with explicit lane summary,
  attention counts, claim count/preview, and `next_action`.
- Keep current compact fields compatible for existing consumers.
- Update focused MCP tests and bridge documentation.
