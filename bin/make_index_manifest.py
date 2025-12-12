#!/usr/bin/env python3
import os, json, sys

# LOCATION OF ORIGINAL BIG INDEX FILE
SRC = os.path.expanduser("~/HOME_MAP/data/home.index.bin")

# OUTPUT DIRECTORY FOR SPLIT PARTS
OUT_DIR = os.path.expanduser("~/HOME_MAP/docs/data")

# MAX SIZE PER PART (GitHub hard limit is 100MB; use 90MB for safety)
PART_SIZE = 90 * 1024 * 1024

def main():
    if not os.path.isfile(SRC):
        print(f"[ERROR] Source index file not found: {SRC}")
        sys.exit(1)

    os.makedirs(OUT_DIR, exist_ok=True)

    size = os.path.getsize(SRC)
    print(f"[INFO] Source size: {size/1024/1024:.2f} MB")

    parts = []
    part_num = 0

    with open(SRC, "rb") as f:
        while True:
            chunk = f.read(PART_SIZE)
            if not chunk:
                break

            part_name = f"home.index.bin.part_{part_num:02d}"
            out_path = os.path.join(OUT_DIR, part_name)

            print(f"[WRITE] {out_path} ({len(chunk)/1024/1024:.2f} MB)")

            with open(out_path, "wb") as pf:
                pf.write(chunk)

            parts.append(part_name)
            part_num += 1

    # Build manifest JSON
    manifest = {
        "file": "home.index.bin",
        "parts": parts
    }

    manifest_path = os.path.join(OUT_DIR, "home.index.bin.manifest.json")
    with open(manifest_path, "w") as mf:
        json.dump(manifest, mf, indent=2)

    print(f"[DONE] Created manifest: {manifest_path}")
    print(f"Parts: {parts}")

if __name__ == "__main__":
    main()
