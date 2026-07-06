const DB_NAME = 'emotion-log';
const STORE = 'entries';

let dbPromise = null;

function openDb() {
  if (!dbPromise) {
    dbPromise = new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, 1);
      req.onupgradeneeded = () => {
        req.result.createObjectStore(STORE, { keyPath: 'id' });
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }
  return dbPromise;
}

function tx(mode, fn) {
  return openDb().then(
    (db) =>
      new Promise((resolve, reject) => {
        const t = db.transaction(STORE, mode);
        const store = t.objectStore(STORE);
        const req = fn(store);
        t.oncomplete = () => resolve(req && req.result);
        t.onerror = () => reject(t.error);
      })
  );
}

export function addEntry(entry) {
  return tx('readwrite', (s) => s.add(entry));
}

export function updateEntry(entry) {
  return tx('readwrite', (s) => s.put(entry));
}

export function deleteEntry(id) {
  return tx('readwrite', (s) => s.delete(id));
}

export async function getAllEntries() {
  const entries = await tx('readonly', (s) => s.getAll());
  return entries.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
}

function download(filename, text, type) {
  const blob = new Blob([text], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function stamp() {
  return new Date().toISOString().slice(0, 10);
}

export async function exportJson() {
  const entries = await getAllEntries();
  download(`emotion-log-${stamp()}.json`, JSON.stringify(entries, null, 2), 'application/json');
}

function csvField(value) {
  const s = String(value ?? '');
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export async function exportCsv() {
  const entries = await getAllEntries();
  const rows = [['timestamp', 'emotions', 'intensities', 'comment']];
  for (const e of entries) {
    // GEW entries: {family, intensity}. Legacy entries: {core, specific}
    // with a single entry-level intensity.
    const names = e.emotions.map((em) => em.family ?? em.specific);
    const intensities = e.emotions.map((em) =>
      em.family ? (em.intensity ?? '') : (e.intensity ?? '')
    );
    rows.push([
      e.timestamp,
      names.join(';'),
      intensities.join(';'),
      e.comment ?? '',
    ]);
  }
  const csv = rows.map((r) => r.map(csvField).join(',')).join('\n');
  download(`emotion-log-${stamp()}.csv`, csv, 'text/csv');
}
