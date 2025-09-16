import { NextRequest, NextResponse } from "next/server";
import { validateOps } from "@/lib/ops";

export async function POST(req: NextRequest) {
  const { node, resource } = await req.json();
  return NextResponse.json(validateOps(node, resource));
}