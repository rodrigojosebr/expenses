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
Você é um assistente financeiro especializado em extrair dados de despesas a partir de transcrições de voz.
Hoje é dia ${todayStr}.
Se o usuário não mencionar uma data na frase, assuma que a compra foi feita hoje (${todayStr}).

Extraia as seguintes informações da frase do usuário e retorne APENAS um JSON estrito, sem formatação markdown ou crases ao redor:
{
  "amountCents": <número inteiro, o valor da despesa em centavos. Ex: 18 reais e 70 centavos = 1870. Se não encontrar valor retorne null>,
  "description": <string, a descrição do que foi comprado. Ex: "Bolsa no Carrefour". Se não houver, coloque "Sem descrição">,
  "date": <string, a data da compra no formato YYYY-MM-DD. Ex: "2026-12-21">,
  "paymentMethod": <string, o método de pagamento mencionado (ex: Crédito, Débito, Pix, Dinheiro, etc). Se não for mencionado, coloque "Não informado">
}

Frase do usuário: "${text}"
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
