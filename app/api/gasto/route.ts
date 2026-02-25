import { NextResponse } from "next/server";
import { getUserFromApiKey, centsToBRL } from "@/lib/gastos";
import { parseExpenseText } from "@/services/aiParserService";
import { ExpenseRepository } from "@/repositories/expenseRepository";
import { createExpenseSchema } from "@/schemas/expenseSchema";

// Mapa temporário: liga o sistema antigo (Vercel KV) aos IDs reais do novo Neon (Postgres)
// Isso nos permite testar a IA -> Postgres sem quebrar o front-end atual!
const oldToNewUsers: Record<string, string> = {
  "user_1a2b3c": "e73e369d-6f36-405c-b14c-a0de1e1dfe24", // raj
  "user_4d5e6f": "dd50741b-a835-4c3f-80d2-f27d7f742864"  // roseane
};

export async function POST(req: Request) {
  try {
    const apiKey = req.headers.get("x-api-key");
    const oldUser = getUserFromApiKey(apiKey);
    if (!oldUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Busca o novo UUID do banco relacional
    const newUserId = oldToNewUsers[oldUser.id];
    if (!newUserId) return NextResponse.json({ error: "Usuário não migrado para o banco novo" }, { status: 500 });

    const body = await req.json().catch(() => ({}));
    const text = String(body.text ?? body.valor ?? "").trim();
    if (!text) return NextResponse.json({ error: "Missing text" }, { status: 400 });

    // Chama o Google Gemini (IA)
    const parsedExpense = await parseExpenseText(text);
    if (!parsedExpense || parsedExpense.amountCents == null) {
      return NextResponse.json({ error: "Não consegui extrair as informações do seu gasto (valor, descrição). Tente falar de forma mais clara." }, { status: 400 });
    }

    // 1. Prepara os dados brutos para validação
    const expenseData = {
      ...parsedExpense,
      rawText: text,
      userId: newUserId
    };

    // 2. Validação Estrita (Zod)
    const validationResult = createExpenseSchema.safeParse(expenseData);
    if (!validationResult.success) {
      console.error("Zod Error", validationResult.error);
      return NextResponse.json({ error: "Dados extraídos pela IA são inválidos pro banco." }, { status: 400 });
    }

    // 3. Salva no banco PostgreSQL usando Arquitetura Limpa
    const savedExpense = await ExpenseRepository.create(validationResult.data);

    // 4. Cálculo do Total Mensal (Buscando direto do Postgres)
    const allUserExpenses = await ExpenseRepository.findByUserId(newUserId);

    // Pega o YYYY-MM do mês atual (UTC)
    const currentMonth = new Date().toISOString().slice(0, 7);

    const monthlyTotalCents = allUserExpenses
      // Filtra apenas os que pertencem ao mês corrente
      .filter(exp => exp.date.toISOString().startsWith(currentMonth))
      .reduce((acc, exp) => acc + exp.amountCents, 0);

    // 5. Devolve para o front-end (adaptando para a interface que ele já espera)
    const event = {
      id: savedExpense.id,
      user: { id: oldUser.id, name: oldUser.name },
      date: savedExpense.date.toISOString().split('T')[0].split('-').reverse().join('/'),
      amountCents: savedExpense.amountCents,
      amountBRL: centsToBRL(savedExpense.amountCents),
      description: savedExpense.description,
      paymentMethod: savedExpense.paymentMethod,
    };

    return NextResponse.json({
      ok: true,
      event,
      monthlyTotalBRL: centsToBRL(monthlyTotalCents)
    });
  } catch (e: any) {
    console.error("Erro Crítico na Rota de Gastos:", e);
    return NextResponse.json({ error: e?.message ?? "Erro" }, { status: 500 });
  }
}
