import * as fs from 'fs';
import simpleGit from 'simple-git';
import { GitStatus } from './types';

export async function getGitStatus(repoPath: string): Promise<GitStatus | null> {
  if (!repoPath || !fs.existsSync(repoPath)) return null;

  try {
    const git = simpleGit(repoPath);

    const isRepo = await git.checkIsRepo();
    if (!isRepo) return null;

    const [status, log] = await Promise.all([
      git.status(),
      git.log({ maxCount: 1 }).catch(() => null),
    ]);

    return {
      branch: status.current ?? 'unknown',
      dirty: !status.isClean(),
      ahead: status.ahead,
      behind: status.behind,
      lastCommit: log?.latest
        ? {
            date: log.latest.date,
            sha: log.latest.hash.slice(0, 7),
            message: log.latest.message,
          }
        : undefined,
    };
  } catch {
    return null;
  }
}
