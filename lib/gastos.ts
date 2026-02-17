import crypto from "crypto";

export type UserId = "raj" | "roseane";

export function getUserIdFromApiKey(apiKey: string | null): UserId | null {
  if (!apiKey) return null;
  const raw = process.env.USER_KEYS_JSON;
  if (!raw) return null;
  const map = JSON.parse(raw) as Record<string, UserId>;
  return map[apiKey] ?? null;
}

export function todayBR(d = new Date()): string {
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

export function monthKeyFromDate(d = new Date()): string {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  return `${yyyy}-${mm}`;
}

export function parseAmountCents(text: string): number | null {
  const s = String(text || "");
  const m = s.match(/(\d{1,6})([,.](\d{1,2}))?/);
  if (!m) return null;
  const intPart = parseInt(m[1], 10);
  const dec = (m[3] ?? "00").padEnd(2, "0");
  const decPart = parseInt(dec, 10);
  return intPart * 100 + decPart;
}

export function centsToBRL(cents: number): string {
  const intPart = Math.floor(cents / 100);
  const decPart = String(Math.abs(cents) % 100).padStart(2, "0");
  return `${intPart},${decPart}`;
}

function hasBB(t: string): boolean {
  return /\bbb\b/.test(t);
}

export function detectBank(text: string): string {
  const t = text.toLowerCase();
  if (t.includes("nubank") || t.includes("nu ")) return "Nubank";
  if (t.includes("inter")) return "Inter";
  if (t.includes("itau") || t.includes("itaú")) return "Itaú";
  if (t.includes("bradesco")) return "Bradesco";
  if (t.includes("santander")) return "Santander";
  if (t.includes("caixa")) return "Caixa";
  if (t.includes("banco do brasil") || hasBB(t)) return "Banco do Brasil";
  if (t.includes("pix")) return "Pix";
  if (t.includes("dinheiro")) return "Dinheiro";
  return "Não informado";
}

export function buildDescription(text: string): string {
  let t = String(text || "").trim();
  t = t.replace(/(\d{1,6})([,.]\d{1,2})?/, "").trim();
  t = t.replace(/\b(nubank|nu|inter|itau|itaú|bradesco|santander|caixa|bb|banco do brasil|pix|dinheiro)\b/gi, "").trim();
  t = t.replace(/\s+/g, " ").trim();
  return t || "Sem descrição";
}

export function newEventId(): string {
  return crypto.randomUUID();
}
