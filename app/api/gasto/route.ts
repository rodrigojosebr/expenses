import { NextResponse } from "next/server";
import { kv } from "@vercel/kv";
import {
  getUserFromApiKey,
  todayBR,
  monthKeyFromDate,
  parseAmountCents,
  detectBank,
  buildDescription,
  centsToBRL,
  newEventId,
} from "@/lib/gastos";

export async function POST(req: Request) {
  try {
    const apiKey = req.headers.get("x-api-key");
    const user = getUserFromApiKey(apiKey);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const text = String(body.text ?? body.valor ?? "").trim();
    if (!text) return NextResponse.json({ error: "Missing text" }, { status: 400 });

    const amountCents = parseAmountCents(text);
    if (amountCents == null) {
      return NextResponse.json({ error: "Não encontrei valor na frase." }, { status: 400 });
    }

    const now = new Date();
    const ts = now.getTime(); // ms
    const dateBR = todayBR(now);
    const month = monthKeyFromDate(now);

    const bank = detectBank(text);
    const description = buildDescription(text);

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
      bank,
      raw: text,
    };

    await kv.set(eventKey, event);
    await kv.zadd(idxKey, { score: ts, member: eventId });

    return NextResponse.json({ ok: true, event });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "Erro" }, { status: 500 });
  }
}
