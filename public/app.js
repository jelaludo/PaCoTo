/* PaCoTo — frontend (vanilla JS, no framework) */

let allProjects = [];
let activeFilter = 'all';
let openSlug = null;

const LAUNCH_TIPS = {
  editor:   'Open this project in VS Code',
  terminal: "Open Windows Terminal at this project's local folder",
  dev:      'Start the local development server',
  cli:      'Run the PaCoTo CLI dashboard in a terminal',
  backend:  'Start the API / backend server (run in a second terminal)',
};

const INFO_TIPS = {
  'repo':         'GitHub repository (owner/name)',
  'url':          'Live deployment URL',
  'branch':       'Currently active git branch',
  'ahead/behind': 'Commits unpushed (↑) / commits to pull (↓)',
  'last commit':  'SHA and message of the most recent git commit',
  'last_touched': 'Date last worked on — from your Obsidian note',
  'environment':  'Hosting platform or runtime (cloudflare, github-pages, local…)',
  'complexity':   'Relative complexity estimate',
  'deployed':     'Whether a live version is publicly accessible',
};

// ── Boot ──────────────────────────────────────────────────────────────────────
load();
document.getElementById('reload-btn').addEventListener('click', load);
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') load();
});
document.querySelectorAll('.filter-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    activeFilter = btn.dataset.filter;
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.toggle('active', b === btn));
    render();
  });
});

// ── Data ──────────────────────────────────────────────────────────────────────
async function load() {
  setStatus('scanning vault + git…');
  try {
    const res = await fetch('/api/projects');
    if (!res.ok) throw new Error(await res.text());
    allProjects = await res.json();
    setStatus(`${allProjects.length} projects — vault scanned`, false);
    render();
  } catch (e) {
    setStatus('error: ' + e.message, true);
  }
}

function filtered() {
  if (activeFilter === 'all')      return allProjects;
  if (activeFilter === 'dirty')    return allProjects.filter(p => p.gitStatus?.dirty);
  if (activeFilter === 'active')   return allProjects.filter(p => p.status === 'active');
  if (activeFilter === 'deployed') return allProjects.filter(p => p.status === 'deployed');
  if (activeFilter === 'parked')   return allProjects.filter(p => p.status === 'parked');
  return allProjects;
}

// ── Render ────────────────────────────────────────────────────────────────────
function render() {
  const tbody = document.getElementById('projects-body');
  tbody.innerHTML = '';

  for (const p of filtered()) {
    // Main row
    const row = document.createElement('tr');
    row.className = 'project-row' + (openSlug === p.noteName ? ' open' : '');
    row.dataset.slug = p.noteName;

    const g = p.gitStatus;
    const dirtyDot  = g?.dirty  ? '<span class="dot yellow" data-tooltip="Uncommitted local changes — working tree differs from the last git commit">•</span>' : '';
    const aheadHtml = g?.ahead  > 0 ? `<span class="green" data-tooltip="${g.ahead} local commit(s) not yet pushed to GitHub">↑${g.ahead}</span>` : '';
    const behindHtml= g?.behind > 0 ? `<span class="red" data-tooltip="${g.behind} remote commit(s) not yet pulled to this machine">↓${g.behind}</span>` : '';

    row.innerHTML = `
      <td><span class="repo-name">${repoLabel(p)}</span></td>
      <td><span class="${statusClass(p.status)}">${p.status}</span></td>
      <td><span class="${priorityClass(p.priority)}">${p.priority}</span></td>
      <td class="cyan">${bar(p.progress)}</td>
      <td>${dirtyDot}${aheadHtml}${behindHtml}</td>
      <td class="muted">${p.area}</td>
      <td>${esc(p.next_action || '—')}</td>
    `;
    row.addEventListener('click', () => toggle(p));
    tbody.appendChild(row);

    // Detail row (if open)
    if (openSlug === p.noteName) {
      const dr = document.createElement('tr');
      dr.className = 'detail-row';
      dr.innerHTML = `<td colspan="7">${detailHTML(p)}</td>`;
      tbody.appendChild(dr);
      attachListeners(dr, p);
    }
  }
}

function toggle(p) {
  openSlug = openSlug === p.noteName ? null : p.noteName;
  render();
}

// ── Detail panel HTML ─────────────────────────────────────────────────────────
function detailHTML(p) {
  const g = p.gitStatus;
  const launch = p.launch || {};

  const infoRows = [
    ['repo',        p.repo],
    ['url',         p.url  ? `<a href="${p.url}" target="_blank">${p.url} ↗</a>` : '—'],
    ['branch',      g ? `${g.branch}${g.dirty ? ' <span class="yellow">• dirty</span>' : ''}` : '—'],
    ['ahead/behind',g ? `<span class="green">↑${g.ahead}</span> <span class="red">↓${g.behind}</span>` : '—'],
    ['last commit', g?.lastCommit ? `<span class="muted">${g.lastCommit.sha}</span> ${esc(g.lastCommit.message)}` : '—'],
    ['last_touched',p.last_touched || '—'],
    ['environment', p.environment || '—'],
    ['complexity',  p.complexity  || '—'],
    ['deployed',    p.deployed ? '<span class="green">yes</span>' : '<span class="dim">no</span>'],
  ].map(([k, v]) => `
    <div class="detail-field">
      <span class="field-key"${INFO_TIPS[k] ? ` data-tooltip="${esc(INFO_TIPS[k])}"` : ''}>${k}</span>
      <span class="field-val">${v}</span>
    </div>`).join('');

  const milestoneTarget = p.milestone_target
    ? `<input type="date" class="edit-input" data-field="milestone_target" value="${p.milestone_target}">`
    : `<input type="date" class="edit-input" data-field="milestone_target" value="">`;

  const editRows = `
    <div class="detail-field">
      <span class="field-key">status</span>
      <select class="edit-input" data-field="status">
        ${['idea','active','half-finished','deployed','parked','archived']
          .map(s => `<option${p.status===s?' selected':''}>${s}</option>`).join('')}
      </select>
    </div>
    <div class="detail-field">
      <span class="field-key">priority</span>
      <select class="edit-input" data-field="priority">
        ${['P0','P1','P2','P3']
          .map(pr => `<option${p.priority===pr?' selected':''}>${pr}</option>`).join('')}
      </select>
    </div>
    <div class="detail-field">
      <span class="field-key">progress</span>
      <span class="progress-control">
        <input type="range" class="edit-input" data-field="progress"
               min="0" max="1" step="0.05" value="${p.progress}">
        <span class="progress-val cyan" id="pval-${p.noteName}">${bar(p.progress)} ${pct(p.progress)}</span>
      </span>
    </div>
    <div class="detail-field">
      <span class="field-key">next_action</span>
      <input type="text" class="edit-input" data-field="next_action"
             value="${esc(p.next_action || '')}">
    </div>
    <div class="detail-field">
      <span class="field-key">milestone</span>
      <input type="text" class="edit-input" data-field="milestone"
             value="${esc(p.milestone || '')}">
    </div>
    <div class="detail-field">
      <span class="field-key">target date</span>
      ${milestoneTarget}
    </div>
    <div class="detail-field">
      <span class="field-key">milestone_done</span>
      <input type="checkbox" class="edit-input" data-field="milestone_done"
             ${p.milestone_done ? 'checked' : ''}>
    </div>
    <div class="save-status" id="save-${p.noteName}"></div>
  `;

  const launchBtns = Object.entries(launch)
    .map(([k, cmd]) => {
      const cmdStr = String(cmd);
      const isLauncher = /^(wt|code)\b/i.test(cmdStr.trim());
      const location = (!isLauncher && p.path) ? `\nin: ${p.path}` : '';
      const desc = LAUNCH_TIPS[k] ? `\n(${LAUNCH_TIPS[k]})` : '';
      const tip = `→ ${cmdStr}${location}${desc}`;
      return `<button class="launch-btn" data-cmd="${esc(cmdStr)}" data-tooltip="${esc(tip)}">${k}</button>`;
    })
    .join('');

  return `
    <div class="detail-panel">
      <div class="detail-section">
        <div class="section-header pink">Info</div>
        ${infoRows}
      </div>
      <div class="detail-section">
        <div class="section-header pink">Edit</div>
        ${editRows}
      </div>
      <div class="detail-section">
        <div class="section-header pink">Launch</div>
        <div class="launch-buttons">${launchBtns || '<span class="dim">no launch commands</span>'}</div>
      </div>
    </div>
  `;
}

// ── Event listeners for detail panel ─────────────────────────────────────────
function attachListeners(detailRow, p) {
  // Editable fields
  detailRow.querySelectorAll('.edit-input').forEach(input => {
    const field = input.dataset.field;

    const handler = async () => {
      let value;
      if      (input.type === 'checkbox') value = input.checked;
      else if (input.type === 'range')    value = parseFloat(input.value);
      else                                value = input.value;

      // Live progress display update
      if (field === 'progress') {
        const disp = document.getElementById(`pval-${p.noteName}`);
        if (disp) disp.textContent = `${bar(value)} ${pct(value)}`;
      }

      await save(p, field, value);
    };

    if      (input.type === 'range')    input.addEventListener('change', handler);
    else if (input.type === 'checkbox') input.addEventListener('change', handler);
    else {
      input.addEventListener('blur', handler);
      input.addEventListener('keydown', e => { if (e.key === 'Enter') input.blur(); });
    }
  });

  // Launch buttons
  detailRow.querySelectorAll('.launch-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      const orig = btn.textContent;
      btn.disabled = true;
      btn.textContent = '…';
      try {
        const res = await fetch('/api/launch', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ command: btn.dataset.cmd, cwd: p.path }),
        });
        const data = await res.json();
        if (data.error) throw new Error(data.error);
        btn.textContent = '✓';
      } catch (e) {
        btn.textContent = '!';
      }
      setTimeout(() => { btn.textContent = orig; btn.disabled = false; }, 1800);
    });
  });
}

// ── Save ──────────────────────────────────────────────────────────────────────
async function save(p, field, value) {
  const statusEl = document.getElementById(`save-${p.noteName}`);
  try {
    const res = await fetch(`/api/projects/${encodeURIComponent(p.noteName)}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ [field]: value }),
    });
    if (!res.ok) throw new Error(await res.text());

    // Update in-memory project
    p[field] = value;

    // Update the main row cell directly (no full re-render = no focus loss)
    updateRow(p);

    flash(statusEl, `${field} saved ✓`, 'green');
  } catch (e) {
    flash(statusEl, `error: ${e.message}`, 'red');
  }
}

function updateRow(p) {
  const row = document.querySelector(`tr.project-row[data-slug="${p.noteName}"]`);
  if (!row) return;
  row.cells[1].innerHTML = `<span class="${statusClass(p.status)}">${p.status}</span>`;
  row.cells[2].innerHTML = `<span class="${priorityClass(p.priority)}">${p.priority}</span>`;
  row.cells[3].innerHTML = `<span class="cyan">${bar(p.progress)}</span>`;
  row.cells[6].textContent = p.next_action || '—';
}

// ── Utils ─────────────────────────────────────────────────────────────────────
function setStatus(msg, isError = false) {
  const el = document.getElementById('status-bar');
  el.textContent = msg;
  el.className = isError ? 'error' : '';
}

function flash(el, msg, cls) {
  if (!el) return;
  el.textContent = msg;
  el.className = `save-status ${cls}`;
  setTimeout(() => { el.textContent = ''; el.className = 'save-status'; }, 2500);
}

function bar(v, w = 6) {
  const f = Math.round(Math.min(1, Math.max(0, v)) * w);
  return '█'.repeat(f) + '░'.repeat(w - f);
}

function pct(v) { return Math.round(v * 100) + '%'; }

function repoLabel(p) {
  if (p.repo === 'none') return p.noteName;
  return p.repo.split('/').pop() || p.noteName;
}

function statusClass(s) {
  if (s === 'active' || s === 'deployed') return 'green';
  if (s === 'half-finished')              return 'yellow';
  if (s === 'idea')                       return 'cyan';
  return 'dim';
}

function priorityClass(p) {
  if (p === 'P0') return 'red';
  if (p === 'P1') return 'yellow';
  if (p === 'P3') return 'dim';
  return '';
}

function esc(s) {
  return String(s)
    .replace(/&/g,'&amp;')
    .replace(/</g,'&lt;')
    .replace(/>/g,'&gt;')
    .replace(/"/g,'&quot;');
}
