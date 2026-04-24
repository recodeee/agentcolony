import { existsSync } from 'node:fs';
import { loadSettings, resolveDataDir, settingsPath } from '@colony/config';
import type { Command } from 'commander';
import kleur from 'kleur';
import { dataDbPath, withStorage } from '../util/store.js';

export function registerDoctorCommand(program: Command): void {
  program
    .command('doctor')
    .description('Run health checks')
    .action(async () => {
      const path = settingsPath();
      process.stdout.write(
        `settings: ${path} ${existsSync(path) ? kleur.green('ok') : kleur.red('missing')}\n`,
      );
      const settings = loadSettings();
      const dir = resolveDataDir(settings.dataDir);
      process.stdout.write(`dataDir:  ${dir}\n`);
      const dbPath = dataDbPath(settings);
      try {
        const sessions = await withStorage(settings, (s) => s.listSessions(1).length);
        process.stdout.write(`db:       ${dbPath} ${kleur.green('ok')} (${sessions} sessions)\n`);
      } catch (err) {
        process.stdout.write(`db:       ${dbPath} ${kleur.red('fail')} ${String(err)}\n`);
        process.exitCode = 1;
      }
      process.stdout.write(`port:     ${settings.workerPort}\n`);
      process.stdout.write(`comp:     intensity=${settings.compression.intensity}\n`);
      process.stdout.write(
        `embed:    ${settings.embedding.provider} / ${settings.embedding.model}\n`,
      );
      const enabled = Object.entries(settings.ides)
        .filter(([, v]) => v)
        .map(([k]) => k);
      process.stdout.write(
        `ides:     ${enabled.length ? enabled.join(', ') : kleur.dim('none')}\n`,
      );
    });
}
