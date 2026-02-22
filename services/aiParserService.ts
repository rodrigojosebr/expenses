import { GoogleGenAI } from "@google/genai";

export interface ParsedExpense {
  amountCents: number;
  description: string;
  date: string; // YYYY-MM-DD
  paymentMethod: string;
}

export async function parseExpenseText(text: string): Promise<ParsedExpense | null> {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || 'DUMMY_KEY_FOR_BUILD' });

  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  const todayStr = `${year}-${month}-${day}`;

  const prompt = `
Você é um assistente financeiro de transcrição de voz.
Hoje é ${todayStr} (use se a data não for dita).
Corrija erros comuns de STT pelo contexto (ex: "pic" -> Pix, "shopp" -> Shopee, "chain" -> Shein). Mantenha "shopping" se for o local.

Retorne APENAS um JSON estrito:
{
  "amountCents": <inteiro em centavos. Ex: 18,70 = 1870. null se não achar>,
  "description": <string do gasto corrigida. Ex: "Bolsa na Shein">,
    "description": <string, a descrição do que foi comprado. Ex: "Bolsa no Carrefour". Se não houver, coloque "Sem descrição">,

  "date": <YYYY-MM-DD da compra>,
  "paymentMethod": <Crédito, Débito, Pix, Dinheiro, etc. "Não informado" se omitido>
}

Frase: "${text}"
`;

  try {
    const response = await ai.models.generateContent({
      // model: 'gemini-2.5-flash',
      model: 'gemini-2.5-flash-lite',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      }
    });

    const resultText = response.text;
    if (!resultText) return null;

    const parsed = JSON.parse(resultText) as ParsedExpense;

    // Validação básica para garantir que a IA retornou o formato esperado
    if (typeof parsed.amountCents !== 'number' || isNaN(parsed.amountCents)) {
      console.error("Validação falhou. amountCents não é número:", parsed);
      return null;
    }

    return parsed;
  } catch (error) {
    console.error("Erro no aiParserService:", error);
    return null;
  }
}
