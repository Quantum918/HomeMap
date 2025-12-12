/**
 * HomeMap Thinking Agent
 * ---------------------------------------------------------
 * Deterministic, context-aware reasoning engine operating
 * directly over the HomeMap index with:
 *   - Weighted scoring
 *   - Multi-document synthesis
 *   - Context extraction
 *   - Reasoning chain trace
 */

export class HomeAgentThinking {
    constructor(loader) {
        this.loader = loader;
    }

    normalize(text) {
        return text
            .toLowerCase()
            .replace(/[^a-z0-9_\-\/\. ]+/g, " ")
            .replace(/\s+/g, " ")
            .trim();
    }

    tokenize(text) {
        if (!text) return [];
        return this.normalize(text).split(" ");
    }

    scorePath(queryTokens, path, snippet) {
        const pathNorm = this.normalize(path);
        const snipNorm = this.normalize(snippet || "");
        let score = 0;

        for (const tok of queryTokens) {
            if (!tok) continue;
            if (pathNorm.includes(tok)) score += 3;
            if (snipNorm.includes(tok)) score += 2;
            if (pathNorm.startsWith(tok)) score += 1;
        }
        return score;
    }

    extractContext(snippet, windowSize = 380) {
        if (!snippet) return "";
        if (snippet.length <= windowSize) return snippet;
        return snippet.slice(0, windowSize) + "...";
    }

    synthesize(matches, maxDocs = 5) {
        const top = matches.slice(0, maxDocs);
        let synthesis = "";
        for (const m of top) {
            synthesis += `[${m.path}]\n${m.context}\n\n`;
        }
        return synthesis.trim();
    }

    buildReasoningChain(query, matches) {
        const tokens = this.tokenize(query);
        const lines = [];
        lines.push(`Reasoning chain for: "${query}"`);
        lines.push(`Tokens: ${tokens.join(", ")}`);
        lines.push("");

        for (const m of matches.slice(0, 10)) {
            lines.push(
                `Path: ${m.path}\n` +
                `  Score: ${m.score}\n` +
                `  Snippet: ${m.snippet.split("\n")[0]}`
            );
        }

        return lines.join("\n");
    }

    async answer(query) {
        const qNorm = this.normalize(query);
        const qTokens = this.tokenize(qNorm);

        const allPaths = this.loader.list_prefix("/");
        const matches = [];

        for (const p of allPaths) {
            const offset = this.loader.lookup(p);
            if (!offset) continue;

            const raw = this.loader.preview(offset, 2000);
            const lowered = raw.toLowerCase();

            let relevant = false;
            for (const tok of qTokens) {
                if (tok && (p.toLowerCase().includes(tok) || lowered.includes(tok))) {
                    relevant = true;
                    break;
                }
            }

            if (!relevant) continue;

            const snippet = raw.split("\n")[0];
            const context = this.extractContext(raw);
            const score = this.scorePath(qTokens, p, raw);

            matches.push({ path: p, snippet, context, score });
        }

        if (matches.length === 0) {
            return `[HomeMap Thinking Agent]

Query: "${query}"
No relevant documents found.`;
        }

        matches.sort((a, b) => b.score - a.score);

        const synthesis = this.synthesize(matches);
        const reasoning = this.buildReasoningChain(query, matches);

        const topList = matches.slice(0, 10).map(m =>
            `· ${m.path} (score=${m.score})\n    ${m.snippet}`
        ).join("\n\n");

        return (
`[HomeMap Thinking Agent]

Query: "${query}"

Top Results:
${topList}

------------------------------------------------------------
Context-Aware Synthesis
------------------------------------------------------------
${synthesis}

------------------------------------------------------------
Deterministic Reasoning Chain
------------------------------------------------------------
${reasoning}
`
        );
    }
}
