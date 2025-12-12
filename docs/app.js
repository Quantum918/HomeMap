// Ultra Explorer – GLOBAL DEBUG MODE (unbreakable bootstrap)

function dbg(msg) {
    const el = document.getElementById("debug");
    el.textContent += msg + "\n";
    console.log(msg);
}

// ============================================================================
// GLOBAL ERROR TRAPS — NOTHING CAN SILENT-FAIL
// ============================================================================
window.addEventListener("error", e => {
    dbg("[JS ERROR] " + e.message + " @ " + e.filename + ":" + e.lineno);
});

window.addEventListener("unhandledrejection", e => {
    dbg("[PROMISE ERROR] " + e.reason);
});

// ============================================================================
// BOOTSTRAP
// ============================================================================
document.addEventListener("DOMContentLoaded", () => {
    dbg("[BOOT] DOM Loaded — Ultra Explorer Global Debug Mode");

    //
    // Github Pages base path
    // Example: https://user.github.io/HomeMap/index.html
    // We need: /HomeMap/docs/
    //
    const ghBase = window.location.origin + window.location.pathname.replace(/\/[^\/]*$/, "") + "/docs/";
    dbg("[PATH] GitHub Pages Base = " + ghBase);

    const wasmURL = ghBase + "bin/manifest_loader.wasm";
    const jsURL   = ghBase + "manifest_loader.js";

    dbg("[LOAD] WASM URL → " + wasmURL);
    dbg("[LOAD] loader.js URL → " + jsURL);

    // =========================================================================
    // LOAD THE JS MODULE → which loads WASM
    // =========================================================================
    import(jsURL)
        .then(module => {
            dbg("[MODULE] manifest_loader.js imported OK");

            if (!module.default) {
                dbg("[ERROR] manifest_loader.js missing default export!");
                return null;
            }

            dbg("[CALL] module.default({ locateFile })");

            return module.default({
                locateFile: p => {
                    const resolved = ghBase + "bin/" + p;
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

            window.Ultra = instance; // Expose globally for debugging

            // Load all directory manifests
            loadDirectory(ghBase);
        })
        .catch(err => {
            dbg("[FATAL ERROR DURING WASM/JS INIT]");
            dbg(err.toString());
        });
});

// ============================================================================
// LOAD DIRECTORY MANIFESTS (tags + map + index)
// ============================================================================
function loadDirectory(ghBase) {
    dbg("[DIR] Loading directory manifests…");

    //
    // CORRECT PATHS:
    // ghBase = https://quantum918.github.io/HomeMap/docs/
    //
    // So manifests must be loaded from:
    //   ghBase + "data/home.map.bin.manifest.json"
    //
    const manifestPaths = [
        ghBase + "data/home.tags.bin.manifest.json",
        ghBase + "data/home.map.bin.manifest.json",
        ghBase + "data/home.index.bin.manifest.json"
    ];

    manifestPaths.forEach(url => {
        fetch(url)
            .then(r => {
                dbg("[FETCH] Manifest → " + url + " → HTTP " + r.status);
                if (!r.ok) throw new Error("Manifest fetch failed: " + url);
                return r.json();
            })
            .then(j => {
                dbg("[MANIFEST] Loaded OK: " + url);
                dbg("[FILES] " + JSON.stringify(j).slice(0, 200) + "…");
            })
            .catch(err => {
                dbg("[MANIFEST ERROR] " + err.toString());
            });
    });
}
