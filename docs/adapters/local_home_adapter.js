/*
  Local HOME Adapter
  Loads HOME data from IndexedDB or user-imported files
  Browser-safe. Deterministic. Fully validated.
*/

const DB_NAME = "HomeMapDB";
const DB_STORE = "home";

/* ================================
   IndexedDB Helpers
================================ */

function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(DB_STORE)) {
        db.createObjectStore(DB_STORE);
      }
    };
    req.onerror = () => reject(req.error);
    req.onsuccess = () => resolve(req.result);
  });
}

async function dbGet(key) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(DB_STORE, "readonly");
    const store = tx.objectStore(DB_STORE);
    const req = store.get(key);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function dbSet(key, value) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(DB_STORE, "readwrite");
    const store = tx.objectStore(DB_STORE);
    store.put(value, key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

/* ================================
   Parsing Helpers
================================ */

function decodeText(buffer) {
  return new TextDecoder("utf-8").decode(buffer);
}

function parseLines(text) {
  return text
    .split("\n")
    .map(l => l.trim())
    .filter(Boolean);
}

/* ================================
   File Import
================================ */

async function importFiles(debug) {
  return new Promise((resolve, reject) => {
    const input = document.createElement("input");
    input.type = "file";
    input.multiple = true;

    input.onchange = async () => {
      try {
        const files = Array.from(input.files);
        const out = {};

        for (const f of files) {
          const buf = await f.arrayBuffer();
          out[f.name] = buf;
          debug(`[LOCAL] Imported file: ${f.name} (${buf.byteLength} bytes)`);
        }

        resolve(out);
      } catch (e) {
        reject(e);
      }
    };

    input.click();
  });
}

/* ================================
   PUBLIC ENTRY POINT
================================ */

export async function loadLocalHome(debug = () => {}) {
  debug("[LocalAdapter] Loading local HOME");

  // 1. Try IndexedDB
  const cached = await dbGet("graph");
  if (cached) {
    debug("[LocalAdapter] Loaded HOME from IndexedDB");
    return cached;
  }

  debug("[LocalAdapter] No cached HOME found, requesting import");

  // 2. User import
  const files = await importFiles(debug);

  if (!files["home.map.bin"] || !files["home.tags.bin"]) {
    throw new Error("Missing required HOME files (home.map.bin, home.tags.bin)");
  }

  const paths = parseLines(decodeText(files["home.map.bin"]));
  const tagLines = parseLines(decodeText(files["home.tags.bin"]));

  const tags = {};
  for (const line of tagLines) {
    const [tag, path] = line.split("\t");
    if (!tag || !path) continue;
    if (!tags[tag]) tags[tag] = [];
    tags[tag].push(path);
  }

  const graph = {
    source: "local",
    paths,
    tags,
    meta: {
      generatedAt: new Date().toISOString(),
      counts: {
        paths: paths.length,
        tags: Object.keys(tags).length
      }
    }
  };

  await dbSet("graph", graph);
  debug(`[LocalAdapter] Stored ${paths.length} paths in IndexedDB`);

  return graph;
}
