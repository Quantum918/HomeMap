/*
  UI Layer — Ultra Explorer
  Owns all DOM interaction and user events
*/

export function renderUI(agent, dbg) {
  const askBtn    = document.getElementById("ask");
  const queryEl   = document.getElementById("query");
  const outputEl  = document.getElementById("output");
  const importBtn = document.getElementById("importLocal");
  const reloadBtn = document.getElementById("reload");

  if (!askBtn || !queryEl || !outputEl) {
    dbg("[UI ERROR] Required DOM elements missing");
    return;
  }

  dbg("[UI] Ready");

  askBtn.onclick = () => {
    const q = queryEl.value.trim();
    dbg("[UI] Query: " + q);
    try {
      const answer = agent.answer(q);
      outputEl.textContent = answer;
    } catch (e) {
      dbg("[UI ERROR] " + e.message);
    }
  };

  if (importBtn) {
    importBtn.onclick = async () => {
      dbg("[UI] Import local HOME requested");
      try {
        const mod = await import("../adapters/local_home_adapter.js");
        const graph = await mod.loadLocalHome(dbg);
        agent.ingest("local", graph);
        dbg("[UI] Local HOME ingested");
      } catch (e) {
        dbg("[UI ERROR] Local import failed: " + e.message);
      }
    };
  }

  if (reloadBtn) {
    reloadBtn.onclick = () => {
      dbg("[UI] Reloading");
      location.reload();
    };
  }
}
