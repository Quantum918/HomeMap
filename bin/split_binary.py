#!/usr/bin/env python3
import os
import argparse

def split_binary(input_file, output_dir, prefix, chunk_size):
    if not os.path.isfile(input_file):
        print(f"[ERROR] Input file not found: {input_file}")
        return

    os.makedirs(output_dir, exist_ok=True)

    size = os.path.getsize(input_file)
    print(f"[INFO] Splitting {input_file} ({size} bytes)…")

    with open(input_file, "rb") as f:
        index = 0
        while True:
            chunk = f.read(chunk_size)
            if not chunk:
                break

            part_name = f"{prefix}{index:02d}"
            part_path = os.path.join(output_dir, part_name)

            with open(part_path, "wb") as p:
                p.write(chunk)

            print(f"[OK] Wrote {part_path} ({len(chunk)} bytes)")

            index += 1

    print(f"[DONE] Created {index} parts.")

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--input", required=True)
    ap.add_argument("--output-dir", required=True)
    ap.add_argument("--prefix", required=True)
    ap.add_argument("--chunk-size", type=int, required=True)
    args = ap.parse_args()

    split_binary(
        args.input,
        args.output_dir,
        args.prefix,
        args.chunk_size
    )

if __name__ == "__main__":
    main()
