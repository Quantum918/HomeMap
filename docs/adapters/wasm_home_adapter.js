export class WasmHomeAdapter {
  constructor(base, dbg) {
    this.base = base;
    this.dbg = dbg;
  }

  async fetchManifest(name) {
    const url = `${this.base}data/${name}.manifest.json`;
    this.dbg("[MANIFEST] " + url);
    return fetch(url).then(r => r.json());
  }

  async loadBinary(manifest) {
    const buffers = [];
    for (const part of manifest.parts) {
      const url = `${this.base}data/${part}`;
      this.dbg("[FETCH] " + url);
      const buf = await fetch(url).then(r => r.arrayBuffer());
      buffers.push(new Uint8Array(buf));
    }
    return buffers;
  }

  async load() {
    const mapM = await this.fetchManifest("home.map.bin");
    const tagsM = await this.fetchManifest("home.tags.bin");
    const idxM  = await this.fetchManifest("home.index.bin");

    const graph = {
      paths: mapM.paths || [],
      tags: tagsM.tags || {},
      index: idxM.index || {}
    };

    this.dbg("[LOAD] GitHub HomeMap graph ready");
    return graph;
  }
}
