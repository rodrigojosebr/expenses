import { NextResponse } from "next/server";
import { getUserFromApiKey } from "@/lib/gastos";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const apiKey = req.headers.get("x-api-key") ?? url.searchParams.get("key");
  const user = getUserFromApiKey(apiKey);

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.json({ user });
}
