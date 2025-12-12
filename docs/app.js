async function loadManifest() {
    const url = "https://raw.githubusercontent.com/Quantum918/HomeMap/main/home_full_manifest.txt";

    const res = await fetch(url);
    const text = await res.text();

    document.getElementById("stats").innerText =
        "Loaded " + text.split("\n").length.toLocaleString() + " entries";

    return text.split("\n").filter(x => x.trim().length > 0);
}

function buildTree(paths) {
    const root = {};

    for (const full of paths) {
        const parts = full.replace(/^\//, "").split("/");
        let node = root;

        for (const p of parts) {
            if (!node[p]) node[p] = {};
            node = node[p];
        }
    }
    return root;
}

function renderTree(node, indent = "") {
    let out = "";

    for (const key of Object.keys(node).sort()) {
        const isLeaf = Object.keys(node[key]).length === 0;

        if (isLeaf) {
            out += `${indent}<span class="file">${key}</span>\n`;
        } else {
            const id = "folder_" + Math.random().toString(36).slice(2);
            out += `${indent}<span class="folder" onclick="toggle('${id}')">[+] ${key}</span>\n`;
            out += `<div id="${id}" class="hidden">` +
                   renderTree(node[key], indent + "    ") +
                   "</div>";
        }
    }

    return out;
}

function toggle(id) {
    const el = document.getElementById(id);
    el.classList.toggle("hidden");
}

async function main() {
    const paths = await loadManifest();
    let tree = buildTree(paths);

    document.getElementById("tree").innerHTML = renderTree(tree);

    document.getElementById("searchBtn").onclick = () => search(paths);
    document.getElementById("resetBtn").onclick = () => {
        document.getElementById("searchBox").value = "";
        document.getElementById("tree").innerHTML = renderTree(tree);
    };
}

function search(paths) {
    const q = document.getElementById("searchBox").value.toLowerCase();
    if (!q) return;

    const results = paths.filter(p => p.toLowerCase().includes(q));
    const tree = buildTree(results);
    document.getElementById("tree").innerHTML = renderTree(tree);
}

main();
