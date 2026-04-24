import { loadSettings } from '@colony/config';
import type { MemoryStore } from '@colony/core';
import type { Command } from 'commander';
import kleur from 'kleur';
import { withStore } from '../util/store.js';

/**
 * Reserved session identifier for human scratch notes. Using a fixed id
 * (rather than a per-invocation random one) means every note across the
 * whole day lives under the same session, which makes "all my notes"
 * filters and timeline queries trivial.
 */
const OBSERVER_SESSION_ID = 'observer';

/**
 * Idempotently materialise the observer session so the FK from
 * observations.session_id holds. `startSession` is `INSERT OR IGNORE`, so
 * this is effectively free after the first call.
 */
function ensureObserverSession(store: MemoryStore): void {
  store.startSession({
    id: OBSERVER_SESSION_ID,
    ide: 'observer',
    cwd: process.cwd(),
  });
}

export function registerNoteCommand(program: Command): void {
  program
    // Variadic so `colony note codex stepped on claude` works without
    // quoting. The quoting-every-note friction kills adoption otherwise.
    .command('note <text...>')
    .description('Record a timestamped scratch note into the memory timeline')
    .option('--task <id>', 'Attach this note to a specific task thread (shows up in task_timeline)')
    .action(async (words: string[], opts: { task?: string }) => {
      const text = words.join(' ').trim();
      if (!text) {
        process.stderr.write(`${kleur.red('empty note')}\n`);
        process.exitCode = 1;
        return;
      }

      const settings = loadSettings();
      await withStore(settings, (store) => {
        ensureObserverSession(store);
        const id = store.addObservation({
          session_id: OBSERVER_SESSION_ID,
          kind: 'observer-note',
          content: text,
          ...(opts.task ? { task_id: Number(opts.task) } : {}),
        });
        const when = new Date().toISOString().slice(11, 19);
        process.stdout.write(
          `${kleur.green('✓')} note #${id} at ${when}${opts.task ? ` on task #${opts.task}` : ''}\n`,
        );
      });
    });
}
