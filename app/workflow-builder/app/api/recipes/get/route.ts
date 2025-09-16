import { NextRequest, NextResponse } from "next/server";
import { getRecipeById } from "@/lib/recipes";

export async function POST(req: NextRequest) {
  const { id } = await req.json();
  return NextResponse.json({ workflow: await getRecipeById(id) });
}