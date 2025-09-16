import { NextRequest, NextResponse } from "next/server";
import { rankRecipes } from "@/lib/ranker";

export async function POST(req: NextRequest) {
  const { query, top } = await req.json();
  return NextResponse.json({ results: rankRecipes(query || "", top || 5) });
}