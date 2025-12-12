// Ultra Explorer – GLOBAL DEBUG MODE (unbreakable bootstrap)

function dbg(msg) {
    const el = document.getElementById("debug");
    el.textContent += msg + "\n";
    console.log(msg);
}

// =========================================================================
// GLOBAL ERROR TRAPS — NOTHING CAN SILENT-FAIL ANYMORE
// =========================================================================
window.addEventListener("error", e => {
    dbg("[JS ERROR] " + e.message + " @ " + e.filename + ":" + e.lineno);
});

window.addEventListener("unhandledrejection", e => {
    dbg("[PROMISE ERROR] " + e.reason);
});

// =========================================================================
// BOOTSTRAP
// =========================================================================
document.addEventListener("DOMContentLoaded", () => {
    dbg("[BOOT] DOM Loaded — Ultra Explorer Global Debug Mode");

    // Auto-detect correct base path for GitHub Pages
    // Example: /HomeMap/index.html → /HomeMap/
    const base = window.location.pathname.replace(/[^\/]+$/, "");
    dbg("[PATH] Base path detected: " + base);

    const wasmURL = base + "bin/manifest_loader.wasm";
    const jsURL   = base + "manifest_loader.js";
    dbg("[LOAD] WASM URL → " + wasmURL);
    dbg("[LOAD] JS Loader URL → " + jsURL);

    // =========================================================================
    // LOAD THE LOADER.JS MODULE
    // =========================================================================
    import(jsURL)
        .then(module => {
            dbg("[MODULE] manifest_loader.js imported OK");

            // ensure module.default exists
            if (!module.default) {
                dbg("[ERROR] manifest_loader.js has NO default export!");
                return;
            }

            dbg("[CALL] module.default({ locateFile })");

            return module.default({
                locateFile: p => {
                    const resolved = base + "bin/" + p;
                    dbg("[locateFile] " + p + " → " + resolved);
                    return resolved;
                }
            });
        })
        .then(instance => {
            if (!instance) {
                dbg("[FATAL] loader returned null instance");
                return;
            }

            dbg("[WASM] Loader OK — WASM instance created");
            dbg("[WASM EXPORTS] " + Object.keys(instance).join(", "));

            window.Ultra = instance;   // expose for debugging

            // After WASM loads, fetch directory manifests
            loadDirectory(base);
        })
        .catch(err => {
            dbg("[FATAL ERROR DURING WASM/JS INIT]");
            dbg(err.toString());
        });
});

// =========================================================================
// LOAD DIRECTORY MANIFESTS (tags + map + index)
// =========================================================================
function loadDirectory(base) {
    dbg("[DIR] Loading directory manifests…");

    const manifestPaths = [
        base + "data/home.tags.bin.manifest.json",
        base + "data/home.map.bin.manifest.json",
        base + "data/home.index.bin.manifest.json"
    ];

    manifestPaths.forEach(url => {
        fetch(url)
            .then(r => {
                dbg("[FETCH] " + url + " → HTTP " + r.status);
                if (!r.ok) throw new Error("Manifest fetch failed: " + url);
                return r.json();
            })
            .then(j => {
                dbg("[MANIFEST] Parsed OK: " + url);
                dbg("[MANIFEST FILES] " + JSON.stringify(j).slice(0, 200) + "…");
            })
            .catch(err => {
                dbg("[MANIFEST ERROR] " + err.toString());
            });
    });
}

