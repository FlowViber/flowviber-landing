import { getRecipesIndex, getNodesIndex } from "./library";

const SYN: Record<string, string[]> = {
  "google sheets": ["google sheets", "gsheets", "googlesheets", "g-sheet", "g sheets"],
  gmail: ["gmail", "google mail"],
  slack: ["slack"],
  jira: ["jira"],
  trello: ["trello"],
  airtable: ["airtable"],
  notion: ["notion"],
  github: ["github"],
  stripe: ["stripe"],
  twilio: ["twilio", "sms"],
  webhook: ["webhook", "callback", "http hook"],
  cron: ["cron", "schedule", "daily", "weekly", "monthly"],
  email: ["email", "smtp", "send email"],
  openai: ["openai", "chatgpt", "gpt"]
};

const norm = (s: string) => (s || "").toLowerCase();

export function rankRecipes(query: string, top = 5) {
  const idx = getRecipesIndex(), nodes = getNodesIndex(), q = norm(query), targets = new Set<string>();
  
  for (const [k, arr] of Object.entries(SYN)) {
    if (arr.some(a => q.includes(a))) targets.add(k);
  }
  
  nodes.forEach((n: any) => {
    const dn = norm(n.displayName || n.name || "");
    if (dn && q.includes(dn)) targets.add(dn);
  });
  
  const score = (r: any) => {
    let s = 0;
    const d = (r.nodeDisplays || []).map(norm);
    const t = (r.nodeTypes || []).map(norm);
    const c = (r.credentials || []).map(norm);
    const g = (r.triggers || []).map(norm);
    
    targets.forEach(x => {
      if (d.some((v: string) => v.includes(x))) s += 5;
      else if (t.some((v: string) => v.includes(x))) s += 4;
      else if (c.some((v: string) => v.includes(x))) s += 3;
    });
    
    if (/\bcron|schedule|daily|weekly|monthly\b/.test(q) && g.some((z: string) => z.includes("cron"))) s += 4;
    if (q.includes("webhook") && g.some((z: string) => z.includes("webhook"))) s += 4;
    if (/\bcreate|add|insert\b/.test(q)) s += 1;
    if (/\bupdate|edit\b/.test(q)) s += 1;
    if (/\bdelete|remove\b/.test(q)) s += 1;
    if (/\bnotify|post|message|send\b/.test(q)) s += 1;
    
    return s + Math.min(r.nodesCount || 0, 10) * 0.2;
  };
  
  return idx.map((r: any) => ({ ...r, __score: score(r) }))
    .filter((r: any) => r.__score > 0)
    .sort((a: any, b: any) => b.__score - a.__score)
    .slice(0, top);
}