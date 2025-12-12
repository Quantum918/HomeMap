import { ManifestLoader } from "./manifest_loader.js";

// =========================
// CONFIG
// =========================
const ROOT = ".";                // docs/
const DATA = ROOT + "/data";     // docs/data

// Split map file components
const MAP_MANIFEST_URL = `${DATA}/home.map.bin.manifest.json`;

const TAGS_URL  = `${DATA}/home.tags.bin`;   // unchanged
const INDEX_URL = `${DATA}/home.index.bin`;  // unchanged
const WASM_FILE = `${ROOT}/bin/manifest_loader.wasm`;

let loader = null;

// =========================
// UTIL: DOWNLOAD AS UINT8ARRAY
// =========================
async function fetchBin(url) {
    const res = await fetch(url);
    if (!res.ok) throw new Error("HTTP " + res.status + " → " + url);
    return new Uint8Array(await res.arrayBuffer());
}

// =============================
// NEW: REBUILD home.map.bin FROM PARTS
// =============================
async function loadSplitMap() {
    console.log("[MAP] Loading manifest:", MAP_MANIFEST_URL);

    const manifestRes = await fetch(MAP_MANIFEST_URL);
    if (!manifestRes.ok) throw new Error("Missing map manifest!");
    const manifest = await manifestRes.json();

    const parts = manifest.parts;     // ["home.map.bin.part_aa", "home.map.bin.part_ab", ...]
    if (!parts || parts.length === 0)
        throw new Error("Map manifest has no parts.");

    console.log("[MAP] Found parts:", parts.length);

    let total = 0;
    const chunks = [];

    for (const p of parts) {
        const url = `${DATA}/${p}`;
        console.log("[MAP] Fetch:", url);
        const bin = await fetchBin(url);
        chunks.push(bin);
        total += bin.length;
    }

    console.log("[MAP] Total reconstructed size:", total);

    // Allocate final merged buffer
    const merged = new Uint8Array(total);

    let offset = 0;
    for (const chunk of chunks) {
        merged.set(chunk, offset);
        offset += chunk.length;
    }

    console.log("[MAP] Reconstruction complete.");
    return merged;
}

// ===============================
// MAIN INITIALIZATION
// ===============================
async function init() {
    try {
        console.log("[INIT] Loading WASM…");
        const wasmBytes = await fetchBin(WASM_FILE);

        console.log("[INIT] Loading SPLIT MAP…");
        const mapBin = await loadSplitMap();

        console.log("[INIT] Loading TAGS + INDEX…");
        const tagsBin  = await fetchBin(TAGS_URL);
        const indexBin = await fetchBin(INDEX_URL);

        loader = new ManifestLoader(wasmBytes, mapBin, tagsBin, indexBin);

        console.log("[INIT] Loader OK");
        await buildTree("/");

    } catch (e) {
        console.error("[FATAL INIT ERROR]", e);
        document.body.innerHTML = `<pre style="color:red;">FATAL ERROR:\n${e}</pre>`;
    }
}

// =================================
// TREE RENDERING
// =================================
async function buildTree(prefix) {
    const tree = document.getElementById("tree");
    tree.innerHTML = "";

    const items = loader.list_prefix(prefix);
    items.sort();

    for (const p of items) {
        const div = document.createElement("div");
        div.className = p.endsWith("/") ? "folder" : "file";
        div.textContent = p.replace(prefix, "");
        div.onclick = () => selectPath(p);
        tree.appendChild(div);
    }
}

function selectPath(path) {
    document.getElementById("fileTitle").textContent = path;
    document.getElementById("metaPath").textContent = path;

    const offset = loader.lookup(path);
    if (offset === null) {
        document.getElementById("preview").textContent = "[No preview]";
        return;
    }

    const preview = loader.preview(offset, 2048);
    document.getElementById("preview").textContent = preview;

    const meta = loader.getTags(offset);
    document.getElementById("metaType").textContent = meta.mime;
    document.getElementById("metaSize").textContent = meta.size + " bytes";
}

// Search
document.getElementById("searchBtn").onclick = () => {
    const q = document.getElementById("searchBox").value.trim();
    if (!q) return;

    const results = loader.list_prefix(q);
    const tree = document.getElementById("tree");
    tree.innerHTML = "";

    for (const p of results) {
        const div = document.createElement("div");
        div.textContent = p;
        div.className = p.endsWith("/") ? "folder" : "file";
        div.onclick = () => selectPath(p);
        tree.appendChild(div);
    }
};

document.getElementById("resetBtn").onclick = () => buildTree("/");

window.onload = init;
