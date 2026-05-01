# Improve colony health CLI focus

## Problem

`colony health` already ranks next fixes, but the first actionable item is buried after the full diagnostics report. Operators checking health from the CLI need the current blocker and exact next action before scanning detailed sections.

## Solution

Add a compact `Health focus` block near the top of the default text output. It reuses the existing visible action-hint ranking, reports bad readiness areas, hidden follow-up count, the top blocker, and the exact command/tool action when available.

## Safety

This is a display-only change. JSON payloads, health metrics, fix-plan mutation gates, and action-hint ranking stay unchanged.
