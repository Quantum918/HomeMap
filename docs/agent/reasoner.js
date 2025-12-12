/*
  HomeReasoner
  Deterministic structural reasoning over HomeMap graphs
*/

function commonPrefix(a, b) {
  let i = 0;
  while (i < a.length && i < b.length && a[i] === b[i]) i++;
  return a.slice(0, i);
}

function groupByPrefix(paths, depth = 2) {
  const groups = {};
  for (const p of paths) {
    const parts = p.split("/").filter(Boolean);
    const key = parts.slice(0, depth).join("/") || "/";
    if (!groups[key]) groups[key] = [];
    groups[key].push(p);
  }
  return groups;
}

export class HomeReasoner {
  constructor(debug) {
    this.debug = debug;
  }

  summarize(graph) {
    const paths = graph.paths || [];
    const tags = graph.tags || {};

    const prefixGroups = groupByPrefix(paths, 2);
    const largestDirs = Object.entries(prefixGroups)
      .map(([k, v]) => ({ dir: k, count: v.length }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return {
      pathCount: paths.length,
      tagCount: Object.keys(tags).length,
      largestDirs
    };
  }

  explain(graph) {
    const s = this.summarize(graph);
    let out = "";

    out += `This source contains ${s.pathCount} indexed paths.\n`;
    out += `It uses ${s.tagCount} semantic tags.\n\n`;

    if (s.largestDirs.length) {
      out += "Major structural regions:\n";
      for (const d of s.largestDirs) {
        out += `• ${d.dir}/ — ${d.count} items\n`;
      }
      out += "\n";
    }

    if (s.tagCount > 0) {
      out += "Tags describe semantic groupings over paths.\n";
    } else {
      out += "No semantic tags were detected in this source.\n";
    }

    return out;
  }

  compare(aName, a, bName, b) {
    const aPaths = new Set(a.paths || []);
    const bPaths = new Set(b.paths || []);

    let common = 0;
    for (const p of aPaths) {
      if (bPaths.has(p)) common++;
    }

    return (
      `Comparison between ${aName} and ${bName}:\n\n` +
      `• ${aName} paths: ${aPaths.size}\n` +
      `• ${bName} paths: ${bPaths.size}\n` +
      `• Shared paths: ${common}\n`
    );
  }

  answer(graphs, query) {
    const q = query.toLowerCase();

    if (q.includes("what is this") || q.includes("describe")) {
      let out = "This system indexes and explains its own structure.\n\n";
      for (const [name, g] of Object.entries(graphs)) {
        out += `Source: ${name}\n`;
        out += this.explain(g);
      }
      return out;
    }

    if (q.includes("structure") || q.includes("organized")) {
      let out = "";
      for (const [name, g] of Object.entries(graphs)) {
        out += `Structure of ${name}:\n`;
        out += this.explain(g) + "\n";
      }
      return out;
    }

    if (q.includes("compare") && Object.keys(graphs).length >= 2) {
      const names = Object.keys(graphs);
      return this.compare(
        names[0], graphs[names[0]],
        names[1], graphs[names[1]]
      );
    }

    return null;
  }
}
