#!/usr/bin/env python3
import os, struct, hashlib, mimetypes

HOME = os.path.expanduser("~")
MANIFEST = os.path.join(HOME, "home_full_manifest.txt")
DATA_DIR = os.path.join(HOME, "HOME_MAP/data")

os.makedirs(DATA_DIR, exist_ok=True)

MAP_OUT   = os.path.join(DATA_DIR, "home.map.bin")
TAGS_OUT  = os.path.join(DATA_DIR, "home.tags.bin")
INDEX_OUT = os.path.join(DATA_DIR, "home.index.bin")

def read_manifest():
    with open(MANIFEST, "r") as f:
        for line in f:
            line=line.strip()
            if not line.startswith("/"): continue
            yield line

def build():
    paths = list(read_manifest())
    print(f"[MB] Loaded {len(paths)} paths.")

    # --- Build PATH MAP ---
    print("[MB] Building map…")
    path_bytes = []
    offsets = []
    cursor = 0

    for p in paths:
        b = p.encode("utf-8") + b"\0"
        offsets.append(cursor)
        path_bytes.append(b)
        cursor += len(b)

    with open(MAP_OUT,"wb") as f:
        for off in offsets:
            f.write(struct.pack("<I", off))
        for b in path_bytes:
            f.write(b)

    # --- Build TAG metadata ---
    print("[MB] Building tags…")
    def get_size(p):
        try: return os.path.getsize(p)
        except: return 0

    with open(TAGS_OUT,"wb") as f:
        for p in paths:
            size = get_size(p)
            mime = mimetypes.guess_type(p)[0] or "unknown"
            mime_b = mime_b = mime.encode() + b"\0"
            f.write(struct.pack("<Q", size))
            f.write(mime_b)

    # --- Build INDEX for preview ---
    print("[MB] Building preview index…")
    with open(INDEX_OUT,"wb") as f:
        for p in paths:
            try:
                with open(p,"rb") as fp:
                    data = fp.read(2048)
            except:
                data = b""

            f.write(struct.pack("<I", len(data)))
            f.write(data)

    print("[MB] Completed.")
    print("   ", MAP_OUT)
    print("   ", TAGS_OUT)
    print("   ", INDEX_OUT)

if __name__ == "__main__":
    build()
