import { ManifestLoader } from "./manifest_loader.js";

const BASE = "./";
const DATA = BASE + "data/";
const BIN_MAP   = DATA + "home.map.bin.part_aa";
const BIN_TAGS  = DATA + "home.tags.bin.part_00";
const INDEX_PARTS = [
    "home.index.bin.part_aa",
    "home.index.bin.part_ab",
    "home.index.bin.part_ac",
    "home.index.bin.part_ad",
    "home.index.bin.part_ae",
    "home.index.bin.part_af",
    "home.index.bin.part_ag",
    "home.index.bin.part_ah",
    "home.index.bin.part_ai",
    "home.index.bin.part_aj",
    "home.index.bin.part_ak"
];

const WASM_FILE = BASE + "bin/manifest_loader.wasm";

let loader = null;

async function fetchBin(url) {
    const res = await fetch(url);
    if (!res.ok) throw new Error("Failed to fetch " + url);
    return new Uint8Array(await res.arrayBuffer());
}

async function init() {

    const log = msg => {
        const dbg = document.getElementById("dbg");
        dbg.innerText += msg + "\n";
    };

    log("[INIT] Starting autoload…");

    try {
        log("[INIT] Loading WASM…");
        const wasmBytes = await fetchBin(WASM_FILE);

        log("[INIT] Loading map + tags…");
        const mapBin  = await fetchBin(BIN_MAP);
        const tagsBin = await fetchBin(BIN_TAGS);

        log("[INIT] Loading index parts…");
        let indexCombined = [];
        for (let p of INDEX_PARTS) {
            const buf = await fetchBin(DATA + p);
            indexCombined.push(buf);
            log("  loaded " + p + " (" + buf.length + ")");
        }

        const indexBin = new Uint8Array(indexCombined.reduce((a,b)=>a+b.length,0));
        let offset = 0;
        for (let part of indexCombined) {
            indexBin.set(part, offset);
            offset += part.length;
        }

        log("[INIT] Creating loader…");

        loader = new ManifestLoader(
            wasmBytes,
            mapBin,
            tagsBin,
            indexBin
        );

        log("[INIT] Loader ready — building tree…");
        await buildTree("/");
        log("[INIT] DONE.");

    } catch (err) {
        console.error(err);
        document.getElementById("dbg").innerText += "\n[ERROR] " + err + "\n";
    }
}

async function buildTree(prefix) {
    const tree = document.getElementById("tree");
    tree.innerHTML = "";

    const items = loader.list_prefix(prefix) || [];
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

window.onload = init;
