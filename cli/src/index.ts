#!/usr/bin/env ts-node
import { scanVault } from './vault';
import { getGitStatus } from './git';
import { displayTable } from './display';
import { CLIOptions, ProjectNote } from './types';

const VAULT_PATH =
  process.env.PACOTO_VAULT ?? 'C:\\01_Projects\\01a_Coding\\JelaCode';

function parseArgs(): CLIOptions {
  const args = process.argv.slice(2);
  const opts: CLIOptions = {};
  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--status':   opts.status   = args[++i]; break;
      case '--area':     opts.area     = args[++i]; break;
      case '--priority': opts.priority = args[++i]; break;
      case '--no-path':  opts.noPath   = true;      break;
      case '--dirty':    opts.dirty    = true;       break;
    }
  }
  return opts;
}

function applyFilters(notes: ProjectNote[], opts: CLIOptions): ProjectNote[] {
  let result = notes;
  if (opts.status)   result = result.filter(n => n.status   === opts.status);
  if (opts.area)     result = result.filter(n => n.area     === opts.area);
  if (opts.priority) result = result.filter(n => n.priority === opts.priority);
  if (opts.noPath)   result = result.filter(n => !n.path);
  if (opts.dirty)    result = result.filter(n => n.gitStatus?.dirty === true);
  return result;
}

async function main(): Promise<void> {
  const opts = parseArgs();

  console.log(`\nPaCoTo — scanning vault: ${VAULT_PATH}\n`);

  const notes = scanVault(VAULT_PATH);

  // Fetch git status in parallel for all projects with a real local path
  await Promise.all(
    notes
      .filter(n => n.path && n.repo !== 'none')
      .map(async n => { n.gitStatus = await getGitStatus(n.path!); })
  );

  const filtered = applyFilters(notes, opts);

  if (filtered.length === 0) {
    console.log('No projects match the current filters.\n');
    return;
  }

  displayTable(filtered);
  console.log();
}

main().catch(err => {
  console.error('Error:', (err as Error).message);
  process.exit(1);
});
