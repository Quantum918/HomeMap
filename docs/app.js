// Ultra Explorer Debug Build — Full Logging Enabled

function log(msg) {
    const el = document.getElementById("debug");
    el.textContent += msg + "\n";
    console.log(msg);
}

document.addEventListener("DOMContentLoaded", () => {
    log("UI Loaded — Starting Ultra Explorer Debug Mode");

    const wasmURL = "https://quantum918.github.io/HomeMap/bin/manifest_loader.wasm";
    const jsURL   = "https://quantum918.github.io/HomeMap/manifest_loader.js";

    log("Loading WASM from: " + wasmURL);
    log("Loading loader JS from: " + jsURL);

    // Load loader JS (ES6 Module)
    import(jsURL)
        .then(module => {
            log("JS Module Loaded OK");

            return module.default({ locateFile: () => wasmURL });
        })
        .then(instance => {
            log("WASM Loaded OK");

            window.UX = instance;
            log("WASM Exported Functions: " + Object.keys(instance).join(", "));

            loadDirectory();
        })
        .catch(err => {
            log("FATAL ERROR loading WASM or JS:");
            log(err.toString());
        });
});

function loadDirectory() {
    log("Loading directory manifest...");

    const paths = [
        "https://quantum918.github.io/HomeMap/data/home.map.bin.manifest.json",
        "https://quantum918.github.io/HomeMap/data/home.tags.bin.manifest.json"
    ];

    paths.forEach(url => {
        fetch(url)
            .then(r => {
                log("Fetch " + url + " → " + r.status);
                if (!r.ok) throw new Error("Manifest load failed: " + url);
                return r.json();
            })
            .then(json => {
                log("Manifest Parsed: " + url);
                log("Files: " + JSON.stringify(json).slice(0, 200) + "...");
            })
            .catch(err => {
                log("Manifest ERROR: " + err.toString());
            });
    });
}
