/**
 * HomeMap Autoload Module
 * ---------------------------------------------------------
 * Automatically loads:
 *   - home.index.bin.manifest.json
 *   - all sliced part files
 * Reassembles the original home.index.bin in memory.
 * Initializes the provided loader class.
 *
 * Zero placeholders.
 * Real execution flow only.
 */

export async function autoloadHomeMap(loaderClass) {
    const manifestUrl = "docs/data/home.index.bin.manifest.json";

    // Debug log area expected in the UI
    const dbg = document.getElementById("debug");
    function log(msg) {
        if (dbg) dbg.textContent += msg + "\\n";
    }

    log("[AUTOLOAD] Fetching manifest...");

    const manifestResp = await fetch(manifestUrl);
    if (!manifestResp.ok) {
        log("[AUTOLOAD ERROR] Could not load manifest.");
        throw new Error("Manifest fetch failed");
    }

    const manifest = await manifestResp.json();
    log("[AUTOLOAD] Manifest loaded.");

    const parts = manifest.parts;
    const buffers = [];

    for (let i = 0; i < parts.length; i++) {
        const part = parts[i];
        const url = "docs/data/" + part;

        log(\`[AUTOLOAD] Fetching part \${i + 1}/\${parts.length}: \${part}\`);

        const resp = await fetch(url);
        if (!resp.ok) {
            log(\`[AUTOLOAD ERROR] Failed loading \${part}\`);
            throw new Error("Part fetch failed");
        }

        const buf = await resp.arrayBuffer();
        buffers.push(buf);
    }

    log("[AUTOLOAD] All parts fetched. Concatenating index...");

    let totalSize = buffers.reduce((acc, buf) => acc + buf.byteLength, 0);
    const full = new Uint8Array(totalSize);

    let offset = 0;
    for (const buf of buffers) {
        full.set(new Uint8Array(buf), offset);
        offset += buf.byteLength;
    }

    log("[AUTOLOAD] Full index reconstructed in memory.");

    // Initialize binary loader
    const loader = new loaderClass(full.buffer);

    log("[AUTOLOAD] Loader initialized successfully.");
    return loader;
}
