---
"@imdeadpool/colony-cli": patch
---

Add a root publish wrapper for the public CLI package and normalize the CLI bin metadata so `npm publish` targets `apps/cli` instead of the private monorepo root.
