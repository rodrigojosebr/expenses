import { NextResponse } from "next/server";
import { kv } from "@vercel/kv";
import {
  getUserFromApiKey,
  centsToBRL,
  newEventId,
} from "@/lib/gastos";
import { parseExpenseText } from "@/services/aiParserService";

export async function POST(req: Request) {
  try {
    const apiKey = req.headers.get("x-api-key");
    const timeZone = req.headers.get("x-timezone") || 'America/Sao_Paulo';
    const user = getUserFromApiKey(apiKey);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const text = String(body.text ?? body.valor ?? "").trim();
    if (!text) return NextResponse.json({ error: "Missing text" }, { status: 400 });

    const parsedExpense = await parseExpenseText(text, timeZone);
    if (!parsedExpense || parsedExpense.amountCents == null) {
      return NextResponse.json({ error: "Não consegui extrair as informações do seu gasto (valor, descrição). Tente falar de forma mais clara." }, { status: 400 });
    }

    const { amountCents, description, paymentMethod, date } = parsedExpense;

    // A data retornada pela IA é YYYY-MM-DD
    const [year, monthNum, day] = date.split('-');
    const dateBR = `${day}/${monthNum}/${year}`;
    const month = `${year}-${monthNum}`;
    
    // Calcula o timestamp (usando meio-dia da data para evitar fuso horário causando dia anterior)
    const tsDate = new Date(`${date}T12:00:00Z`);
    const ts = isNaN(tsDate.getTime()) ? Date.now() : tsDate.getTime();

    const eventId = newEventId();

    const eventKey = `u:${user.id}:e:${eventId}`;
    const idxKey = `u:${user.id}:idx:${month}`;

    const event = {
      id: eventId,
      user: { id: user.id, name: user.name },
      ts,
      date: dateBR,
      amountCents,
      amountBRL: centsToBRL(amountCents),
      description,
      paymentMethod,
      raw: text, // Sempre bom guardar a frase original caso precise depurar a IA depois
    };

    await kv.set(eventKey, event);
    await kv.zadd(idxKey, { score: ts, member: eventId });

    // --- Cálculo do Total Mensal ---
    // Puxa todos os IDs do mês atual
    const allEventIds = await kv.zrange<string[]>(idxKey, 0, -1);
    let monthlyTotalCents = 0;

    if (allEventIds.length > 0) {
      const keys = allEventIds.map(id => `u:${user.id}:e:${id}`);
      const events = await kv.mget<any[]>(...keys);
      monthlyTotalCents = events.reduce((acc, ev) => acc + (ev?.amountCents || 0), 0);
    }

    return NextResponse.json({ 
      ok: true, 
      event, 
      monthlyTotalBRL: centsToBRL(monthlyTotalCents) 
    });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "Erro" }, { status: 500 });
  }
}
