/*
 GitHub Home Adapter
 Authoritative loader for GitHub Pages HomeMap data
 ZERO assumptions. FULL validation.
*/

const BASE = (() => {
    // Force GitHub Pages docs root
    const path = window.location.pathname;
    if (path.includes("/docs/")) {
        return path.slice(0, path.indexOf("/docs/") + 6);
    }
    return path.endsWith("/") ? path + "docs/" : path + "/docs/";
})();

function fail(msg) {
    throw new Error("[GitHubAdapter] " + msg);
}

async function fetchJSON(url) {
    const r = await fetch(url);
    if (!r.ok) fail(`JSON fetch failed ${r.status}: ${url}`);
    return r.json();
}

async function fetchBinary(url) {
    const r = await fetch(url);
    if (!r.ok) fail(`BIN fetch failed ${r.status}: ${url}`);
    return r.arrayBuffer();
}

function concatBuffers(buffers) {
    let total = 0;
    for (const b of buffers) total += b.byteLength;
    const out = new Uint8Array(total);
    let off = 0;
    for (const b of buffers) {
        out.set(new Uint8Array(b), off);
        off += b.byteLength;
    }
    return out;
}

function decodeLines(uint8) {
    const text = new TextDecoder("utf-8").decode(uint8);
    return text.split("\n").map(l => l.trim()).filter(Boolean);
}

async function loadManifest(name) {
    const url = `${BASE}data/${name}.manifest.json`;
    const manifest = await fetchJSON(url);
    if (!Array.isArray(manifest.parts) || manifest.parts.length === 0)
        throw new Error("Invalid manifest: " + name);
    return manifest.parts.map(p => `${BASE}data/${p}`);
}

async function loadBinaryFromManifest(name) {
    const partURLs = await loadManifest(name);
    const buffers = [];
    for (const url of partURLs) {
        buffers.push(await fetchBinary(url));
    }
    return concatBuffers(buffers);
}

export async function loadGitHubHome(debug = () => {}) {
    debug(`[GitHubAdapter] Base resolved to ${BASE}`);
    debug("[GitHubAdapter] Loading HomeMap from GitHub Pages");

    const indexBin = await loadBinaryFromManifest("home.index.bin");
    const mapBin   = await loadBinaryFromManifest("home.map.bin");
    const tagsBin  = await loadBinaryFromManifest("home.tags.bin");

    const paths    = decodeLines(indexBin);
    const mapLines = decodeLines(mapBin);
    const tagLines = decodeLines(tagsBin);

    if (!paths.length)
        throw new Error("Decoded index produced zero paths");

    const tags = {};
    for (const line of tagLines) {
        const [tag, path] = line.split("\t");
        if (!tag || !path) continue;
        if (!tags[tag]) tags[tag] = [];
        tags[tag].push(path);
    }

    return {
        source: "github",
        paths,
        map: mapLines,
        tags,
        meta: {
            generatedAt: new Date().toISOString(),
            counts: {
                paths: paths.length,
                tags: Object.keys(tags).length,
                mapLines: mapLines.length
            }
        }
    };
}
