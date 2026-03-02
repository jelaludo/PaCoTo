import chalk from 'chalk';
import Table from 'cli-table3';
import { ProjectNote } from './types';

function progressBar(value: number, width = 6): string {
  const filled = Math.round(Math.min(1, Math.max(0, value)) * width);
  return '█'.repeat(filled) + '░'.repeat(width - filled);
}

function colorStatus(status: string): string {
  switch (status) {
    case 'active':        return chalk.green(status);
    case 'deployed':      return chalk.green(status);
    case 'half-finished': return chalk.yellow(status);
    case 'parked':        return chalk.dim(status);
    case 'archived':      return chalk.dim(status);
    case 'idea':          return chalk.blue(status);
    default:              return status;
  }
}

function colorPriority(priority: string): string {
  switch (priority) {
    case 'P0': return chalk.red.bold(priority);
    case 'P1': return chalk.yellow(priority);
    case 'P2': return chalk.white(priority);
    case 'P3': return chalk.dim(priority);
    default:   return priority;
  }
}

function repoLabel(note: ProjectNote): string {
  if (note.repo === 'none') return note.noteName;
  const parts = note.repo.split('/');
  return parts[parts.length - 1] || note.noteName;
}

function truncate(s: string, max: number): string {
  return s.length > max ? s.slice(0, max - 1) + '…' : s;
}

export function displayTable(notes: ProjectNote[]): void {
  const table = new Table({
    head: ['REPO', 'STATUS', 'PRI', 'PROGRESS', 'DIRTY', 'AREA', 'NEXT ACTION'],
    style: { head: ['cyan'], border: ['dim'] },
    colWidths: [22, 16, 5, 10, 7, 13, 40],
    wordWrap: false,
  });

  for (const note of notes) {
    const g = note.gitStatus;
    const dirtyStr = g?.dirty ? chalk.yellow('•') : ' ';
    const syncStr = g
      ? [
          g.ahead  > 0 ? chalk.green(`↑${g.ahead}`)  : '',
          g.behind > 0 ? chalk.red(`↓${g.behind}`) : '',
        ].join('')
      : '';

    table.push([
      chalk.bold(truncate(repoLabel(note), 20)),
      colorStatus(note.status),
      colorPriority(note.priority),
      progressBar(note.progress),
      dirtyStr + syncStr,
      note.area,
      truncate(note.next_action ?? '—', 38),
    ]);
  }

  console.log(table.toString());
  console.log(chalk.dim(`  ${notes.length} project(s)`));
}
