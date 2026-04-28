---
"@imdeadpool/colony-cli": patch
---

`colony health` now surfaces a top-tools breakdown and a hook-wiring hint when the window has tool calls but zero `mcp__` entries, so the zero-state is debuggable instead of silent.
