export interface ProjectNote {
  // Vault frontmatter fields
  repo: string;
  path?: string;
  status: 'idea' | 'active' | 'half-finished' | 'deployed' | 'parked' | 'archived';
  priority: 'P0' | 'P1' | 'P2' | 'P3';
  progress: number;
  deployed?: boolean;
  url?: string;
  environment?: string;
  area: string;
  complexity?: string;
  last_touched?: string;
  next_action?: string;
  blocker?: boolean;
  milestone?: string;
  milestone_target?: string;
  milestone_done?: boolean;

  launch?: Record<string, string>;

  // Derived
  noteName: string;
  notePath: string;
  gitStatus?: GitStatus | null;
}

export interface GitStatus {
  branch: string;
  dirty: boolean;
  ahead: number;
  behind: number;
  lastCommit?: {
    date: string;
    sha: string;
    message: string;
  };
}

export interface CLIOptions {
  status?: string;
  area?: string;
  noPath?: boolean;
  dirty?: boolean;
  priority?: string;
}
