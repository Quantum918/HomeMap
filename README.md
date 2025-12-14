HomeMap/
├── README.md
├── LICENSE
├── bin/
│   ├── homemap_scan.py
│   ├── split_binary.py
│   ├── make_index_manifest.py
│   └── verify_parts.py
├── data/
│   ├── home.index.bin
│   ├── home.map.bin
│   └── home.tags.bin
└── docs/
    ├── index.html
    ├── app.js
    ├── manifest_loader.js
    ├── bin/
    │   └── manifest_loader.wasm
    └── data/
        ├── *.part_XX
        └── *.manifest.json

      
# HomeMap v1.0

HomeMap is a deterministic, local-first filesystem intelligence index.

It discovers files, builds binary indices, and serves them statically
(via GitHub Pages or offline) for exploration, explanation, and demo.

## What HomeMap Does
- Scans a filesystem root
- Builds immutable binary indices
- Splits large binaries for static hosting
- Loads indices via WASM in the browser

## What HomeMap Does NOT Do
- Execute user code
- Mutate files
- Guess formats
- Decode sigils

HomeMap is a map, not an engine.

## Pipeline
1. `bin/homemap_scan.py`
2. `bin/split_binary.py`
3. `bin/make_index_manifest.py`
4. GitHub Pages (`docs/`)

## License
MIT
