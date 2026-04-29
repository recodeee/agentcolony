# OMX-Colony Bridge Delta

## ADDED Requirements

### Requirement: PostToolUse Stores Extracted Edit Paths

Colony SHALL store normalized extracted file paths for claimable PostToolUse
edit events.

#### Scenario: Direct edit tool writes one or more files

- **WHEN** PostToolUse receives `Edit`, `Write`, `MultiEdit`, or
  `NotebookEdit` input with claimable file targets
- **THEN** the tool-use observation metadata includes `extracted_paths` with
  every normalized claimable file path
- **AND** `file_path` remains set to the first extracted path for compatibility
- **AND** pseudo paths such as `/dev/null` are excluded

#### Scenario: Bash command mutates files

- **WHEN** PostToolUse receives a `Bash` command that writes through in-place
  `sed` or stdout redirection
- **THEN** Colony stores the normalized mutated file paths in
  `extracted_paths`
- **AND** redirect auto-claims continue to use the existing Write-compatible
  claim path

#### Scenario: apply_patch mutates files

- **WHEN** PostToolUse receives `apply_patch`, `ApplyPatch`, or `Patch`
  input containing patch file headers
- **THEN** Colony stores every add/update/delete/move target in
  `extracted_paths`
- **AND** auto-claim, pheromone, and proposal reinforcement logic uses those
  extracted paths
