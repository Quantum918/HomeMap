/*
  AgentCore — SigilAGI HomeMap Brain
  Deterministic reasoning over indexed data
*/

import { HomeReasoner } from "./reasoner.js";

export class AgentCore {
  constructor(debug) {
    this.debug = debug;
    this.knowledge = {};
    this.reasoner = new HomeReasoner(debug);
  }

  ingest(sourceName, graph) {
    this.knowledge[sourceName] = graph;
    const paths = graph.paths?.length || 0;
    this.debug(`[AGENT] Ingested ${sourceName} (${paths} paths)`);
  }

  listSources() {
    return Object.keys(this.knowledge);
  }

  describe() {
    let out = "This repository is self-describing.\n\n";
    for (const [name, g] of Object.entries(this.knowledge)) {
      out += `Source: ${name}\n`;
      out += this.reasoner.explain(g) + "\n";
    }
    return out;
  }

  search(term) {
    const q = term.toLowerCase();
    const results = [];

    for (const g of Object.values(this.knowledge)) {
      if (!g.paths) continue;
      for (const p of g.paths) {
        if (p.toLowerCase().includes(q)) {
          results.push(p);
          if (results.length >= 50) return results;
        }
      }
    }
    return results;
  }

  answer(query) {
    if (!query) return "Ask a question about the repository.";

    const reasoning = this.reasoner.answer(this.knowledge, query);
    if (reasoning) return reasoning;

    const q = query.toLowerCase();

    if (q.includes("list sources")) {
      return this.listSources().join("\n");
    }

    if (q.includes("find") || q.includes("search")) {
      const term = q.split(" ").slice(-1)[0];
      const hits = this.search(term);
      return hits.length
        ? hits.join("\n")
        : "No matches found.";
    }

    return (
      "I reason over this repository's structure.\n" +
      "Try asking:\n" +
      "• describe this repository\n" +
      "• explain the structure\n" +
      "• compare sources\n" +
      "• search <term>"
    );
  }
}
