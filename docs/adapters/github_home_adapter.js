/*
  GitHub Home Adapter
  Authoritative loader for GitHub Pages HomeMap data
  ZERO assumptions. FULL validation.
*/

const BASE = (() => {
  const p = window.location.pathname;
  return p.endsWith("/") ? p : p.replace(/[^/]+$/, "");
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

function concat(buffers) {
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
  return text
    .split("\n")
    .map(l => l.trim())
    .filter(Boolean);
}

async function loadManifest(name) {
  const url = `${BASE}data/${name}.manifest.json`;
  const manifest = await fetchJSON(url);
  if (!Array.isArray(manifest.parts))
    fail(`Invalid manifest format: ${name}`);
  return manifest.parts.map(p => `${BASE}data/${p}`);
}

async function loadBinaryFromManifest(name) {
  const partURLs = await loadManifest(name);
  const buffers = [];
  for (const url of partURLs) {
    buffers.push(await fetchBinary(url));
  }
  return concat(buffers);
}

/* ================================
   PUBLIC ENTRY POINT
================================ */

export async function loadGitHubHome(debug = () => {}) {
  debug("[GitHubAdapter] Loading HomeMap from GitHub Pages");

  const mapBin  = await loadBinaryFromManifest("home.map.bin");
  const tagsBin = await loadBinaryFromManifest("home.tags.bin");

  const paths = decodeLines(mapBin);
  const tagLines = decodeLines(tagsBin);

  const tags = {};
  for (const line of tagLines) {
    const [tag, path] = line.split("\t");
    if (!tag || !path) continue;
    if (!tags[tag]) tags[tag] = [];
    tags[tag].push(path);
  }

  const graph = {
    source: "github",
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

  debug(`[GitHubAdapter] Loaded ${graph.meta.counts.paths} paths`);
  return graph;
}
