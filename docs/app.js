import { HomeMapAgent } from "./agent.js";

function dbg(m){ 
  debug.textContent += m + "\n"; 
  console.log(m);
}

let Ultra = null;
let Agent = null;

document.addEventListener("DOMContentLoaded", async () => {
  dbg("[BOOT] Starting Ultra Explorer V9");

  const base = location.pathname.replace(/[^\/]+$/, "");
  const loader = await import(base + "manifest_loader.js");

  Ultra = await loader.default({
    locateFile: p => base + "bin/" + p
  });

  dbg("[WASM] Loaded");

  // Load binaries via manifests
  const loadBin = async (name) => {
    const m = await fetch(base+"data/"+name+".manifest.json").then(r=>r.json());
    const parts = [];
    for (const p of m.parts) {
      dbg("[FETCH] "+p);
      parts.push(await fetch(base+"data/"+p).then(r=>r.arrayBuffer()));
    }
    const size = parts.reduce((s,b)=>s+b.byteLength,0);
    const buf = new Uint8Array(size);
    let off=0;
    for (const b of parts){ buf.set(new Uint8Array(b),off); off+=b.byteLength; }
    return buf;
  };

  const map  = await loadBin("home.map.bin");
  const tags = await loadBin("home.tags.bin");
  const idx  = await loadBin("home.index.bin");

  Ultra._load_map(map);
  Ultra._load_tags(tags);
  Ultra._load_index(idx);

  dbg("[DATA] HomeMap loaded into WASM");

  Agent = new HomeMapAgent(Ultra);

  buildTree("/");
  wireChat();
});

function buildTree(prefix){
  tree.innerHTML="";
  const items = Ultra._list_prefix(prefix);
  for(const p of items){
    const d=document.createElement("div");
    d.textContent=p;
    d.onclick=()=>selectPath(p);
    tree.appendChild(d);
  }
}

function selectPath(p){
  fileTitle.textContent=p;
  metaPath.textContent=p;
  const off=Ultra._lookup_path(p);
  if(off!==0xffffffff){
    preview.textContent=Ultra._read_preview(off,1024);
    metaSize.textContent=Ultra._get_size(off);
    metaType.textContent=Ultra._get_mime(off);
  }
}

function wireChat(){
  chatSend.onclick=()=>{
    const q=chatInput.value.trim();
    if(!q)return;
    const out=Agent.think(q);
    chatLog.textContent +=
      "\n> "+q+"\n"+
      out.reasoning.join("\n")+"\n\n"+
      out.evidence.map(e=>`• ${e.path}\n  ${e.snippet}`).join("\n\n")+
      "\n";
  };
}
