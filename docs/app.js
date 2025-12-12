import initWasm from "./manifest_loader.js";
import { ManifestLoader } from "./manifest_loader.js";

const DATA = "./data";
const BIN_MAP   = DATA + "/home.map.bin";
const BIN_TAGS  = DATA + "/home.tags.bin";
const BIN_INDEX = DATA + "/home.index.bin";
const WASM_FILE = "bin/manifest_loader.wasm";

let loader = null;

async function fetchBin(url) {
    const res = await fetch(url);
    return new Uint8Array(await res.arrayBuffer());
}

async function init() {
    console.log("[APP] Loading WASM + data…");

    const wasmBytes  = await fetchBin(WASM_FILE);
    const mapBin     = await fetchBin(BIN_MAP);
    const tagsBin    = await fetchBin(BIN_TAGS);
    const indexBin   = await fetchBin(BIN_INDEX);

    const wasmModule = await initWasm({ wasmBinary: wasmBytes });
    loader = new ManifestLoader(wasmModule, mapBin, tagsBin, indexBin);

    console.log("[APP] Ready.");
    await buildTree("/");
}

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
    document.getElementById("metaPath").textContent  = path;

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

document.getElementById("searchBtn").onclick = () => {
    const q = document.getElementById("searchBox").value.trim();
    if (q.length === 0) return;

    const matches = loader.list_prefix(q);
    const tree = document.getElementById("tree");
    tree.innerHTML = "";

    for (const p of matches) {
        const div = document.createElement("div");
        div.textContent = p;
        div.className = p.endsWith("/") ? "folder" : "file";
        div.onclick = () => selectPath(p);
        tree.appendChild(div);
    }
};

document.getElementById("resetBtn").onclick = () => {
    buildTree("/");
};

window.onload = init;
