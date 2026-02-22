import { NextResponse } from "next/server";
import { kv } from "@vercel/kv";
import { getUserFromApiKey } from "@/lib/gastos";

function csvEscape(v: string): string {
  if (/[;\n"]/.test(v)) return `"${v.replace(/"/g, '""')}"`;
  return v;
}

export async function GET(req: Request) {
  const url = new URL(req.url);

  // Excel/PowerQuery não manda header fácil; então aceitamos ?key=... também
  const apiKey = req.headers.get("x-api-key") ?? url.searchParams.get("key");
  const user = getUserFromApiKey(apiKey);
  if (!user) return new NextResponse("Unauthorized", { status: 401 });

  const month = url.searchParams.get("month"); // Legacy support
  const from = url.searchParams.get("from") || month;
  const to = url.searchParams.get("to") || month;

  if (!from || !/^\d{4}-\d{2}$/.test(from)) {
    return new NextResponse("Missing/invalid start month (use YYYY-MM)", { status: 400 });
  }

  const [startYear, startMonthVal] = from.split("-").map(Number);
  const startDate = new Date(startYear, startMonthVal - 1);
  
  let endDate = startDate;
  if (to && /^\d{4}-\d{2}$/.test(to)) {
    const [endYear, endMonthVal] = to.split("-").map(Number);
    endDate = new Date(endYear, endMonthVal - 1);
  }

  if (endDate < startDate) {
    return new NextResponse("End date must be after start date", { status: 400 });
  }

  // Calculate month difference
  const diffMonths = (endDate.getFullYear() - startDate.getFullYear()) * 12 + (endDate.getMonth() - startDate.getMonth());
  
  if (diffMonths > 12) {
    return new NextResponse("Range cannot exceed 12 months", { status: 400 });
  }

  const monthsToQuery: string[] = [];
  const current = new Date(startDate);
  // Iterate through months correctly
  while (current <= endDate) {
    const y = current.getFullYear();
    const m = String(current.getMonth() + 1).padStart(2, '0');
    monthsToQuery.push(`${y}-${m}`);
    current.setMonth(current.getMonth() + 1);
  }

  let allEventIds: string[] = [];

  for (const m of monthsToQuery) {
    const idxKey = `u:${user.id}:idx:${m}`;
    const ids = await kv.zrange<string[]>(idxKey, 0, -1);
    if (ids && ids.length > 0) {
      allEventIds = allEventIds.concat(ids);
    }
  }

  let csv = "Data;Valor;Descricao;Metodo de Pagamento\n";
  if (!allEventIds.length) {
    const csvWithBOM = "\uFEFF" + csv;
    return new NextResponse(csvWithBOM, {
      headers: {
        "content-type": "text/csv; charset=utf-8",
        "cache-control": "no-store",
      },
    });
  }

  const uniqueKeys = Array.from(new Set(allEventIds)).map((id) => `u:${user.id}:e:${id}`);
  const events = await kv.mget<any[]>(...uniqueKeys);

  const validEvents = events.filter((ev) => ev !== null);
  validEvents.sort((a, b) => {
    if (!a.date || !b.date) return 0;
    return new Date(a.date).getTime() - new Date(b.date).getTime();
  });

  for (const ev of validEvents) {
    const row = [
      csvEscape(String(ev.date ?? "")),
      csvEscape(String(ev.amountBRL ?? "")),
      csvEscape(String(ev.description ?? "")),
      csvEscape(String(ev.paymentMethod ?? "")),
    ].join(";");
    csv += row + "\n";
  }

  // Add BOM for Excel compatibility
  const csvWithBOM = "\uFEFF" + csv;

  return new NextResponse(csvWithBOM, {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "cache-control": "no-store",
    },
  });
}
