# gastos-kv-mvp

MVP para registrar gastos via webhook e exportar um CSV por mês, usando Vercel KV como banco de dados.

## Como Rodar

### Pré-requisitos

- Node.js (versão 20 ou superior)
- npm
- Uma conta na Vercel com o Vercel KV habilitado.

### Configuração

1.  **Clone o repositório:**
    ```bash
    git clone <URL_DO_REPOSITORIO>
    cd gastos-kv-mvp
    ```

2.  **Instale a Vercel CLI:**
    Se você não tiver a Vercel CLI instalada, instale-a globalmente:
    ```bash
    npm install -g vercel
    ```

3.  **Conecte com a Vercel:**
    Faça o link do seu projeto local com o seu projeto na Vercel. Isso vai permitir o download das variáveis de ambiente corretas.
    ```bash
    vercel link
    ```

4.  **Baixe as Variáveis de Ambiente:**
    Copie o arquivo de exemplo `.env.example` para `.env.local` e puxe as variáveis de ambiente do Vercel KV para ele.
    ```bash
    cp .env.example .env.local
    vercel env pull .env.local
    ```
    Este comando irá preencher seu arquivo `.env.local` com as chaves necessárias para a conexão com o banco de dados KV.

5.  **Configure suas Chaves de API:**
    Edite o arquivo `.env.local` e, na variável `USER_KEYS_JSON`, substitua as chaves de API de exemplo por suas próprias chaves seguras.

### Instalação

Instale as dependências do projeto:
```bash
npm install
```

### Rodando em Desenvolvimento

Execute o servidor de desenvolvimento:
```bash
npm run dev
```

## Endpoints

### `POST /api/gasto`

Registra um novo gasto.

-   **Header:** `x-api-key: <sua_chave_secreta>`
-   **Body (JSON):** `{ "text": "uber 32,90 nubank" }`

### `GET /api/export.csv`

Exporta os gastos de um mês específico em formato CSV.

-   **Query Parameters:**
    -   `month`: O mês no formato `YYYY-MM` (ex: `2024-01`).
    -   `key`: Sua chave de API secreta.
-   **Exemplo:** `GET /api/export.csv?month=2024-01&key=<sua_chave_secreta>`
-   **Resposta CSV:** `Data;Valor;Descricao;Banco`
