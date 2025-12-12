/**
 * HomeMapLoader
 * ---------------------------------------------------------
 * Loads the reconstructed home.index.bin buffer.
 * Supports:
 *   - list_prefix("/")
 *   - lookup(path)
 *   - preview(offset, length)
 *
 * Binary index format (from your builder):
 *   uint32 entry_count
 *   For each entry:
 *       uint32 path_len
 *       bytes[path_len] path UTF-8
 *       uint32 offset
 *       uint32 size
 */

export class HomeMapLoader {
    constructor(buffer) {
        this.buffer = buffer;
        this.view = new DataView(buffer);
        this.paths = [];
        this.index = {};

        let pos = 0;

        const count = this.view.getUint32(pos, true);
        pos += 4;

        for (let i = 0; i < count; i++) {
            const pathLen = this.view.getUint32(pos, true);
            pos += 4;

            const bytes = new Uint8Array(buffer, pos, pathLen);
            pos += pathLen;

            const path = new TextDecoder().decode(bytes);

            const offset = this.view.getUint32(pos, true);
            pos += 4;

            const size = this.view.getUint32(pos, true);
            pos += 4;

            this.paths.push(path);
            this.index[path] = { offset, size };
        }
    }

    list_prefix(prefix) {
        return this.paths.filter(p => p.startsWith(prefix));
    }

    lookup(path) {
        return this.index[path] || null;
    }

    preview(entry, length = 500) {
        if (!entry) return "";

        const start = entry.offset;
        const end = Math.min(entry.offset + length, entry.offset + entry.size);

        const bytes = new Uint8Array(this.buffer, start, end - start);
        return new TextDecoder().decode(bytes);
    }
}
