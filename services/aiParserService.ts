import { GoogleGenAI } from "@google/genai";

export interface ParsedExpense {
  amountCents: number;
  description: string;
  date: string; // YYYY-MM-DD
  paymentMethod: string;
};

export async function parseExpenseText(text: string, timeZone: string = 'America/Sao_Paulo'): Promise<ParsedExpense | null> {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || 'DUMMY_KEY_FOR_BUILD' });

  // Obter a data no fuso horário fornecido para evitar problemas de data
  const todayStr = new Intl.DateTimeFormat('en-CA', { timeZone }).format(new Date());

  const prompt = `
    Você é um assistente financeiro de transcrição de voz.
    Hoje é ${todayStr} (use se a data não for dita).

    Instruções de Formatação:
    1. Corrija erros comuns de STT pelo contexto (ex: "pic" -> Pix, "shopp" -> Shopee, "chain" -> Shein). Mantenha "shopping" se for o local.
    2. Descrição: Deve ser amigável e informativa, mantendo características que ajudem a identificar o item como local da compra, motivo, destino característica (ex: "Pincel Macio em São Paulo", "Hambúrguer Artesanal delicioso na Hamburgueria do João", "Blusinha linda para Ana Clara na C&A do Shopping Maia"). Evite apenas uma palavra genérica se houver detalhes relevantes.

    Retorne APENAS um JSON estrito:
    {
      "amountCents": <inteiro em centavos. Ex: 18,70 = 1870. null se não achar>,
      "description": <string, a descrição do gasto corrigida>,
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
        temperature: 0,
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

export async function analyzeExpensesStream(expensesData: string) {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || 'DUMMY_KEY_FOR_BUILD' });

  const prompt = `
Você agora é o "Gastão", o consultor financeiro oficial e mascote do aplicativo Gast.ai. 
Sua personalidade é de um parceiro divertido, um pouco irônico sarcástico quando a pessoa gasta demais, mas sempre dando conselhos reais e úteis para salvar o bolso do usuário no fim do mês.
Abaixo está uma lista de gastos de um usuário em formato JSON/CSV simplificado.

Faça uma análise breve e construtiva desses gastos agindo como o Gastão. Sempre comece se apresentando rapidamente (Ex: "E aí! Aqui é o Gastão! Vamos ver como foi esse período...") e depois responda às seguintes perguntas de forma clara, direta e amigável sem citar as perguntas mas como uma conversa mesmo
- Maior gasto do período?
- Analisar em que tipo gasto se concentrou o maior volume financeiro ( Ex: "mercado, lanchonete, deliverys ou outro tipo de estabelecimento ou tipo de gasto")
- Há algum padrão preocupante de gastos?
- Dê uma dica curta, amigável e bem-humorada de como ele pode economizar no período seguinte levando em conta a análise deste mês.

Não seja muito formal, use gírias leves e emojis moderadamente. 
IMPORTANTE: NÃO USE formatação Markdown (como ** ou * para negrito/listas). Escreva em texto puro, usando traços (-) normais para listas e letras maiúsculas para dar ênfase a palavras importantes se necessário.
Seja conciso (máximo de 3 parágrafos curtos).

DADOS DOS GASTOS:
${expensesData}
`;

  try {
    return await ai.models.generateContentStream({
      model: 'gemini-2.5-flash-lite',
      contents: prompt,
      config: {
        temperature: 0,
      }
    });
  } catch (error) {
    console.error("Erro ao analisar gastos com a IA:", error);
    throw error;
  }
};
