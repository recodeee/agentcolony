import type { Settings } from '@colony/config';
import type { MemoryStore } from '@colony/core';

export interface RescueStrandedOptions {
  dry_run: boolean;
  stranded_after_ms?: number;
}

export interface RescueScanOptions {
  dry_run: boolean;
  stranded_after_minutes?: number;
}

export interface RescueStrandedOutcome {
  dry_run: boolean;
  stranded: Array<Record<string, unknown>>;
  rescued: Array<Record<string, unknown>>;
  [key: string]: unknown;
}

export type RescueStrandedSessionsFn = (
  store: MemoryStore,
  options: RescueStrandedOptions,
) => RescueStrandedOutcome | Promise<RescueStrandedOutcome>;

export interface RescueScanSnapshot extends RescueStrandedOutcome {
  last_scan_at: number;
  next_scan_at: number;
  error: string | null;
}

export interface RescueLoopHandle {
  stop: () => Promise<void>;
  lastScan: () => RescueScanSnapshot | null;
  scan: (options?: Partial<RescueScanOptions>) => Promise<RescueScanSnapshot>;
}

export interface RescueLoopOptions {
  store: MemoryStore;
  settings: Settings;
  intervalMs?: number;
  log?: (line: string) => void;
  rescueStrandedSessions?: RescueStrandedSessionsFn;
}

export function startRescueLoop(opts: RescueLoopOptions): RescueLoopHandle {
  const { store } = opts;
  const intervalMs = opts.intervalMs ?? 60_000;
  const log = opts.log ?? ((line: string) => process.stderr.write(`${line}\n`));
  let stopped = false;
  let inFlight: Promise<void> | null = null;
  let latest: RescueScanSnapshot | null = null;

  const scan = async (options: Partial<RescueScanOptions> = {}): Promise<RescueScanSnapshot> => {
    const lastScanAt = Date.now();
    const nextScanAt = lastScanAt + intervalMs;
    try {
      const rescue = opts.rescueStrandedSessions ?? (await loadRescueStrandedSessions());
      const outcome = normalizeOutcome(
        await runRescue(store, rescue, {
          dry_run: options.dry_run ?? false,
          ...(options.stranded_after_minutes !== undefined
            ? { stranded_after_ms: options.stranded_after_minutes * 60_000 }
            : {}),
        }),
        options.dry_run ?? false,
      );
      latest = {
        ...outcome,
        last_scan_at: lastScanAt,
        next_scan_at: nextScanAt,
        error: null,
      };
      logScan(log, latest);
      return latest;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      latest = {
        dry_run: options.dry_run ?? false,
        stranded: [],
        rescued: [],
        last_scan_at: lastScanAt,
        next_scan_at: nextScanAt,
        error: message,
      };
      log(`[colony worker] rescue scan error: ${message}`);
      return latest;
    }
  };

  const trigger = () => {
    if (stopped || inFlight) return;
    inFlight = scan({ dry_run: false })
      .then(() => undefined)
      .finally(() => {
        inFlight = null;
      });
  };

  trigger();
  const timer = setInterval(trigger, intervalMs);
  timer.unref?.();

  return {
    stop: async () => {
      stopped = true;
      clearInterval(timer);
      if (inFlight) await inFlight;
    },
    lastScan: () => latest,
    scan,
  };
}

async function runRescue(
  store: MemoryStore,
  rescue: RescueStrandedSessionsFn,
  options: RescueStrandedOptions,
): Promise<RescueStrandedOutcome> {
  if (!options.dry_run) return rescue(store, options);
  return rollbackDryRun(store, () => rescue(store, options));
}

function rollbackDryRun(
  store: MemoryStore,
  fn: () => RescueStrandedOutcome | Promise<RescueStrandedOutcome>,
): RescueStrandedOutcome {
  const rollback = new Error('rollback dry-run rescue scan');
  let outcome: RescueStrandedOutcome | Promise<RescueStrandedOutcome> | undefined;
  try {
    store.storage.transaction(() => {
      outcome = fn();
      throw rollback;
    });
  } catch (err) {
    if (err !== rollback) throw err;
  }
  if (!outcome || outcome instanceof Promise) {
    throw new Error('dry-run rescue scan must complete synchronously');
  }
  return outcome;
}

async function loadRescueStrandedSessions(): Promise<RescueStrandedSessionsFn> {
  const mod = (await import('@colony/core')) as Record<string, unknown>;
  const rescue = mod.rescueStrandedSessions;
  if (typeof rescue !== 'function') {
    throw new Error('rescueStrandedSessions is unavailable; merge the core substrate first');
  }
  return rescue as RescueStrandedSessionsFn;
}

function normalizeOutcome(outcome: RescueStrandedOutcome, dryRun: boolean): RescueStrandedOutcome {
  const rescued = Array.isArray(outcome.rescued) ? outcome.rescued : [];
  return {
    ...outcome,
    dry_run: typeof outcome.dry_run === 'boolean' ? outcome.dry_run : dryRun,
    stranded: Array.isArray(outcome.stranded) ? outcome.stranded : rescued,
    rescued,
  };
}

function logScan(log: (line: string) => void, scan: RescueScanSnapshot): void {
  log(
    `[colony worker] rescue scan stranded=${scan.stranded.length} rescued=${scan.rescued.length} dry_run=${scan.dry_run}`,
  );
}
