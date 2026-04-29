# Store Extracted Edit Paths

## Problem

PostToolUse edit telemetry stores one `file_path` at best. Multi-file tools,
Bash command writes, and `apply_patch` can mutate more than one file, so claim
diagnostics and handoff state lose useful path evidence.

## Proposal

Normalize claimable edit targets during PostToolUse ingestion and store them as
`metadata.extracted_paths`, while keeping `metadata.file_path` as the first-path
compatibility field.

## Scope

- Extract paths for `Edit`, `Write`, `MultiEdit`, `NotebookEdit`, `Bash`, and
  `apply_patch`/patch aliases.
- Filter pseudo paths such as `/dev/null`.
- Add focused coverage for Bash and `apply_patch` extraction.

## Non-Goals

- No storage schema migration.
- No raw file contents or full patch bodies in durable telemetry.
