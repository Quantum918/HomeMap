// ============================================================
// SIGILAGI — SELF DESCRIBING REPOSITORY AGENT
// Ultra Explorer / HomeMap
// ============================================================

const DBG = msg => {
  const d = document.getElementById("debug");
  if (d) d.textContent += msg + "\n";
  console.log(msg);
};

// ------------------------------------------------------------
// GLOBAL ERROR TRAPS (nothing fails silently)
// ------------------------------------------------------------
window.addEventListener("error", e =>
  DBG(`[JS ERROR] ${e.message} @ ${e.filename}:${e.lineno}`)
);

window.addEventListener("unhandledrejection", e =>
  DBG(`[PROMISE ERROR] ${e.reason}`)
);

// ------------------------------------------------------------
// BOOT
// ------------------------------------------------------------
document.addEventListener("DOMContentLoaded", async () => {
  DBG("[BOOT] SigilAGI Repository Agent Initializing");

  const BASE = location.pathname.replace(/[^\/]+$/, "");
  DBG("[BOOT] BASE=" + BASE);

  const wasmURL = BASE + "bin/manifest_loader.wasm";
  const loaderURL = BASE + "manifest_loader.js";

  DBG("[BOOT] Loading loader JS");

  const loader = await import(loaderURL);
  if (!loader.default) {
    throw new Error("manifest_loader.js has no default export");
  }

  const WASM = await loader.default({
    locateFile: f => BASE + "bin/" + f
  });

  DBG("[BOOT] WASM initialized");
  DBG("[EXPORTS] " + Object.keys(WASM).join(", "));

  window.WASM = WASM; // intentional global for agent access

  // Load all binaries
  await loadBinary("home.map.bin", "_load_map", BASE);
  await loadBinary("home.tags.bin", "_load_tags", BASE);
  await loadBinary("home.index.bin", "_load_index", BASE);

  DBG("[BOOT] All binaries loaded");

  initializeAgent();
});

// ------------------------------------------------------------
// BINARY LOADER (manifest driven)
// ------------------------------------------------------------
async function loadBinary(name, wasmFn, base) {
  const manifestURL = `${base}data/${name}.manifest.json`;
  DBG(`[MANIFEST] ${manifestURL}`);

  const manifest = await fetch(manifestURL).then(r => r.json());

  let total = 0;
  const buffer = new Uint8Array(manifest.total_size);

  for (const part of manifest.parts) {
    const url = `${base}data/${part.file}`;
    DBG(`[FETCH] ${url}`);

    const data = new Uint8Array(await fetch(url).then(r => r.arrayBuffer()));
    buffer.set(data, total);
    total += data.length;
  }

  WASM[wasmFn](buffer);
}

// ------------------------------------------------------------
// AGENT CORE
// ------------------------------------------------------------
function initializeAgent() {
  DBG("[AGENT] Self-describing agent online");

  document.getElementById("agentRun").onclick = () => {
    const q = document.getElementById("agentQuery").value.trim();
    if (!q) return;

    const result = reasonAboutRepo(q);
    document
