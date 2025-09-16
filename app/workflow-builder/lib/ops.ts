import { getNodesIndex, getResourceOps } from "./library";

export function validateOps(nodePathOrName: string, resource: string) {
  const rops = getResourceOps(), nodes = getNodesIndex();
  
  const byPath = Object.keys(rops).find(k => k.toLowerCase() === nodePathOrName.toLowerCase());
  let nodeKey = byPath;
  
  if (!nodeKey) {
    const hit = nodes.find((n: any) =>
      (n.displayName && n.displayName.toLowerCase().includes(nodePathOrName.toLowerCase())) ||
      (n.name && n.name.toLowerCase().includes(nodePathOrName.toLowerCase()))
    );
    if (hit) nodeKey = (hit.file as string).replace(/\\/g, "/");
  }
  
  if (nodeKey && rops[nodeKey] && rops[nodeKey][resource]) {
    return { kind: "Validated" as const, operations: rops[nodeKey][resource] };
  }
  
  const hit = nodes.find((n: any) =>
    (n.file && (n.file as string).replace(/\\/g, "/").toLowerCase() === (nodeKey || "").toLowerCase()) ||
    (n.displayName && n.displayName.toLowerCase().includes(nodePathOrName.toLowerCase())) ||
    (n.name && n.name.toLowerCase().includes(nodePathOrName.toLowerCase()))
  );
  
  if (hit && Array.isArray(hit.operations)) {
    return { kind: "Flat" as const, operations: hit.operations };
  }
  
  return { kind: "Unknown" as const, operations: [] };
}