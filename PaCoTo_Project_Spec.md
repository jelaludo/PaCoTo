# PaCoTo — Project Dashboard for Vibe‑Coded Repos (Local‑First)

**Name:** PaCoTo (Project PaCoTo)  
**Tagline:** Local dashboard that *joins human intent + repo truth* and resumes work in one click.

---

## 0. Context

You already use **Obsidian** as a local Markdown knowledge base, with **one note per repo** containing YAML frontmatter metadata and freeform Markdown content (example note format: `UdejujiHakai.md`). fileciteturn0file0L1-L44

PaCoTo’s job is to:

1. **Scan local repos** and extract objective git + stack facts.
2. **Pull GitHub signals** (CI/deploy/PR/issue status) when online.
3. **Integrate with Obsidian notes** as the canonical place for plans, intent, and subjective flags.
4. Provide a **fast dashboard UI** for triage and resumption:
   - edit flags quickly
   - click to open terminal/editor/dev command
   - see what’s stale / risky / ready to ship

---

## 1. Goals

### 1.1 Primary goals
- **Local‑first**: works offline with local repo scanning; GitHub data is additive.
- **Human‑in‑the‑loop**: subjective fields (priority, progress, blocker, next_action) remain editable and intentional.
- **One‑click resumption**: launch editor/terminal/dev/test/“Claude Code” entrypoints per repo.
- **Obsidian‑native**: project notes are plain `.md` files inside your vault; PaCoTo reads/writes YAML frontmatter and never requires proprietary formats.
- **Truth + intent merge**: display and query:
  - truth: git/stack/CI/deploy
  - intent: status/priority/plan/log

### 1.2 Non‑goals (V1)
- Not a full Jira replacement.
- Not a cloud service.
- Not a monolithic “issue tracker”; GitHub Issues remain where they are.
- Not an auto‑planner. PaCoTo suggests, but you decide.

---

## 2. Core Concepts

### 2.1 Two sources of data
**A) Intent (human) — Obsidian note**  
- You own it.
- PaCoTo reads/writes YAML frontmatter + optionally manages standardized sections.

**B) Truth (machine) — repo scanner + GitHub pull**  
- PaCoTo generates/refreshes objective facts.
- Never overwrites your narrative notes.

### 2.2 Stable join key
Every project is keyed by at least one of:
- `repo:` (short id, e.g. `UdejujiHakai`)
- `path:` local filesystem path
- optionally `url:` GitHub remote URL

---

## 3. Vault / Repo Layout (recommended)

```
<ProjectsRoot>\
  _vault\                         # Obsidian vault folder
    dashboard.md
    projects\                     # one .md per repo (human-owned)
      UdejujiHakai.md
      ...
    generated\                    # objective facts (machine-owned)
      UdejujiHakai.yml
      ...
    templates\
      project_template.md
  <repo1>\
  <repo2>\
```

**Rule:** PaCoTo can regenerate `generated/*.yml` freely.  
**Rule:** PaCoTo only edits YAML frontmatter in `projects/*.md` (never touches your prose sections unless explicitly enabled).

---

## 4. Project Note Schema (Intent)

PaCoTo supports a minimal schema aligned with your existing note style. fileciteturn0file0L1-L29

### 4.1 Required fields (V1)
```yaml
repo: <string>                 # stable id, prefer folder name
path: <absolute path>
status: idea|active|half-finished|blocked|deployed|parked|archived
priority: P0|P1|P2|P3
progress: <0..1>               # subjective
deployed: true|false
environment: none|github-pages|cloudflare-pages|vercel|netlify|docker|local
last_touched: YYYY-MM-DD       # subjective or from git (your call)
next_action: <one line>
blocker: true|false
launch:
  editor: <command>
  terminal: <command>
  dev: <command>
```

### 4.2 Recommended fields (V1)
```yaml
url: <deployed url>
tech_stack: [ ... ]            # your human summary (optional)
area: bjj|tools|comfyui|web|...
complexity: low|medium|high
tags: [ ... ]                  # optional
```

### 4.3 Body template (Markdown)
Standardized sections to reduce “where did I leave off?” friction:

- **Goal** (1–3 sentences)
- **Scope** (includes / excludes)
- **Roadmap** (checkbox list)
- **Current State** (working / broken)
- **Decisions** (important choices + why)
- **Risks / Unknowns**
- **Log** (dated entries)
- **Links** (repo, deploy, docs)

---

## 5. Generated Facts Schema (Truth)

Machine‑owned file per repo: `generated/<repo>.yml`

### 5.1 Local git facts (offline)
```yaml
repo_path: <absolute path>
git:
  branch: <string>
  dirty: true|false
  ahead: <int>
  behind: <int>
  upstream: <string|null>
  last_commit_date: YYYY-MM-DD
  last_commit_sha: <short sha>
  last_commit_author: <string>
```

### 5.2 Stack detection (offline)
```yaml
stack:
  languages: [ ... ]           # from file heuristics
  frameworks: [ ... ]          # from config files
  package_managers: [npm|pnpm|pip|poetry|uv|cargo|...]
  entrypoints: [ ... ]         # inferred (package.json scripts, etc.)
```

### 5.3 GitHub signals (online)
```yaml
github:
  remote: <owner/repo>
  default_branch: <string>
  archived: true|false
  open_prs: <int>
  open_issues: <int>
  last_workflow_status: success|failure|neutral|unknown
  last_workflow_at: YYYY-MM-DD
deploy:
  provider: github-pages|cloudflare|vercel|unknown
  last_deploy_status: success|failure|unknown
  last_deploy_at: YYYY-MM-DD
```

---

## 6. Dashboard UX Spec

### 6.1 Primary dashboard views (V1)

**A) All Projects Table**
- Columns:
  - Repo (click opens project detail)
  - Status (editable)
  - Priority (editable)
  - Progress (editable, slider)
  - Deployed (toggle)
  - Dirty (badge)
  - Branch
  - Ahead/Behind
  - Last commit age
  - CI status (badge)
  - Deploy status (badge)
  - Next action (editable inline)
  - Launch buttons (Terminal / Editor / Dev)

**B) Triage View (filters presets)**
- “Half‑finished”
- “Stale (>30d since last commit)”
- “Dirty (uncommitted changes)”
- “CI red”
- “Not deployed”
- “Ready to ship” (progress ≥ 0.8 AND CI green AND not dirty)

**C) Project Detail**
- Top: key flags (status/priority/progress/deployed/blocker/next_action)
- Middle: truth panel (git/stack/github signals)
- Bottom: markdown preview of the Obsidian note (read‑only) + “Open in Obsidian” button
- “Resume Work” actions:
  - Open terminal here
  - Open VS Code here
  - Run dev
  - Run tests
  - Open GitHub repo page
  - Open deployed URL (if exists)

### 6.2 Inline editing behavior
- Edits apply instantly to YAML frontmatter (with debounced writes).
- “Undo” stack for last N edits.
- Never modify body sections unless a “manage template sections” toggle is enabled.

### 6.3 Launch behavior (Windows 11)
- Commands are stored per repo in `launch.*`.
- Clicking a launch action executes the command locally.
- Recommended support:
  - Windows Terminal (`wt -d "<path>"`)
  - VS Code (`code "<path>"`)
  - Browser open (`start <url>`)
  - Custom command for “Claude Code” (user‑configurable global command template)

---

## 7. Integration With Obsidian

### 7.1 Obsidian remains canonical for writing
- PaCoTo:
  - opens notes via `obsidian://open?vault=<VaultName>&file=projects/<repo>`
  - optionally uses your existing tagging & links (`[[BJJ]]`, etc.). fileciteturn0file0L30-L44

### 7.2 Dataview compatibility (optional but recommended)
- If you use Dataview, PaCoTo’s YAML choices must remain Dataview‑friendly.
- PaCoTo can ship example dashboard notes you can paste into Obsidian.

### 7.3 Generated data usage in Obsidian (optional)
Two strategies:
1) **PaCoTo only** reads generated YAML; Obsidian doesn’t need it.
2) **Obsidian also reads generated YAML** via Dataview (advanced):
   - store a copy of key truth fields in the frontmatter (synced), or
   - embed generated snippets into the note body (disabled by default).

---

## 8. Architecture (Implementation Plan)

### 8.1 Components
**A) Repo Scanner (local)**
- Walk directories under `ProjectsRoot`
- Identify git repos
- Run git commands to collect facts
- Detect stack via file heuristics
- Output `generated/<repo>.yml`

**B) GitHub Sync (online)**
- Uses GitHub API with a PAT (classic fine‑grained token)
- Rate‑limit safe, cached responses
- Updates `generated/<repo>.yml` sections

**C) PaCoTo UI App**
- Reads:
  - `projects/*.md` (YAML + maybe body preview)
  - `generated/*.yml`
- Writes:
  - YAML frontmatter updates into `projects/*.md`
- Executes launch commands

### 8.2 Suggested tech stack
- **Desktop app**: Tauri + TypeScript (fast, local, small) or Electron if you want maximum plugin ecosystem.
- **Backend**: Rust (Tauri) or Node/TS (Electron) or Python if you prefer quick iteration.
- **Data**: YAML/JSON files in vault (no database required in V1).

### 8.3 Security
- GitHub token stored locally (OS keychain if possible).
- Launch commands are executed locally: mitigate risk by:
  - only allowing commands from notes you own
  - optionally requiring “first run confirmation” per repo command

---

## 9. Feature Roadmap

### 9.1 V1 (MVP)
- Scan local repos; generate truth files
- Read Obsidian project notes
- Table dashboard + filters
- Inline edit flags in YAML
- One‑click terminal/editor/dev launches
- Open note in Obsidian
- GitHub sync: last workflow status + open PR/issues

### 9.2 V2 Features (from your earlier riffs)
**A) “Stuck reasons” taxonomy**
- Field: `stuck_reason: decision|dependency|build-broken|unclear-ux|motivation|waiting`
- Dashboard filter by stuck reason

**B) Auto‑suggest next action**
Examples:
- dirty → “commit or stash”
- behind → “pull/rebase”
- CI failing → “open last failed run”
- no upstream → “set upstream branch”

**C) Snapshot / Pause mode**
- Button: “Pause Project”
- Prompts: what I was doing, next step, commands run
- Appends to `## Log` with timestamp

**D) Ship‑or‑Shelve weekly view**
- A dedicated view that surfaces “stale + low progress” and forces a decision:
  - promote to active
  - park
  - archive
  - define next action

**E) Staleness heatmap**
- Visual: days since last commit (truth) vs days since last_touched (intent)
- Explicit “intentionally parked” whitelist

**F) Stack lens**
- Filter projects by detected stack (Next.js, Python, ComfyUI nodes, Cloudflare, etc.)

**G) Multi‑root support**
- Multiple project roots + tags

---

## 10. Best Practices (Operational)

### 10.1 Keep YAML small
- YAML is for fields that appear in dashboards and filters.
- Everything else belongs in Markdown body.

### 10.2 Enforce “One‑Line Next Action”
A project is considered “alive” only if `next_action` is non‑empty and concrete.

### 10.3 Separate “deployed” from “status”
A project can be:
- deployed but unfinished
- finished but not deployed
- deployed but broken

### 10.4 Controlled vocabulary
Do not invent random statuses. Keep the set small and stable.

### 10.5 Never overwrite narrative
PaCoTo should never destroy your logs or prose. Frontmatter edits only.

---

## 11. Acceptance Criteria (V1)

- Given a projects root, PaCoTo discovers repos and lists them in a dashboard.
- Clicking a repo shows:
  - YAML flags (editable)
  - git truth (branch, dirty, ahead/behind, last commit)
  - GitHub truth (CI status at minimum)
  - Markdown note preview
- “Open Terminal” launches Windows Terminal in the repo folder.
- “Open in Obsidian” opens the corresponding note.
- Edits persist in the `.md` file and remain readable by Obsidian.

---

## 12. Next Implementation Steps (concrete)

1) Create vault folder layout (`_vault/projects`, `_vault/generated`, `_vault/templates`).
2) Create `project_template.md` mirroring your current style. fileciteturn0file0L30-L44
3) Implement repo scanner (list repos + git status + stack heuristics).
4) Implement UI table + filters.
5) Implement YAML frontmatter edit/write.
6) Implement launcher execution.
7) Add GitHub sync for CI status.

---
