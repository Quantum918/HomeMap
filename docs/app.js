/* ============================
   INLINE DEBUG CONSOLE OVERLAY
   ============================ */
(function () {
    const box = document.createElement("div");
    box.id = "INLINE_CONSOLE";
    box.style.position = "fixed";
    box.style.bottom = "0";
    box.style.left = "0";
    box.style.width = "100%";
    box.style.height = "200px";
    box.style.background = "rgba(0,0,0,0.85)";
    box.style.color = "#00ffcc";
    box.style.fontFamily = "monospace";
    box.style.fontSize = "12px";
    box.style.overflowY = "auto";
    box.style.zIndex = "999999";
    box.style.padding = "4px";
    box.style.borderTop = "1px solid #00ffcc";
    box.style.whiteSpace = "pre-wrap";

    const toggle = document.createElement("button");
    toggle.innerText = "Console";
    toggle.style.position = "fixed";
    toggle.style.bottom = "200px";
    toggle.style.right = "10px";
    toggle.style.zIndex = "1000000";
    toggle.style.padding = "5px 8px";
    toggle.style.background = "#000";
    toggle.style.color = "#0f0";
    toggle.style.border = "1px solid #0f0";
    toggle.style.borderRadius = "5px";
    toggle.style.fontSize = "12px";
    toggle.onclick = () => {
        box.style.display = box.style.display === "none" ? "block" : "none";
    };

    document.addEventListener("DOMContentLoaded", () => {
        document.body.appendChild(box);
        document.body.appendChild(toggle);
    });

    function log(msg) {
        const line = document.createElement("div");
        line.textContent = msg;
        box.appendChild(line);
        box.scrollTop = box.scrollHeight;
    }

    const _log = console.log;
    console.log = function (...args) {
        _log.apply(console, args);
        log("[LOG] " + args.join(" "));
    };

    const _err = console.error;
    console.error = function (...args) {
        _err.apply(console, args);
        log("[ERROR] " + args.join(" "));
    };

    window.onerror = function (msg, src, line, col, err) {
        log("[ONERROR] " + msg + " @ " + src + ":" + line + ":" + col);
    };

    log("Inline JS console active.");
})();

/* ============================
   ORIGINAL APP LOGIC
   ============================ */
import { ManifestLoader } from "./manifest_loader.js";

const DATA = "./data";
const BIN_MAP   = DATA + "/home.map.bin";
const BIN_TAGS  = DATA + "/home.tags.bin";
const BIN_INDEX = DATA + "/home.index.bin";
const WASM_FILE = "./bin/manifest_loader.wasm";

let loader = null;

async function fetchBin(url) {
    console.log("[fetchBin] loading", url);
    const res = await fetch(url);
    const buf = await res.arrayBuffer();
    console.log("[fetchBin] loaded", url, buf.byteLength);
    return new Uint8Array(buf);
}

async function init() {
    console.log("[INIT] Loading WASM + binaries...");
    try {
        const wasmBytes = await fetchBin(WASM_FILE);
        const mapBin    = await fetchBin(BIN_MAP);
        const tagsBin   = await fetchBin(BIN_TAGS);
        const indexBin  = await fetchBin(BIN_INDEX);

        console.log("[INIT] Instantiating loader...");
        loader = new ManifestLoader(wasmBytes, mapBin, tagsBin, indexBin);
        console.log("[INIT] Loader ready.");

        await buildTree("/");
    } catch (err) {
        console.error("[INIT ERROR]", err);
    }
}

async function buildTree(prefix) {
    const tree = document.getElementById("tree");
    tree.innerHTML = "";

    console.log("[Tree] Listing prefix:", prefix);
    let items = [];

    try {
        items = loader.list_prefix(prefix);
        console.log("[Tree] Found", items.length, "items.");
    } catch (err) {
        console.error("[Tree ERROR]", err);
        return;
    }

    items.sort();

    for (const p of items) {
        const div = document.createElement("div");
        div.className = p.endsWith("/") ? "folder" : "file";
        div.textContent = p;
        div.onclick = () => selectPath(p);
        tree.appendChild(div);
    }
}

async function selectPath(p) {
    console.log("[Select]", p);

    const info = document.getElementById("info");
    const preview = document.getElementById("preview");
    preview.textContent = "";

    if (!loader) {
        console.error("Loader not ready");
        return;
    }

    try {
        const size = loader.get_size(p);
        const mime = loader.get_mime(p);
        const tags = loader.get_tags(p);
        const textPreview = loader.preview(p);

        info.innerHTML =
            "Path: " + p + "<br>" +
            "Type: " + mime + "<br>" +
            "Size: " + size + "<br>" +
            "Tags: " + tags.join(", ");

        preview.textContent = textPreview;
    } catch (err) {
        console.error("[Select ERROR]", err);
    }
}

document.getElementById("searchBtn").onclick = () => {
    const q = document.getElementById("searchBox").value.trim();
    console.log("[Search]", q);
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
