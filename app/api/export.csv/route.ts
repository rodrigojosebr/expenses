import { NextResponse } from "next/server";
import { kv } from "@vercel/kv";
import { getUserIdFromApiKey } from "@/lib/gastos";

function csvEscape(v: string): string {
  if (/[;\n"]/.test(v)) return `"${v.replace(/"/g, '""')}"`;
  return v;
}

export async function GET(req: Request) {
  const url = new URL(req.url);

  // Excel/PowerQuery não manda header fácil; então aceitamos ?key=... também
  const apiKey = req.headers.get("x-api-key") ?? url.searchParams.get("key");
  const userId = getUserIdFromApiKey(apiKey);
  if (!userId) return new NextResponse("Unauthorized", { status: 401 });

  const month = url.searchParams.get("month"); // YYYY-MM
  if (!month || !/^\d{4}-\d{2}$/.test(month)) {
    return new NextResponse("Missing/invalid month (use YYYY-MM)", { status: 400 });
  }

  const idxKey = `u:${userId}:idx:${month}`;
  const eventIds = await kv.zrange<string[]>(idxKey, 0, -1);

  let csv = "Data;Valor;Descricao;Banco\n";
  if (!eventIds.length) {
    return new NextResponse(csv, {
      headers: {
        "content-type": "text/csv; charset=utf-8",
        "cache-control": "no-store",
      },
    });
  }

  const keys = eventIds.map((id) => `u:${userId}:e:${id}`);
  const events = await kv.mget<any[]>(...keys);

  for (const ev of events) {
    if (!ev) continue;
    const row = [
      csvEscape(String(ev.date ?? "")),
      csvEscape(String(ev.amountBRL ?? "")),
      csvEscape(String(ev.description ?? "")),
      csvEscape(String(ev.bank ?? "")),
    ].join(";");
    csv += row + "\n";
  }

  return new NextResponse(csv, {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "cache-control": "no-store",
    },
  });
}
