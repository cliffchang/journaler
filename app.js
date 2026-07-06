import { CORES, coreByKey } from './emotions.js';
import {
  addEntry,
  updateEntry,
  deleteEntry,
  getAllEntries,
  exportJson,
  exportCsv,
} from './db.js';

// --- Draft state for the entry being composed ---
let draft = { emotions: [], intensity: null };
let currentCore = null;

const $ = (id) => document.getElementById(id);

function showScreen(id) {
  document.querySelectorAll('.screen').forEach((s) => s.classList.toggle('active', s.id === id));
  window.scrollTo(0, 0);
}

function resetDraft() {
  draft = { emotions: [], intensity: null };
  currentCore = null;
  $('comment-input').value = '';
  document.querySelectorAll('.intensity-btn').forEach((b) => b.classList.remove('selected'));
}

// --- Screen 1: core grid ---
function renderCoreGrid() {
  const grid = $('core-grid');
  grid.innerHTML = '';
  for (const core of CORES) {
    const btn = document.createElement('button');
    btn.className = 'core-btn';
    btn.textContent = core.label;
    btn.style.background = core.color;
    btn.addEventListener('click', () => {
      currentCore = core;
      renderSpecifics();
      showScreen('screen-specifics');
    });
    grid.appendChild(btn);
  }
}

// --- Screen 2: specifics ---
function isSelected(core, specific) {
  return draft.emotions.some((e) => e.core === core && e.specific === specific);
}

function renderSpecifics() {
  $('specifics-title').textContent = currentCore.label;
  const grid = $('specifics-grid');
  grid.innerHTML = '';
  for (const specific of currentCore.specifics) {
    const chip = document.createElement('button');
    chip.className = 'chip';
    chip.textContent = specific;
    chip.style.setProperty('--chip-color', currentCore.color);
    chip.classList.toggle('selected', isSelected(currentCore.key, specific));
    chip.addEventListener('click', () => {
      const idx = draft.emotions.findIndex(
        (e) => e.core === currentCore.key && e.specific === specific
      );
      if (idx >= 0) draft.emotions.splice(idx, 1);
      else draft.emotions.push({ core: currentCore.key, specific });
      chip.classList.toggle('selected');
      updateSelectionSummary();
    });
    grid.appendChild(chip);
  }
  updateSelectionSummary();
}

function selectionText() {
  return draft.emotions.map((e) => e.specific).join(', ');
}

function updateSelectionSummary() {
  $('selection-summary').textContent = draft.emotions.length
    ? `Selected: ${selectionText()}`
    : '';
  $('specifics-next').disabled = draft.emotions.length === 0;
}

// --- Screen 3: details ---
function renderIntensityRow() {
  const row = $('intensity-row');
  row.innerHTML = '';
  for (let i = 1; i <= 5; i++) {
    const btn = document.createElement('button');
    btn.className = 'intensity-btn';
    btn.textContent = i;
    btn.addEventListener('click', () => {
      const wasSelected = btn.classList.contains('selected');
      row.querySelectorAll('.intensity-btn').forEach((b) => b.classList.remove('selected'));
      draft.intensity = wasSelected ? null : i;
      if (!wasSelected) btn.classList.add('selected');
    });
    row.appendChild(btn);
  }
}

function toast(msg) {
  const el = $('toast');
  el.textContent = msg;
  el.hidden = false;
  // restart animation
  el.style.animation = 'none';
  void el.offsetWidth;
  el.style.animation = '';
  setTimeout(() => (el.hidden = true), 1400);
}

async function save() {
  const comment = $('comment-input').value.trim();
  await addEntry({
    id: crypto.randomUUID(),
    timestamp: new Date().toISOString(),
    emotions: draft.emotions,
    intensity: draft.intensity,
    comment: comment || null,
  });
  resetDraft();
  showScreen('screen-home');
  toast('Logged ✓');
}

// --- History ---
function fmtTime(iso) {
  return new Date(iso).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

function fmtDay(iso) {
  const d = new Date(iso);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return 'Today';
  if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return d.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });
}

function entryChips(entry) {
  const wrap = document.createElement('div');
  wrap.className = 'entry-chips';
  for (const e of entry.emotions) {
    const chip = document.createElement('span');
    chip.className = 'entry-chip';
    chip.textContent = e.specific;
    chip.style.background = coreByKey[e.core]?.color ?? 'var(--accent)';
    wrap.appendChild(chip);
  }
  return wrap;
}

async function renderHistory() {
  const list = $('history-list');
  list.innerHTML = '';
  const entries = await getAllEntries();
  if (!entries.length) {
    const p = document.createElement('p');
    p.className = 'empty-note';
    p.textContent = 'No entries yet.';
    list.appendChild(p);
    return;
  }
  let lastDay = null;
  for (const entry of entries) {
    const day = fmtDay(entry.timestamp);
    if (day !== lastDay) {
      const h = document.createElement('div');
      h.className = 'day-header';
      h.textContent = day;
      list.appendChild(h);
      lastDay = day;
    }
    list.appendChild(entryCard(entry));
  }
}

function entryCard(entry) {
  const card = document.createElement('div');
  card.className = 'entry-card';

  const time = document.createElement('div');
  time.className = 'entry-time';
  const t = document.createElement('span');
  t.textContent = fmtTime(entry.timestamp);
  time.appendChild(t);
  if (entry.intensity) {
    const i = document.createElement('span');
    i.textContent = `intensity ${entry.intensity}/5`;
    time.appendChild(i);
  }
  card.appendChild(time);
  card.appendChild(entryChips(entry));

  if (entry.comment) {
    const c = document.createElement('div');
    c.className = 'entry-comment';
    c.textContent = entry.comment;
    card.appendChild(c);
  }

  card.addEventListener('click', () => openEditor(card, entry), { once: true });
  return card;
}

function openEditor(card, entry) {
  const editor = document.createElement('div');
  editor.className = 'entry-edit';

  const intensityRow = document.createElement('div');
  intensityRow.className = 'intensity-row';
  let editIntensity = entry.intensity ?? null;
  for (let i = 1; i <= 5; i++) {
    const btn = document.createElement('button');
    btn.className = 'intensity-btn';
    btn.textContent = i;
    btn.classList.toggle('selected', editIntensity === i);
    btn.addEventListener('click', (ev) => {
      ev.stopPropagation();
      const wasSelected = btn.classList.contains('selected');
      intensityRow.querySelectorAll('.intensity-btn').forEach((b) => b.classList.remove('selected'));
      editIntensity = wasSelected ? null : i;
      if (!wasSelected) btn.classList.add('selected');
    });
    intensityRow.appendChild(btn);
  }

  const textarea = document.createElement('textarea');
  textarea.rows = 3;
  textarea.placeholder = 'Add a comment…';
  textarea.value = entry.comment ?? '';
  textarea.addEventListener('click', (ev) => ev.stopPropagation());

  const actions = document.createElement('div');
  actions.className = 'entry-edit-actions';

  const saveBtn = document.createElement('button');
  saveBtn.className = 'primary-btn';
  saveBtn.textContent = 'Save';
  saveBtn.addEventListener('click', async (ev) => {
    ev.stopPropagation();
    const comment = textarea.value.trim();
    await updateEntry({ ...entry, intensity: editIntensity, comment: comment || null });
    renderHistory();
  });

  const deleteBtn = document.createElement('button');
  deleteBtn.className = 'danger-btn';
  deleteBtn.textContent = 'Delete';
  deleteBtn.addEventListener('click', async (ev) => {
    ev.stopPropagation();
    if (confirm('Delete this entry?')) {
      await deleteEntry(entry.id);
      renderHistory();
    }
  });

  actions.appendChild(saveBtn);
  actions.appendChild(deleteBtn);
  editor.appendChild(intensityRow);
  editor.appendChild(textarea);
  editor.appendChild(actions);
  card.appendChild(editor);
}

// --- Wiring ---
$('btn-history').addEventListener('click', () => {
  renderHistory();
  showScreen('screen-history');
});
$('btn-export').addEventListener('click', () => showScreen('screen-export'));
$('specifics-back').addEventListener('click', () => showScreen('screen-home'));
$('specifics-next').addEventListener('click', () => {
  $('details-summary').textContent = selectionText();
  showScreen('screen-details');
});
$('details-back').addEventListener('click', () => {
  renderSpecifics();
  showScreen('screen-specifics');
});
$('save-btn').addEventListener('click', save);
$('history-back').addEventListener('click', () => showScreen('screen-home'));
$('export-back').addEventListener('click', () => showScreen('screen-home'));
$('export-json').addEventListener('click', exportJson);
$('export-csv').addEventListener('click', exportCsv);

renderCoreGrid();
renderIntensityRow();

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('sw.js');
}
