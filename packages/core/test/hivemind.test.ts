import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { readHivemind } from '../src/hivemind.js';

let dir = '';

afterEach(() => {
  if (dir) rmSync(dir, { recursive: true, force: true });
  dir = '';
});

describe('readHivemind', () => {
  it('derives codex owner when active-session telemetry says unknown', () => {
    dir = mkdtempSync(join(tmpdir(), 'colony-hivemind-'));
    const repoRoot = join(dir, 'repo');
    const worktreePath = join(repoRoot, '.omx', 'agent-worktrees', 'agent__codex__owner-task');
    const activeSessionDir = join(repoRoot, '.omx', 'state', 'active-sessions');
    const now = new Date().toISOString();
    mkdirSync(activeSessionDir, { recursive: true });
    mkdirSync(worktreePath, { recursive: true });
    writeFileSync(
      join(activeSessionDir, 'agent__codex__owner-task.json'),
      `${JSON.stringify(
        {
          schemaVersion: 1,
          repoRoot,
          branch: 'agent/codex/owner-task',
          taskName: 'Fix owner label',
          latestTaskPreview: 'Render Codex instead of unknown',
          agentName: 'unknown',
          cliName: 'unknown',
          sessionKey: 'agent/codex/owner-task',
          worktreePath,
          pid: process.pid,
          startedAt: now,
          lastHeartbeatAt: now,
          state: 'working',
        },
        null,
        2,
      )}\n`,
      'utf8',
    );

    const snapshot = readHivemind({ repoRoot, now: Date.parse(now) });

    expect(snapshot.sessions[0]).toMatchObject({
      branch: 'agent/codex/owner-task',
      agent: 'codex',
      cli: 'codex',
    });
  });
});
