// Ultra Explorer v2 — AGI Filesystem Console
// Hybrid Mode C: top-level immediate, deep lazy-load, scalable to millions.

// Manifest location in your GitHub
const MANIFEST_URL =
  "https://raw.githubusercontent.com/Quantum918/HomeMap/main/home_full_manifest.txt";

// Global caches
let ALL_PATHS = [];
let TREE = {};   // root tree (top-level only)
let PREVIEW_CACHE = {};

//----------------------------------------
// Load manifest file (603k+ lines)
//----------------------------------------
async function loadManifest() {
    const res = await fetch(MANIFEST_URL);
    const text = await res.text();

    ALL_PATHS = text
        .split("\n")
        .map(x => x.trim())
        .filter(Boolean);

    return ALL_PATHS;
}

//----------------------------------------
// Build only the top-level tree
//----------------------------------------
function buildTopLevelTree(paths) {
    const root = {};

    for (const full of paths) {
        const parts = full.split("/").filter(Boolean);

        if (parts.length === 0) continue;

        const top = parts[0];

        if (!root[top]) {
            root[top] = { _type: "folder", _children: {}, _loaded: false };
        }
    }
    return root;
}

//----------------------------------------
// Given a folder path, load its immediate children only
//----------------------------------------
function expandFolder(fullPath) {
    const target = TREE;
    const parts = fullPath.split("/").filter(Boolean);

    let node = target;
    for (const p of parts) {
        if (!node[p]) return null;
        node = node[p]._children;
    }

    // If already loaded → do nothing
    const folderNode = getNode(fullPath);
    if (folderNode._loaded) return folderNode;

    // Populate children
    for (const full of ALL_PATHS) {
        if (full === fullPath) continue;

        if (full.startsWith(fullPath + "/")) {
            const rel = full.slice(fullPath.length + 1);
            if (!rel.includes("/")) {
                // Direct child
                const isFolder = ALL_PATHS.some(p => p.startsWith(full + "/"));
                folderNode._children[rel] = {
                    _type: isFolder ? "folder" : "file",
                    _children: {},
                    _loaded: false
                };
            }
        }
    }

    folderNode._loaded = true;
    return folderNode;
}

//----------------------------------------
// Utility: get node by full path
//----------------------------------------
function getNode(fullPath) {
    const parts = fullPath.split("/").filter(Boolean);
    let node = TREE;
    for (const p of parts) {
        node = node[p];
        if (!node) return null;
        node = node._children;
    }
    // folderNode lives one level above
    const parent = TREE;
    let current = TREE;
    for (const p of parts) {
        parent = current;
        current = current[p];
        if (!current) break;
        current = current._children;
    }
    return current ? current.__proto__ : null;
}

// Actually simpler: direct walk to node
function getFolderNode(path) {
    const parts = path.split("/").filter(Boolean);
    let node = TREE;
    for (const p of parts) {
        if (!node[p]) return null;
        node = node[p];
        if (node._type !== "folder") return null;
        node = node._children;
    }
    return node;
}

//----------------------------------------
// Render a folder level into #tree
//----------------------------------------
function renderTree(rootObj, prefix = "", container = document.getElementById("tree")) {
    container.innerHTML = "";

    Object.keys(rootObj).sort().forEach(key => {
        const obj = rootObj[key];
        const isFolder = obj._type === "folder";

        const div = document.createElement("div");
        div.classList.add(isFolder ? "folder" : "file");
        div.textContent = key;

        // CSS class by type (sigil, gguf, etc.)
        if (!isFolder) {
            let ext = key.split(".").pop();
            if (ext === "py") div.classList.add("py");
            if (ext === "json") div.classList.add("json");
            if (key.endsWith(".sigil.json")) div.classList.add("sigil");
            if (key.endsWith(".gguf")) div.classList.add("gguf");
        }

        div.onclick = () => {
            const full = prefix ? prefix + "/" + key : key;

            if (isFolder) {
                handleFolderClick(full, div);
            } else {
                handleFileSelect(full);
            }
        };

        container.appendChild(div);
    });
}

//----------------------------------------
// When clicking a folder: lazy-load + render new subtree
//----------------------------------------
function handleFolderClick(fullPath, elem) {
    expandFolder(fullPath);

    const folderNode = getFolderNode(fullPath);

    // Remove any existing subtree
    const next = elem.nextSibling;
    if (next && next.classList && next.classList.contains("indent")) {
        next.remove();
        return;
    }

    // Create new indent container for subtree
    const div = document.createElement("div");
    div.classList.add("indent");

    renderTree(folderNode, fullPath, div);

    elem.after(div);
}

//----------------------------------------
// Handle selecting a file (preview + metadata)
//----------------------------------------
function handleFileSelect(fullPath) {
    document.getElementById("fileTitle").textContent = fullPath;
    document.getElementById("metaPath").textContent = fullPath;

    const ext = fullPath.split(".").pop();
    document.getElementById("metaType").textContent = ext;

    const tags = analyzeTags(fullPath);
    document.getElementById("metaTags").textContent = tags.join(", ");

    const githubLink =
        "https://github.com/Quantum918/HomeMap/blob/main/" + fullPath;
    document.getElementById("openGitHub").onclick = () => {
        window.open(githubLink, "_blank");
    };

    loadPreview(fullPath);
}

//----------------------------------------
// Classify files (AGI-aware heuristics)
//----------------------------------------
function analyzeTags(path) {
    const t = [];

    if (path.endsWith(".py")) t.push("python");
    if (path.endsWith(".json")) t.push("json");
    if (path.endsWith(".sigil.json")) t.push("sigil");
    if (path.endsWith(".gguf")) t.push("gguf");

    if (/agi/i.test(path)) t.push("agi");
    if (/glyph/i.test(path)) t.push("glyph");
    if (/solver/i.test(path)) t.push("solver");
    if (/model/i.test(path)) t.push("model");

    return t;
}

//----------------------------------------
// Load file preview via GitHub raw URL
//----------------------------------------
async function loadPreview(fullPath) {
    if (PREVIEW_CACHE[fullPath]) {
        document.getElementById("preview").textContent = PREVIEW_CACHE[fullPath];
        return;
    }

    const rawURL =
        "https://raw.githubusercontent.com/Quantum918/HomeMap/main/" + fullPath;

    try {
        const res = await fetch(rawURL);
        if (!res.ok) throw new Error("Fetch error");

        const text = await res.text();
        PREVIEW_CACHE[fullPath] = text;

        document.getElementById("preview").textContent = text;
    } catch (e) {
        document.getElementById("preview").textContent =
            "[Error loading preview: file too large or missing]";
    }
}

//----------------------------------------
// SEARCH ENGINE (full manifest, not tree)
//----------------------------------------
function searchFiles(term) {
    term = term.toLowerCase();
    const results = ALL_PATHS.filter(p => p.toLowerCase().includes(term));
    return results.slice(0, 500); // limit for UI safety
}

// Render search results temporarily in tree pane
function renderSearchResults(list) {
    const container = document.getElementById("tree");
    container.innerHTML = "";

    list.forEach(p => {
        const div = document.createElement("div");
        div.textContent = p;
        div.classList.add("file");
        div.onclick = () => handleFileSelect(p);
        container.appendChild(div);
    });
}

//----------------------------------------
// Initialize UI after manifest loads
//----------------------------------------
async function init() {
    await loadManifest();

    TREE = buildTopLevelTree(ALL_PATHS);

    renderTree(TREE);

    document.getElementById("searchBtn").onclick = () => {
        const q = document.getElementById("searchBox").value.trim();
        if (q.length === 0) return;
        renderSearchResults(searchFiles(q));
    };

    document.getElementById("resetBtn").onclick = () => {
        renderTree(TREE);
    };
}

init();
