import { getRecipesIndex } from "./library";

const LRU = new Map<string, any>();
const cache = (k: string, v: any) => {
  if (LRU.size > 50) {
    const key = LRU.keys().next().value
    if (key) {
      LRU.delete(key)
    }
  }
  LRU.set(k, v);
};

const rawUrl = (sourcePath: string) => {
  const [repo, ...rest] = sourcePath.split("/");
  const owner = repo === "n8n-free-templates" ? "wassupjay" : "Zie619";
  return `https://raw.githubusercontent.com/${owner}/${repo || "unknown"}/main/${rest.join("/")}`;
};

export async function getRecipeById(id: string) {
  if (LRU.has(id)) return LRU.get(id);
  
  const rec = getRecipesIndex().find((r: any) => r.id === id);
  if (!rec) throw new Error("Recipe not in index");
  
  const res = await fetch(rawUrl(rec.sourcePath));
  if (!res.ok) throw new Error(`Fetch failed ${res.status}`);
  
  const obj = await res.json();
  cache(id, obj);
  return obj;
}