import {
  type AgentCapabilities,
  type MemoryStore,
  detectRepoBranch,
  listPlans,
} from '@colony/core';
import type { HookInput } from './types.js';

type CapabilityKey = keyof AgentCapabilities;

interface StoredClaim {
  file_path: string;
  session_id: string;
  claimed_at: number;
  agent?: string | null;
  ide?: string | null;
}

export interface ScopeOverlap {
  file_path: string;
  session_id: string;
  holder: string;
  claimed_at: number;
}

interface ClaimsForPathsStorage {
  claimsForPaths?: (paths: string[]) => unknown;
}

const CAPABILITY_KEYS: CapabilityKey[] = [
  'ui_work',
  'api_work',
  'test_work',
  'infra_work',
  'doc_work',
];

export function buildScopeCheckPreface(
  store: MemoryStore,
  input: Pick<HookInput, 'session_id' | 'cwd' | 'ide'>,
): string {
  const cwd = input.cwd;
  if (!cwd) return '';
  const detected = detectRepoBranch(cwd);
  if (!detected) return '';

  const task = store.storage.findTaskByBranch(detected.repo_root, detected.branch);
  if (!task) return '';

  const intendedPaths = intendedFileScope(store, task.id, input.session_id);
  if (intendedPaths.length === 0) return '';

  const overlaps = scopeOverlap(store, {
    intended_paths: intendedPaths,
    my_session_id: input.session_id,
  });
  if (overlaps.length === 0) return '';

  const agent = deriveAgent(input.ide, detected.branch);
  return renderScopeCheck({
    overlaps,
    intended_count: intendedPaths.length,
    suggestion: scopeSuggestion(store, detected.repo_root, agent),
  });
}

export function scopeOverlap(
  store: MemoryStore,
  p: { intended_paths: string[]; my_session_id: string },
): ScopeOverlap[] {
  const intended = new Set(normalizePaths(p.intended_paths));
  if (intended.size === 0) return [];

  let raw: unknown;
  try {
    raw = (store.storage as unknown as ClaimsForPathsStorage).claimsForPaths?.([...intended]);
  } catch {
    return [];
  }
  if (raw === undefined || raw === null) return [];

  const rows = normalizeClaimRows(raw);
  return rows
    .filter((row) => intended.has(row.file_path))
    .filter((row) => row.session_id !== p.my_session_id)
    .map((row) => ({
      file_path: row.file_path,
      session_id: row.session_id,
      holder: holderLabel(store, row),
      claimed_at: row.claimed_at,
    }))
    .sort((a, b) => a.claimed_at - b.claimed_at || a.file_path.localeCompare(b.file_path));
}

function intendedFileScope(store: MemoryStore, task_id: number, session_id: string): string[] {
  const rows = store.storage.taskTimeline(task_id, 500);
  const planSubtask = rows.find((row) => row.kind === 'plan-subtask');
  const planScope = fileScopeFromMetadata(planSubtask?.metadata ?? null);
  if (planScope.length > 0) return planScope;

  const taskScope = rows
    .map((row) => fileScopeFromMetadata(row.metadata))
    .find((scope) => scope.length > 0);
  if (taskScope && taskScope.length > 0) return taskScope;

  const claimHint = rows.find((row) => row.kind === 'claim' && row.session_id === session_id);
  return fileScopeFromMetadata(claimHint?.metadata ?? null);
}

function fileScopeFromMetadata(metadata: string | null): string[] {
  if (!metadata) return [];
  let parsed: unknown;
  try {
    parsed = JSON.parse(metadata);
  } catch {
    return [];
  }
  if (!parsed || typeof parsed !== 'object') return [];
  const meta = parsed as Record<string, unknown>;
  if (Array.isArray(meta.file_scope)) return normalizePaths(meta.file_scope);
  if (Array.isArray(meta.intended_paths)) return normalizePaths(meta.intended_paths);
  if (typeof meta.file_path === 'string') return normalizePaths([meta.file_path]);
  return [];
}

function normalizePaths(paths: unknown[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const path of paths) {
    if (typeof path !== 'string') continue;
    const trimmed = path.trim();
    if (!trimmed || seen.has(trimmed)) continue;
    seen.add(trimmed);
    out.push(trimmed);
  }
  return out;
}

function normalizeClaimRows(raw: unknown): StoredClaim[] {
  const rows = Array.isArray(raw)
    ? raw
    : raw && typeof raw === 'object' && Array.isArray((raw as { claims?: unknown }).claims)
      ? (raw as { claims: unknown[] }).claims
      : [];
  return rows
    .map((row): StoredClaim | null => {
      if (!row || typeof row !== 'object') return null;
      const claim = row as Record<string, unknown>;
      if (typeof claim.file_path !== 'string') return null;
      if (typeof claim.session_id !== 'string') return null;
      const claimedAt = Number(claim.claimed_at);
      return {
        file_path: claim.file_path,
        session_id: claim.session_id,
        claimed_at: Number.isFinite(claimedAt) ? claimedAt : 0,
        agent: typeof claim.agent === 'string' ? claim.agent : null,
        ide: typeof claim.ide === 'string' ? claim.ide : null,
      };
    })
    .filter((row): row is StoredClaim => row !== null);
}

function holderLabel(store: MemoryStore, claim: StoredClaim): string {
  const session = store.storage.getSession(claim.session_id);
  const agent = normalizeAgent(claim.agent ?? claim.ide ?? session?.ide ?? claim.session_id);
  return `${agent}@${shortSessionId(claim.session_id)}`;
}

function normalizeAgent(value: string): string {
  if (value === 'claude-code') return 'claude';
  if (value.includes('@')) return value.split('@')[0] || 'agent';
  return value || 'agent';
}

function shortSessionId(session_id: string): string {
  const suffix = session_id.includes('@') ? session_id.split('@').pop() : session_id;
  return (suffix ?? session_id).slice(0, 8);
}

function renderScopeCheck(p: {
  overlaps: ScopeOverlap[];
  intended_count: number;
  suggestion: string | null;
}): string {
  const shown = p.overlaps.slice(0, 5);
  const lines = [
    `Scope check (${p.overlaps.length} of ${p.intended_count} intended files held by others):`,
  ];
  for (const overlap of shown) {
    lines.push(
      `  - ${overlap.file_path}  ${overlap.holder} · ${formatAge(Date.now() - overlap.claimed_at)}`,
    );
  }
  const hidden = p.overlaps.length - shown.length;
  if (hidden > 0) {
    lines.push(`  +${hidden} more`);
  }
  if (p.suggestion) {
    lines.push(`  Suggestion: ${p.suggestion}`);
  }
  return lines.join('\n');
}

function formatAge(ageMs: number): string {
  const seconds = Math.max(0, Math.round(ageMs / 1000));
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.max(1, Math.round(seconds / 60));
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h`;
  return `${Math.round(hours / 24)}d`;
}

function scopeSuggestion(store: MemoryStore, repo_root: string, agent: string): string | null {
  const row = store.storage.getAgentProfile(agent);
  if (!row) return null;

  const capabilities = parseCapabilities(row.capabilities);
  const rankedCapabilities = CAPABILITY_KEYS.map((key) => ({
    key,
    weight: capabilities[key] ?? 0,
  }))
    .filter((entry) => entry.weight > 0)
    .sort((a, b) => b.weight - a.weight);

  for (const { key } of rankedCapabilities) {
    const plan = listPlans(store, {
      repo_root,
      only_with_available_subtasks: true,
      capability_match: key,
      limit: 1,
    })[0];
    const subtask = plan?.next_available.find((candidate) => candidate.capability_hint === key);
    if (plan && subtask) {
      return `take ${key} sub-task on the ${plan.plan_slug} plan, or wait ~10m.`;
    }
  }
  return null;
}

function parseCapabilities(raw: string): Partial<AgentCapabilities> {
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== 'object') return {};
    return parsed as Partial<AgentCapabilities>;
  } catch {
    return {};
  }
}

function deriveAgent(ide: string | undefined, branch: string): string {
  if (ide === 'claude-code') return 'claude';
  if (ide === 'codex') return 'codex';
  const parts = branch.split('/').filter(Boolean);
  if (parts[0] === 'agent' && parts[1]) return parts[1];
  return ide ?? 'agent';
}
