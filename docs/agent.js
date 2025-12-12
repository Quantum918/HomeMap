export class HomeMapAgent {
  constructor(wasm) {
    this.wasm = wasm;
  }

  search(query, limit = 20) {
    const results = [];
    const prefixes = query.split(/\s+/);

    for (const p of prefixes) {
      const matches = this.wasm._list_prefix(p);
      for (const m of matches) {
        results.push({
          path: m,
          score: this.score(m, query),
          snippet: this.preview(m)
        });
      }
    }

    return results
      .sort((a,b)=>b.score-a.score)
      .slice(0, limit);
  }

  score(path, query) {
    let s = 0;
    for (const t of query.toLowerCase().split(/\s+/)) {
      if (path.toLowerCase().includes(t)) s += 2;
    }
    return s;
  }

  preview(path) {
    const off = this.wasm._lookup_path(path);
    if (off === 0xffffffff) return "";
    return this.wasm._read_preview(off, 256);
  }

  think(query) {
    const matches = this.search(query);

    const reasoning = [
      `Query: "${query}"`,
      `Scanned ${matches.length} candidate paths`,
      `Ranked by lexical + prefix relevance`
    ];

    return {
      reasoning,
      evidence: matches
    };
  }
}
