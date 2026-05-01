## ADDED Requirements

### Requirement: Health Focus Summary

`colony health` SHALL show a compact focus summary near the top of the default text report so operators can see the current blocker before detailed diagnostics.

#### Scenario: Default health output starts with the top actionable blocker

- **GIVEN** Colony health has one or more visible action hints
- **WHEN** an operator runs `colony health`
- **THEN** the text output includes a `Health focus` section before detailed diagnostics
- **AND** the section shows bad readiness areas
- **AND** the section shows the top blocker from the existing visible action-hint ranking
- **AND** the section shows the exact command or tool hint when one exists

#### Scenario: Healthy output stays explicit

- **GIVEN** Colony health has no visible action hints
- **WHEN** an operator runs `colony health`
- **THEN** the `Health focus` section reports `next action: none`
