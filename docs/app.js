/*
  Ultra Explorer — Main Bootstrap
  Authoritative entry point
*/

import { AgentCore } from "./agent/core.js";
import { renderUI } from "./js/ui.js";
import { mountVisualizer } from "./js/visual_controller.js";
import { loadGitHubHome } from "./adapters/github_home_adapter.js";

const debugEl = document.getElementById("debug");

function dbg(msg) {
  if (debugEl) {
    debugEl.textContent += msg + "\n";
  }
  console.log(msg);
}

dbg("[BOOT] Ultra Explorer starting");

// ------------------------------------------------------------------
// Agent initialization
// ------------------------------------------------------------------
const agent = new AgentCore(dbg);

// Wire UI immediately
renderUI(agent, dbg);

// ------------------------------------------------------------------
// Load GitHub-backed HomeMap and activate system
// ------------------------------------------------------------------
(async () => {
  try {
    dbg("[LOAD] Loading GitHub HomeMap");

    const graph = await loadGitHubHome(dbg);
    agent.ingest("github", graph);

    dbg("[READY] HomeMap loaded");
    mountVisualizer(agent, dbg);

  } catch (e) {
    dbg("[FATAL] Load failed: " + (e?.message || e));
  }
})();
