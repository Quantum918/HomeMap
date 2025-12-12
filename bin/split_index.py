#!/usr/bin/env python3
import os, json

SRC = os.path.expanduser("~/HOME_MAP/data/home.index.bin")
OUTDIR = os.path.expanduser("~/HOME_MAP/docs/data")
PART_SIZE = 95 * 1024 * 1024  # 95 MB limit

os.makedirs(OUTDIR, exist_ok=True)

if not os.path.exists(SRC):
    print("[ERROR] Missing:", SRC)
    exit(1)

size = os.path.getsize(SRC)
print(f"[SPLIT] Source size: {size/1024/1024:.2f} MB")

parts = []
with open(SRC, "rb") as f:
    idx = 0
    while True:
        chunk = f.read(PART_SIZE)
        if not chunk:
            break
        name = f"home.index.bin.part_{idx:02d}"
        path = os.path.join(OUTDIR, name)
        with open(path, "wb") as out:
            out.write(chunk)
        parts.append(name)
        print(f"[SPLIT] Wrote {name} ({len(chunk)/1024/1024:.2f} MB)")
        idx += 1

# Write manifest
manifest = {
    "files": parts,
    "original_size": size,
    "part_size": PART_SIZE
}

man_path = os.path.join(OUTDIR, "home.index.bin.manifest.json")
with open(man_path, "w") as f:
    json.dump(manifest, f, indent=2)

print("[DONE] Created", len(parts), "parts")
print("[MANIFEST]", man_path)
