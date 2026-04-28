import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { defaultSettings } from '@colony/config';
import { MemoryStore, TaskThread } from '@colony/core';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { type SuggestionPrefaceDeps, sessionStart } from '../src/handlers/session-start.js';

let dir: string;
let repo: string;
let store: MemoryStore;
let claimCounter = 0;
const now = new Date('2026-04-28T10:00:00Z');

const noSuggestions: SuggestionPrefaceDeps = {
  resolveEmbedder: async () => null,
  loadCore: async () => null,
};

function fakeGitCheckout(path: string, branch: string): void {
  mkdirSync(join(path, '.git'), { recursive: true });
  writeFileSync(join(path, '.git', 'HEAD'), `ref: refs/heads/${branch}\n`);
}

function seedPlanSubtask(branch: string, fileScope: string[], session = 'planner'): number {
  store.startSession({ id: session, ide: 'codex', cwd: repo });
  const thread = TaskThread.open(store, {
    repo_root: repo,
    branch,
    session_id: session,
  });
  store.addObservation({
    session_id: session,
    task_id: thread.task_id,
    kind: 'plan-subtask',
    content: 'Scoped sub-task\n\nTouch scoped files.',
    metadata: {
      parent_plan_slug: 'current',
      parent_plan_title: 'Current plan',
      parent_spec_task_id: null,
      subtask_index: 0,
      file_scope: fileScope,
      depends_on: [],
      spec_row_id: null,
      capability_hint: null,
      status: 'available',
    },
  });
  return thread.task_id;
}

function seedAvailablePlan(planSlug: string, capability_hint: string): void {
  store.startSession({ id: `${planSlug}-planner`, ide: 'codex', cwd: repo });
  TaskThread.open(store, {
    repo_root: repo,
    branch: `spec/${planSlug}`,
    session_id: `${planSlug}-planner`,
  });
  const thread = TaskThread.open(store, {
    repo_root: repo,
    branch: `spec/${planSlug}/sub-0`,
    session_id: `${planSlug}-planner`,
  });
  store.addObservation({
    session_id: `${planSlug}-planner`,
    task_id: thread.task_id,
    kind: 'plan-subtask',
    content: 'Available sub-task\n\nTake the next slice.',
    metadata: {
      parent_plan_slug: planSlug,
      parent_plan_title: `${planSlug} plan`,
      parent_spec_task_id: null,
      subtask_index: 0,
      file_scope: [`packages/${planSlug}/src/index.ts`],
      depends_on: [],
      spec_row_id: null,
      capability_hint,
      status: 'available',
    },
  });
}

function startHolder(session_id: string, ide: string): void {
  store.startSession({ id: session_id, ide, cwd: repo });
}

function holdFile(file_path: string, session_id: string, ageMinutes: number): void {
  vi.setSystemTime(now.getTime() - ageMinutes * 60_000);
  const thread = TaskThread.open(store, {
    repo_root: repo,
    branch: `held/${claimCounter++}`,
    session_id,
  });
  thread.claimFile({ session_id, file_path });
  vi.setSystemTime(now);
}

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(now);
  claimCounter = 0;
  dir = mkdtempSync(join(tmpdir(), 'colony-session-start-conflicts-'));
  repo = join(dir, 'repo');
  mkdirSync(repo, { recursive: true });
  fakeGitCheckout(repo, 'spec/current/sub-0');
  store = new MemoryStore({
    dbPath: join(dir, 'data.db'),
    settings: {
      ...defaultSettings,
      foraging: { ...defaultSettings.foraging, enabled: false },
    },
  });
});

afterEach(() => {
  store.close();
  rmSync(dir, { recursive: true, force: true });
  vi.useRealTimers();
});

describe('SessionStart scope conflict map', () => {
  it('omits Scope check for an empty store or clean scope', async () => {
    const empty = await sessionStart(
      store,
      { session_id: 'me', ide: 'codex', cwd: repo },
      noSuggestions,
    );
    expect(empty).not.toContain('Scope check');

    seedPlanSubtask('spec/current/sub-0', ['apps/api/src/auth.ts']);
    const clean = await sessionStart(
      store,
      { session_id: 'me', ide: 'codex', cwd: repo },
      noSuggestions,
    );
    expect(clean).not.toContain('Scope check');
  });

  it('renders three overlaps sorted by oldest claim first', async () => {
    const fileScope = [
      'apps/api/src/auth.ts',
      'apps/api/src/middleware.ts',
      'packages/storage/src/index.ts',
    ];
    seedPlanSubtask('spec/current/sub-0', fileScope);
    startHolder('codex@019dbc-old', 'codex');
    startHolder('claude@7a67fd-new', 'claude-code');
    holdFile('apps/api/src/middleware.ts', 'claude@7a67fd-new', 3);
    holdFile('apps/api/src/auth.ts', 'codex@019dbc-old', 14);
    holdFile('packages/storage/src/index.ts', 'codex@019dbc-old', 9);

    const preface = await sessionStart(
      store,
      { session_id: 'me', ide: 'codex', cwd: repo },
      noSuggestions,
    );

    expect(preface).toContain('Scope check (3 of 3 intended files held by others):');
    expect(preface).toMatch(
      /apps\/api\/src\/auth\.ts\s+codex@019dbc-o .*14m[\s\S]*packages\/storage\/src\/index\.ts\s+codex@019dbc-o .*9m[\s\S]*apps\/api\/src\/middleware\.ts\s+claude@7a67fd-n .*3m/,
    );
  });

  it('caps seven overlaps to five file lines plus a +2 more line', async () => {
    const fileScope = Array.from({ length: 7 }, (_, i) => `apps/api/src/file-${i}.ts`);
    seedPlanSubtask('spec/current/sub-0', fileScope);
    startHolder('codex@019dbc-overlap', 'codex');
    fileScope.forEach((file_path, index) =>
      holdFile(file_path, 'codex@019dbc-overlap', 70 - index),
    );

    const preface = await sessionStart(
      store,
      { session_id: 'me', ide: 'codex', cwd: repo },
      noSuggestions,
    );

    expect(preface).toContain('Scope check (7 of 7 intended files held by others):');
    expect(preface).toContain('apps/api/src/file-0.ts');
    expect(preface).toContain('apps/api/src/file-4.ts');
    expect(preface).not.toContain('apps/api/src/file-5.ts');
    expect(preface).not.toContain('apps/api/src/file-6.ts');
    expect(preface).toContain('  +2 more');
  });

  it('adds a suggestion when a matching capability sub-task exists', async () => {
    seedPlanSubtask('spec/current/sub-0', ['apps/api/src/auth.ts']);
    startHolder('claude@7a67fd-auth', 'claude-code');
    holdFile('apps/api/src/auth.ts', 'claude@7a67fd-auth', 10);
    store.storage.upsertAgentProfile({
      agent: 'codex',
      capabilities: JSON.stringify({
        ui_work: 0,
        api_work: 1,
        test_work: 0,
        infra_work: 0,
        doc_work: 0,
      }),
    });
    seedAvailablePlan('auth-refactor', 'api_work');

    const preface = await sessionStart(
      store,
      { session_id: 'me', ide: 'codex', cwd: repo },
      noSuggestions,
    );

    expect(preface).toContain(
      'Suggestion: take api_work sub-task on the auth-refactor plan, or wait ~10m.',
    );
  });

  it('omits the suggestion line when no matching sub-task exists', async () => {
    seedPlanSubtask('spec/current/sub-0', ['apps/api/src/auth.ts']);
    startHolder('claude@7a67fd-auth', 'claude-code');
    holdFile('apps/api/src/auth.ts', 'claude@7a67fd-auth', 10);
    store.storage.upsertAgentProfile({
      agent: 'codex',
      capabilities: JSON.stringify({
        ui_work: 0,
        api_work: 1,
        test_work: 0,
        infra_work: 0,
        doc_work: 0,
      }),
    });
    seedAvailablePlan('viewer-polish', 'ui_work');

    const preface = await sessionStart(
      store,
      { session_id: 'me', ide: 'codex', cwd: repo },
      noSuggestions,
    );

    expect(preface).toContain('Scope check');
    expect(preface).not.toContain('Suggestion:');
  });

  it('keeps SessionStart normal when claims data is unavailable', async () => {
    seedPlanSubtask('spec/current/sub-0', ['apps/api/src/auth.ts']);
    vi.spyOn(store.storage, 'listTasks').mockImplementation(() => {
      throw new Error('claims helper unavailable');
    });

    const preface = await sessionStart(
      store,
      { session_id: 'me', ide: 'codex', cwd: repo },
      noSuggestions,
    );

    expect(preface).not.toContain('Scope check');
  });
});
