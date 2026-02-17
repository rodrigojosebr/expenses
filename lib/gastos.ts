import crypto from "crypto";

export type User = {
  id: string;
  name: string;
};

export function getUserFromApiKey(apiKey: string | null): User | null {
  if (!apiKey) return null;
  const raw = process.env.USER_KEYS_JSON;
  if (!raw) return null;
  const map = JSON.parse(raw) as Record<string, User>;
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

const numerosPorExtenso: { [key: string]: number } = {
  um: 1, dois: 2, tres: 3, quatro: 4, cinco: 5,
  seis: 6, sete: 7, oito: 8, nove: 9, dez: 10,
  onze: 11, doze: 12, treze: 13, catorze: 14, quinze: 15,
  dezesseis: 16, dezessete: 17, dezoito: 18, dezenove: 19,
  vinte: 20, trinta: 30, quarenta: 40, cinquenta: 50,
  sessenta: 60, setenta: 70, oitenta: 80, noventa: 90,
  cem: 100, duzentos: 200, trezentos: 300, quatrocentos: 400,
  quinhentos: 500, seiscentos: 600, setecentos: 700,
  oitocentos: 800, novecentos: 900, mil: 1000,
};

function parseNumeroPorExtenso(texto: string): number | null {
  const palavras = texto.toLowerCase().match(/[a-z]+/g) || [];
  let valor = 0;
  let valorParcial = 0;

  palavras.forEach(palavra => {
    if (numerosPorExtenso[palavra]) {
      if (numerosPorExtenso[palavra] === 1000) {
        valorParcial = valorParcial === 0 ? 1000 : valorParcial * 1000;
        valor += valorParcial;
        valorParcial = 0;
      } else if (numerosPorExtenso[palavra] >= 100) {
        valorParcial += numerosPorExtenso[palavra];
      } else {
        valorParcial += numerosPorExtenso[palavra];
      }
    } else if (palavra === 'e' && valorParcial > 0) {
      valor += valorParcial;
      valorParcial = 0;
    }
  });
  valor += valorParcial;

  return valor > 0 ? valor : null;
}

export function parseAmountCents(text: string): number | null {
  const s = String(text || "").toLowerCase();

  // 1. Tenta com números (ex: "32,90", "32.90", "32")
  const matchNumerico = s.match(/(\d{1,6})([,.](\d{1,2}))?/);
  if (matchNumerico) {
    const intPart = parseInt(matchNumerico[1], 10);
    const dec = (matchNumerico[3] ?? "00").padEnd(2, "0");
    const decPart = parseInt(dec, 10);
    return intPart * 100 + decPart;
  }

  // 2. Tenta com números por extenso
  const valorPorExtenso = parseNumeroPorExtenso(s.replace(/reais|real/g, ''));

  if (valorPorExtenso !== null) {
    return valorPorExtenso * 100;
  }
  return null;
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
  if (t.includes("caixa economica federal")) return "Caixa Econômica Federal";
  if (t.includes("caixa")) return "Caixa";
  if (t.includes("banco do brasil") || hasBB(t)) return "Banco do Brasil";
  if (t.includes("btg")) return "BTG Pactual";
  if (t.includes("pix")) return "Pix";
  if (t.includes("dinheiro")) return "Dinheiro";
  return "Não informado";
}

export function buildDescription(text: string): string {
  let t = String(text || "").trim().toLowerCase();

  // Remove o símbolo 'r$' primeiro, sem 'word boundary'
  t = t.replace(/r\$/g, ' ').trim();

  // Remove o valor numérico
  t = t.replace(/(\d{1,6})([,.]\d{1,2})?/, " ").trim();

  // Remove palavras-chave de valor (números por extenso, 'reais', etc.)
  const palavrasValor = Object.keys(numerosPorExtenso).join('|');
  const regexValor = new RegExp(`\\b(${palavrasValor}|e|reais|real)\\b`, 'gi');
  t = t.replace(regexValor, " ").trim();

  // Remove bancos
  const bankKeywords = [
    "nubank", "nu", "inter", "itau", "itaú", "bradesco", "santander", 
    "caixa economica federal", "caixa", "bb", "banco do brasil", 
    "btg pactual", "btg", "pix", "dinheiro"
  ].join('|');
  const regexBank = new RegExp(`\\b(${bankKeywords})\\b`, 'gi');
  t = t.replace(regexBank, " ").trim();

  // Limpa espaços extras
  t = t.replace(/\s+/g, " ").trim();

  return t || "Sem descrição";
}

export function newEventId(): string {
  return crypto.randomUUID();
}
