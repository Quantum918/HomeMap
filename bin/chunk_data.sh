#!/usr/bin/env bash
set -e

DATA_SRC="$HOME/HOME_MAP/data"
DATA_DST="$HOME/HOME_MAP/docs/data"

echo "[CHUNK] Preparing directories…"
mkdir -p "$DATA_DST"
rm -f "$DATA_DST"/*

CHUNK_SIZE="95M"

split_file() {
    local file="$1"
    local prefix="$2"

    echo "[CHUNK] Splitting $file → $prefix.part_*"
    split -b $CHUNK_SIZE "$file" "$DATA_DST/$prefix.part_"

    echo "[CHUNK] Creating manifest: $prefix.manifest.json"
    (
        cd "$DATA_DST"
        echo -n '{ "parts": [' > "$prefix.manifest.json"
        first=1
        for p in $prefix.part_*; do
            if [ $first -eq 0 ]; then echo -n "," >> "$prefix.manifest.json"; fi
            first=0
            echo -n "\"$p\"" >> "$prefix.manifest.json"
        done
        echo '] }' >> "$prefix.manifest.json"
    )
}

echo "[CHUNK] Processing home.index.bin…"
split_file "$DATA_SRC/home.index.bin" "home.index.bin"

echo "[CHUNK] Processing home.map.bin…"
split_file "$DATA_SRC/home.map.bin" "home.map.bin"

echo "[CHUNK] Processing home.tags.bin…"
cp "$DATA_SRC/home.tags.bin" "$DATA_DST/home.tags.bin.part_00"
echo '{ "parts": ["home.tags.bin.part_00"] }' > "$DATA_DST/home.tags.bin.manifest.json"

echo "[CHUNK] Validating output sizes…"
for f in "$DATA_DST"/*; do
    size=$(stat -c%s "$f")
    if [ "$size" -gt 100000000 ]; then
        echo "[ERROR] File exceeds GitHub limit: $f ($size bytes)"
        exit 1
    fi
done

echo "[CHUNK] All files validated (<100MB)."
echo "[CHUNK] Chunking complete."
