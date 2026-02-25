import { NextResponse } from "next/server";
import { getUserFromApiKey, centsToBRL } from "@/lib/gastos";
import { ExpenseRepository } from "@/repositories/expenseRepository";

// Mapper temporário do sistema antigo pro novo Postgres
const oldToNewUsers: Record<string, string> = {
  "user_1a2b3c": "e73e369d-6f36-405c-b14c-a0de1e1dfe24", // raj
  "user_4d5e6f": "dd50741b-a835-4c3f-80d2-f27d7f742864"  // roseane
};

function csvEscape(v: string): string {
  if (/[;\n"]/.test(v)) return `"${v.replace(/"/g, '""')}"`;
  return v;
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);

    // Excel/PowerQuery não manda header fácil; então aceitamos ?key=... também
    const apiKey = req.headers.get("x-api-key") ?? url.searchParams.get("key");
    const oldUser = getUserFromApiKey(apiKey);
    if (!oldUser) return new NextResponse("Unauthorized", { status: 401 });

    const newUserId = oldToNewUsers[oldUser.id];
    if (!newUserId) return new NextResponse("Usuário não migrado", { status: 500 });

    const month = url.searchParams.get("month"); // Legacy support
    const from = url.searchParams.get("from") || month;
    const to = url.searchParams.get("to") || month;

    if (!from || !/^\d{4}-\d{2}$/.test(from)) {
      return new NextResponse("Mês de início inválido (use YYYY-MM)", { status: 400 });
    }

    // Puxa tudo e filtra na memória para o MVP (no futuro podemos usar where: { date: { gte, lte } })
    const allUserExpenses = await ExpenseRepository.findByUserId(newUserId);

    // Cálculo dos limites do período (UTC)
    const [startYear, startMonthVal] = from.split("-").map(Number);
    const startDate = new Date(startYear, startMonthVal - 1, 1);

    let endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + 1); // Final do primeiro mês

    if (to && /^\d{4}-\d{2}$/.test(to)) {
      const [endYear, endMonthVal] = to.split("-").map(Number);
      endDate = new Date(endYear, endMonthVal, 1); // Primeiro dia do mês seguinte ao 'to'
    }

    const validEvents = allUserExpenses.filter(ev => ev.date >= startDate && ev.date < endDate);

    // Ordena por data crescente
    validEvents.sort((a, b) => a.date.getTime() - b.date.getTime());

    let csv = "Data;Valor;Descricao;Metodo de Pagamento\n";

    for (const ev of validEvents) {
      const dateFormatted = ev.date.toISOString().split('T')[0].split('-').reverse().join('/');
      const row = [
        csvEscape(dateFormatted),
        csvEscape(centsToBRL(ev.amountCents)),
        csvEscape(ev.description),
        csvEscape(ev.paymentMethod),
      ].join(";");
      csv += row + "\n";
    }

    // Add BOM for Excel compatibility with accents (ç, ã, etc)
    const csvWithBOM = "\uFEFF" + csv;

    return new NextResponse(csvWithBOM, {
      headers: {
        "content-type": "text/csv; charset=utf-8",
        "cache-control": "no-store",
      },
    });
  } catch (e: any) {
    console.error("Erro na Exportação CSV:", e);
    return new NextResponse("Erro interno no servidor", { status: 500 });
  }
}
