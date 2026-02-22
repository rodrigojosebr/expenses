# 💰 Gastos App (MVP)

Um aplicativo moderno, *voice-first*, focado na facilidade de registrar despesas do dia a dia. Chega de planilhas complicadas: apenas aperte um botão, fale o que gastou e deixe a Inteligência Artificial fazer o resto.

Atualmente em fase de MVP (usando Vercel KV) e em transição ativa para uma arquitetura robusta Multi-usuário SaaS (PostgreSQL + Prisma).

---

## ✨ Funcionalidades em Destaque

*   **🎙️ Registro por Voz (Voice-First):** Pressione o microfone e diga coisas como *"Ontem gastei 35 reais de Uber no cartão de crédito"*. O app entende linguagem natural, gírias e datas relativas.
*   **🤖 Inteligência Artificial (Google Gemini):** Alimentado pelo modelo `gemini-2.5-flash`, o sistema extrai automaticamente o valor (em centavos e formatado em R$), a descrição exata, a data e o método de pagamento (Crédito, Débito, Pix, Dinheiro).
*   **💡 Feedback Financeiro Imediato:** Assim que o gasto é salvo, você recebe um "choque de realidade" animado informando o total que você já gastou naquele mês, acompanhado de uma frase bem-humorada com o seu nome (ex: *"💸 Mais um pra conta, Raj! Dinheiro é pra circular mesmo"*).
*   **🎨 UI/UX Moderna e Fluida:** Construído com Next.js (App Router) e estilizado usando **PandaCSS** (zero-runtime CSS-in-JS), com animações de carregamento (`fadeIn`) e feedback visual claro para o usuário em transições.
*   **📊 Exportação de Dados:** Geração de relatórios mensais em `.csv` (Data; Valor; Descrição; Método de Pagamento) compatíveis com Excel.

---

## 🚀 Como Rodar Localmente

### 1. Pré-requisitos
*   Node.js (versão 20 ou superior)
*   Conta na Vercel (para provisionar o banco de dados KV)
*   Chave de API do Google Gemini (`GEMINI_API_KEY`)

### 2. Configuração Inicial

Clone o repositório e instale as dependências:
```bash
git clone <URL_DO_REPOSITORIO>
cd gastos-kv-mvp
npm install
```

Configure o PandaCSS e gere a pasta `styled-system/`:
```bash
npm run prepare
```

### 3. Variáveis de Ambiente (`.env.local`)
Copie o arquivo de exemplo e configure suas chaves:
```bash
cp .env.example .env.local
```

Dentro de `.env.local`, você precisará configurar:
1.  **Chave da IA:** Insira sua `GEMINI_API_KEY` gerada no Google AI Studio.
2.  **Chave do Banco de Dados:** Adicione o `KV_REST_API_URL` e `KV_REST_API_TOKEN` gerados pelo seu banco KV na Vercel.
3.  **Usuários de Teste:** O sistema de login provisório é baseado em um JSON mapeado. Mude o ID e Nome se desejar.

### 4. Rodando a Aplicação
Execute o servidor de desenvolvimento:
```bash
npm run dev
```
Acesse `http://localhost:3000/voice` no seu navegador (de preferência no celular para testar a responsividade e o microfone).

---

## 🏗️ Arquitetura Atual e Próximos Passos

O projeto segue a arquitetura **Clean Code**, separando claramente as camadas de Apresentação (UI), Regras de Negócio (Serviços de IA) e Acesso a Dados (Repositório).

Neste exato momento, concluímos as fases de Estilização (PandaCSS) e Inteligência Artificial (Gemini).

**Próxima Fase Imediata:**
Migração da base de dados (que hoje é NoSQL via Vercel KV) para **PostgreSQL Serverless (Neon)** usando o Prisma ORM, garantindo integridade de dados multi-usuário e abrindo caminho para o Dashboard administrativo. Acompanhe o arquivo `ROADMAP.md` para visualizar o status de cada etapa.

---

## 🛠️ Tecnologias Utilizadas

*   **Core:** Next.js (App Router) + TypeScript
*   **Estilização:** PandaCSS
*   **IA Parser:** Google Gemini SDK (`@google/genai`)
*   **Banco de Dados (Atual):** Vercel KV (Redis)
*   **Banco de Dados (Futuro):** Neon PostgreSQL + Prisma
