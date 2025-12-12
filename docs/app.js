/******************************************************************
 * ULTRA EXPLORER — AUTHORITATIVE CONTROLLER
 ******************************************************************/

/* =========================
   DEBUG
========================= */
const debug = msg => {
  const d = document.getElementById("debug");
  d.textContent += msg + "\n";
  console.log(msg);
};

window.onerror = (m, s, l) =>
  debug(`[JS ERROR] ${m} @ ${s}:${l}`);

window.onunhandledrejection = e =>
  debug(`[PROMISE ERROR] ${e.reason}`);

/* =========================
   PATH RESOLUTION
========================= */
const BASE = location.pathname.replace(/[^/]+$/, "");
debug(`[BOOT] BASE=${BASE}`);

/* =========================
   WASM LOADER
========================= */
let WASM = null;

async function bootWASM() {
  debug("[BOOT] Loading manifest_loader.js");

  const mod = await import(`${BASE}manifest_loader.js`);
  debug("[BOOT] JS loader loaded");

  WASM = await mod.default({
    locateFile: f => `${BASE}bin/${f}`
  });

  debug("[BOOT] WASM initialized");
  debug("[EXPORTS] " + Object.keys(WASM).join(", "));
}

/* =========================
   MANIFEST + BINARY ASSEMBLY
========================= */
async function loadBinary(manifestURL) {
  debug(`[MANIFEST] ${manifestURL}`);
  const m = await fetch(manifestURL).then(r => r.json());

  const buffers = [];
  for (const part of m.parts) {
    const url = `${BASE}data/${part}`;
    debug(`[FETCH] ${url}`);
    const buf = await fetch(url).then(r => r.arrayBuffer());
    buffers.push(new Uint8Array(buf));
  }

  const total = buffers.reduce((n,b)=>n+b.length,0);
  const out = new Uint8Array(total);

  let off = 0;
  for (const b of buffers) {
    out.set(b, off);
    off += b.length;
  }

  return out;
}

/* =========================
   TREE CONSTRUCTION
========================= */
function buildTree(paths) {
  const root = {};
  for (const p of paths) {
    let node = root;
    for (const seg of p.split("/")) {
      node[seg] = node[seg] || {};
      node = node[seg];
    }
  }
  return root;
}

function renderTree(node, parent, prefix="") {
  for (const k in node) {
    const el = document.createElement("div");
    el.className = "node";
    el.textContent = prefix + k;
    el.onclick = () => selectPath(prefix + k);
    parent.appendChild(el);
    renderTree(node[k], parent, prefix + k + "/");
  }
}

/* =========================
   FILE SELECTION
========================= */
function selectPath(path) {
  document.getElementById("path").textContent = path;
  document.getElementById("type").textContent =
    WASM._get_mime(path) || "unknown";
  document.getElementById("size").textContent =
    WASM._get_size(path) || "0";

  const ptr = WASM._preview_ptr(path);
  const txt = WASM._read_preview(ptr);
  document.getElementById("preview").textContent = txt;
}

/* =========================
   THINKING AGENT
========================= */
function answerQuestion(q) {
  const hits = [];
  const count = WASM._prefix_count();
  for (let i=0;i<count;i++) {
    const p = WASM.UTF8ToString(WASM._prefix_ptr(i));
    if (p.toLowerCase().includes(q.toLowerCase()))
      hits.push(p);
  }

  return `Found ${hits.length} relevant paths:\n\n` +
         hits.slice(0,10).join("\n");
}

/* =========================
   BOOT SEQUENCE
========================= */
(async function boot() {
  try {
    await bootWASM();

    const map = await loadBinary(`${BASE}data/home.map.bin.manifest.json`);
    const tags = await loadBinary(`${BASE}data/home.tags.bin.manifest.json`);
    const index = await loadBinary(`${BASE}data/home.index.bin.manifest.json`);

    WASM._load_map(map);
    WASM._load_tags(tags);
    WASM._load_index(index);

    debug("[BOOT] All binaries loaded");

    const paths = WASM.list_all_paths();
    const tree = buildTree(paths);
    renderTree(tree, document.getElementById("treePane"));

  } catch (e) {
    debug("[FATAL] " + e.toString());
  }
})();

/* =========================
   UI EVENTS
========================= */
document.getElementById("askBtn").onclick = () => {
  const q = document.getElementById("question").value;
  document.getElementById("answer").textContent = answerQuestion(q);
};
