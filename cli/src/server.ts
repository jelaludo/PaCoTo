import express from 'express';
import * as fs from 'fs';
import * as path from 'path';
import { exec } from 'child_process';
import { scanVault } from './vault';
import { getGitStatus } from './git';

const app = express();
const PORT = 3000;
const VAULT_PATH = process.env.PACOTO_VAULT ?? 'C:\\01_Projects\\01a_Coding\\JelaCode';
const PUBLIC_DIR = path.join(__dirname, '../../public');

app.use(express.json());
app.use(express.static(PUBLIC_DIR));

// ── GET /api/projects ────────────────────────────────────────────────────────
app.get('/api/projects', async (_req, res) => {
  try {
    const notes = scanVault(VAULT_PATH);
    await Promise.all(
      notes
        .filter(n => n.path && n.repo !== 'none')
        .map(async n => { n.gitStatus = await getGitStatus(n.path!); })
    );
    res.json(notes);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

// ── PATCH /api/projects/:slug ─────────────────────────────────────────────────
app.patch('/api/projects/:slug', (req, res) => {
  const slug = decodeURIComponent(req.params.slug);
  const updates = req.body as Record<string, unknown>;

  const notes = scanVault(VAULT_PATH);
  const note = notes.find(n => n.noteName === slug);
  if (!note) return res.status(404).json({ error: 'Project not found' });

  try {
    patchFrontmatter(note.notePath, updates);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

// ── POST /api/launch ──────────────────────────────────────────────────────────
app.post('/api/launch', (req, res) => {
  const { command, cwd } = req.body as { command: string; cwd?: string };
  if (!command) return res.status(400).json({ error: 'No command' });
  const isLauncher = /^(wt|code|cmd)\b/i.test(command.trim());
  const cmd = isLauncher
    ? command
    : `wt${cwd ? ` -d "${cwd}"` : ''} -- cmd /k ${command}`;
  exec(cmd, (err) => {
    if (err) console.error('[launch error]', err.message, '\ncmd:', cmd);
  });
  res.json({ ok: true });
});

// ── Start ─────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\nPaCoTo — http://localhost:${PORT}\n`);
  exec('cmd /c start http://localhost:3000');
});

// ── Helpers ───────────────────────────────────────────────────────────────────
function toYamlValue(key: string, value: unknown): string {
  if (typeof value === 'boolean') return String(value);
  if (typeof value === 'number')  return String(value);
  if (typeof value === 'string') {
    if (value === '') return '';
    const needsQuotes = ['next_action', 'milestone'].includes(key)
      || value.includes(':') || value.includes('#');
    if (needsQuotes) return `"${value.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;
    return value;
  }
  return JSON.stringify(value);
}

function patchFrontmatter(filePath: string, updates: Record<string, unknown>): void {
  let raw = fs.readFileSync(filePath, 'utf8');

  // Locate frontmatter block (between the two ---)
  const fmEnd = raw.indexOf('\n---', 3);
  if (fmEnd === -1) throw new Error('No frontmatter found');

  let fm   = raw.slice(0, fmEnd + 4);
  const body = raw.slice(fmEnd + 4);

  for (const [key, value] of Object.entries(updates)) {
    const yamlVal = toYamlValue(key, value);
    const regex   = new RegExp(`^(${key}:).*$`, 'm');
    if (regex.test(fm)) {
      fm = fm.replace(regex, `$1 ${yamlVal}`);
    }
  }

  fs.writeFileSync(filePath, fm + body, 'utf8');
}
