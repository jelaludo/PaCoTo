import * as fs from 'fs';
import * as path from 'path';
import matter from 'gray-matter';
import { ProjectNote } from './types';

const PRIORITY_ORDER: Record<string, number> = { P0: 0, P1: 1, P2: 2, P3: 3 };

function scanDir(dir: string): string[] {
  const results: string[] = [];
  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        results.push(...scanDir(fullPath));
      } else if (entry.isFile() && entry.name.endsWith('.md')) {
        results.push(fullPath);
      }
    }
  } catch {
    // skip unreadable dirs
  }
  return results;
}

export function scanVault(vaultPath: string): ProjectNote[] {
  const mdFiles = scanDir(vaultPath);
  const notes: ProjectNote[] = [];

  for (const filePath of mdFiles) {
    // Skip template files — path field contains '...' as placeholder
    if (filePath.includes('Template')) {
      let parsed: matter.GrayMatterFile<string>;
      try { parsed = matter.read(filePath); } catch { continue; }
      if (String(parsed.data.path ?? '').includes('...')) continue;
    }

    let parsed: matter.GrayMatterFile<string>;
    try {
      parsed = matter.read(filePath);
    } catch {
      continue;
    }

    const data = parsed.data;

    // Must have repo field
    if (data.repo === undefined || data.repo === null) continue;

    notes.push({
      repo: String(data.repo),
      path: data.path ? String(data.path) : undefined,
      status: data.status ?? 'idea',
      priority: data.priority ?? 'P3',
      progress: typeof data.progress === 'number' ? data.progress : 0,
      deployed: data.deployed ?? false,
      url: data.url ? String(data.url) : undefined,
      environment: data.environment ? String(data.environment) : undefined,
      area: data.area ? String(data.area) : 'misc',
      complexity: data.complexity ? String(data.complexity) : undefined,
      last_touched: data.last_touched ? String(data.last_touched) : undefined,
      next_action: data.next_action ? String(data.next_action) : undefined,
      blocker: data.blocker ?? false,
      milestone: data.milestone ? String(data.milestone) : undefined,
      milestone_target: data.milestone_target ? String(data.milestone_target) : undefined,
      milestone_done: data.milestone_done ?? false,
      launch: data.launch as Record<string, string> | undefined,
      noteName: path.basename(filePath, '.md'),
      notePath: filePath,
    });
  }

  // Sort: priority ASC, then progress DESC
  notes.sort((a, b) => {
    const pa = PRIORITY_ORDER[a.priority] ?? 99;
    const pb = PRIORITY_ORDER[b.priority] ?? 99;
    if (pa !== pb) return pa - pb;
    return b.progress - a.progress;
  });

  return notes;
}
