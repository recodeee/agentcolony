import { loadSettings } from '@colony/config';
import type { Command } from 'commander';
import { withStorage } from '../util/store.js';

export function registerReindexCommand(program: Command): void {
  program
    .command('reindex')
    .description('Rebuild FTS index')
    .action(async () => {
      const settings = loadSettings();
      await withStorage(settings, (s) => s.rebuildFts());
      process.stdout.write('reindex ok\n');
    });
}
