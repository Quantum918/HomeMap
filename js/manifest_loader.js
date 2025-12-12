export class ManifestLoader {
    constructor(wasmBytes, mapBytes, tagsBytes, indexBytes) {
        this.ready = this._init(wasmBytes, mapBytes, tagsBytes, indexBytes);
    }

    async _init(wasmBytes, mapBytes, tagsBytes, indexBytes) {
        const wasm = await WebAssembly.instantiate(wasmBytes, {
            env: {
                abort: () => console.log("[WASM] abort()"),
            }
        });

        this.wasm = wasm.instance.exports;
        this.memory = this.wasm.memory;

        const memU8 = new Uint8Array(this.memory.buffer);

        // Allocate and copy each binary region
        const mapPtr   = this.wasm.alloc(mapBytes.length);
        memU8.set(mapBytes, mapPtr);
        this.wasm.set_map(mapPtr, mapBytes.length);

        const tagsPtr  = this.wasm.alloc(tagsBytes.length);
        memU8.set(tagsBytes, tagsPtr);
        this.wasm.set_tags(tagsPtr, tagsBytes.length);

        const indexPtr = this.wasm.alloc(indexBytes.length);
        memU8.set(indexBytes, indexPtr);
        this.wasm.set_index(indexPtr, indexBytes.length);

        console.log("[ML] WASM loader initialized");
    }

    lookup(path) {
        const enc = new TextEncoder().encode(path);
        const mem = new Uint8Array(this.memory.buffer);
        const ptr = this.wasm.temp_ptr();

        mem.set(enc, ptr);
        const off = this.wasm.lookup_path(ptr, enc.length);
        return off === 0xffffffff ? null : off;
    }

    list_prefix(prefix) {
        const enc = new TextEncoder().encode(prefix);
        const mem = new Uint8Array(this.memory.buffer);
        const ptr = this.wasm.temp_ptr();

        mem.set(enc, ptr);

        const count = this.wasm.prefix_count(ptr, enc.length);
        const outPtr = this.wasm.prefix_ptr();
        const block = new Uint8Array(this.memory.buffer, outPtr, count * 256);

        let out = [];
        for (let i = 0; i < count; i++) {
            let slice = block.subarray(i * 256, i * 256 + 256);
            let nul = slice.indexOf(0);
            out.push(new TextDecoder().decode(slice.subarray(0, nul)));
        }
        return out;
    }

    preview(offset, nbytes = 2048) {
        const outPtr = this.wasm.preview_ptr();
        const size = this.wasm.read_preview(offset, nbytes);
        return new TextDecoder().decode(
            new Uint8Array(this.memory.buffer, outPtr, size)
        );
    }

    getTags(offset) {
        const ptr = this.wasm.get_tags(offset);
        const mem = new Uint8Array(this.memory.buffer);

        const dv = new DataView(this.memory.buffer);

        const size = dv.getBigUint64(ptr, true);
        let p = ptr + 8;

        let out = [];
        while (mem[p] !== 0) {
            out.push(mem[p]);
            p++;
        }

        return {
            size: Number(size),
            mime: new TextDecoder().decode(new Uint8Array(out)),
        };
    }
}
