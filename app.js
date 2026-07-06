import {
  POSITIVE,
  NEGATIVE,
  familyByKey,
  familyColor,
  LEGACY_CORE_COLORS,
} from './emotions.js';
import {
  addEntry,
  updateEntry,
  deleteEntry,
  getAllEntries,
  exportJson,
  exportCsv,
} from './db.js';

// Draft entry being composed: map of family key -> intensity (null until rated)
let draft = new Map();

const $ = (id) => document.getElementById(id);

function showScreen(id) {
  document.querySelectorAll('.screen').forEach((s) => s.classList.toggle('active', s.id === id));
  window.scrollTo(0, 0);
}

function resetDraft() {
  draft = new Map();
  $('comment-input').value = '';
  document.querySelectorAll('.family-btn.selected').forEach((b) => b.classList.remove('selected'));
  $('home-next').disabled = true;
}

// --- Screen 1: family grid ---
function renderFamilyColumn(colId, families) {
  const col = $(colId);
  col.innerHTML = '';
  for (const family of families) {
    const btn = document.createElement('button');
    btn.className = 'family-btn';
    btn.textContent = family.label;
    btn.dataset.key = family.key;
    btn.style.setProperty('--family-color', familyColor(family.key));
    btn.addEventListener('click', () => {
      if (draft.has(family.key)) draft.delete(family.key);
      else draft.set(family.key, null);
      btn.classList.toggle('selected', draft.has(family.key));
      $('home-next').disabled = draft.size === 0;
    });
    col.appendChild(btn);
  }
}

// --- Screen 2: per-emotion intensity + comment ---
function renderIntensityList() {
  const list = $('intensity-list');
  list.innerHTML = '';
  for (const key of draft.keys()) {
    const row = document.createElement('div');
    row.className = 'intensity-item';

    const label = document.createElement('span');
    label.className = 'intensity-label';
    label.textContent = familyByKey[key].label;
    label.style.color = familyColor(key);
    row.appendChild(label);

    const btns = document.createElement('div');
    btns.className = 'intensity-row';
    for (let i = 1; i <= 5; i++) {
      const btn = document.createElement('button');
      btn.className = 'intensity-btn';
      btn.textContent = i;
      btn.addEventListener('click', () => {
        const wasSelected = btn.classList.contains('selected');
        btns.querySelectorAll('.intensity-btn').forEach((b) => b.classList.remove('selected'));
        draft.set(key, wasSelected ? null : i);
        if (!wasSelected) btn.classList.add('selected');
      });
      btns.appendChild(btn);
    }
    row.appendChild(btns);
    list.appendChild(row);
  }
}

function toast(msg) {
  const el = $('toast');
  el.textContent = msg;
  el.hidden = false;
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
    emotions: [...draft].map(([family, intensity]) => ({ family, intensity })),
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

// Handles both GEW entries ({family, intensity}) and legacy Willcox-era
// entries ({core, specific} with a single entry-level intensity).
function emotionChipData(entry) {
  return entry.emotions.map((e) => {
    if (e.family) {
      return {
        text: e.intensity ? `${familyByKey[e.family]?.label ?? e.family} ${e.intensity}` : (familyByKey[e.family]?.label ?? e.family),
        color: familyColor(e.family),
      };
    }
    return {
      text: entry.intensity ? `${e.specific} ${entry.intensity}` : e.specific,
      color: LEGACY_CORE_COLORS[e.core] ?? '#888',
    };
  });
}

function entryChips(entry) {
  const wrap = document.createElement('div');
  wrap.className = 'entry-chips';
  for (const { text, color } of emotionChipData(entry)) {
    const chip = document.createElement('span');
    chip.className = 'entry-chip';
    chip.textContent = text;
    chip.style.background = color;
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
  editor.addEventListener('click', (ev) => ev.stopPropagation());

  // Per-emotion intensity editing (GEW entries only; legacy entries keep
  // their stored shape and just get comment/delete).
  const edited = entry.emotions.map((e) => ({ ...e }));
  if (edited.every((e) => e.family)) {
    for (const e of edited) {
      const row = document.createElement('div');
      row.className = 'intensity-item';
      const label = document.createElement('span');
      label.className = 'intensity-label';
      label.textContent = familyByKey[e.family]?.label ?? e.family;
      label.style.color = familyColor(e.family);
      row.appendChild(label);
      const btns = document.createElement('div');
      btns.className = 'intensity-row';
      for (let i = 1; i <= 5; i++) {
        const btn = document.createElement('button');
        btn.className = 'intensity-btn';
        btn.textContent = i;
        btn.classList.toggle('selected', e.intensity === i);
        btn.addEventListener('click', () => {
          const wasSelected = btn.classList.contains('selected');
          btns.querySelectorAll('.intensity-btn').forEach((b) => b.classList.remove('selected'));
          e.intensity = wasSelected ? null : i;
          if (!wasSelected) btn.classList.add('selected');
        });
        btns.appendChild(btn);
      }
      row.appendChild(btns);
      editor.appendChild(row);
    }
  }

  const textarea = document.createElement('textarea');
  textarea.rows = 3;
  textarea.placeholder = 'Add a comment…';
  textarea.value = entry.comment ?? '';

  const actions = document.createElement('div');
  actions.className = 'entry-edit-actions';

  const saveBtn = document.createElement('button');
  saveBtn.className = 'primary-btn';
  saveBtn.textContent = 'Save';
  saveBtn.addEventListener('click', async () => {
    const comment = textarea.value.trim();
    await updateEntry({ ...entry, emotions: edited, comment: comment || null });
    renderHistory();
  });

  const deleteBtn = document.createElement('button');
  deleteBtn.className = 'danger-btn';
  deleteBtn.textContent = 'Delete';
  deleteBtn.addEventListener('click', async () => {
    if (confirm('Delete this entry?')) {
      await deleteEntry(entry.id);
      renderHistory();
    }
  });

  actions.appendChild(saveBtn);
  actions.appendChild(deleteBtn);
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
$('home-next').addEventListener('click', () => {
  renderIntensityList();
  showScreen('screen-details');
});
$('details-back').addEventListener('click', () => showScreen('screen-home'));
$('save-btn').addEventListener('click', save);
$('history-back').addEventListener('click', () => showScreen('screen-home'));
$('export-back').addEventListener('click', () => showScreen('screen-home'));
$('export-json').addEventListener('click', exportJson);
$('export-csv').addEventListener('click', exportCsv);

renderFamilyColumn('col-positive', POSITIVE);
renderFamilyColumn('col-negative', NEGATIVE);

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('sw.js');
}
