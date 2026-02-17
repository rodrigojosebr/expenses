# gastos-kv-mvp

MVP para registrar gastos por voz e exportar um CSV por mês, usando Vercel KV como banco de dados.

## Funcionalidades

-   **Interface de Voz**: Uma página moderna em `/voice` permite que o usuário registre gastos falando, com reconhecimento de voz em português.
-   **APIs**: Endpoints para registrar gastos, validar usuários e exportar dados.
-   **Parsing Inteligente**: A lógica de backend extrai valor (incluindo por extenso), banco e descrição da frase falada.

## Como Rodar

### Pré-requisitos

-   Node.js (versão 20 ou superior)
-   npm
-   Uma conta na Vercel com o Vercel KV habilitado.

### Configuração

1.  **Clone o repositório:**
    ```bash
    git clone <URL_DO_REPOSITORIO>
    cd gastos-kv-mvp
    ```

2.  **Instale a Vercel CLI:**
    ```bash
    npm install -g vercel
    ```

3.  **Conecte com a Vercel:**
    ```bash
    vercel link
    ```

4.  **Baixe as Variáveis de Ambiente:**
    ```bash
    cp .env.example .env.local
    vercel env pull .env.local
    ```

5.  **Configure suas Senhas de Acesso:**
    Edite o arquivo `.env.local` e, na variável `USER_KEYS_JSON`, crie suas próprias senhas e configure os usuários. O `id` deve ser um identificador único, e o `name` é o nome que aparecerá na interface.
    ```json
    USER_KEYS_JSON='{
      "sua-senha-secreta-1": { "id": "user_1a2b3c", "name": "raj" },
      "sua-senha-secreta-2": { "id": "user_4d5e6f", "name": "roseane" }
    }'
    ```

### Instalação

Instale as dependências do projeto:
```bash
npm install
```

### Rodando em Desenvolvimento

Execute o servidor de desenvolvimento e acesse `http://localhost:3000/voice`:
```bash
npm run dev
```

## Interface de Voz (`/voice`)

Acesse `http://localhost:3000/voice` para a principal interface da aplicação.

-   **Primeiro Acesso**: O painel de configurações abrirá para que você insira a "Senha" que foi configurada no passo 5 da configuração.
-   **Uso**: Clique no microfone, fale o gasto (ex: "vinte reais de lanche no btg") e aguarde a transcrição. Confirme para enviar.

## Endpoints

### `POST /api/gasto`

Registra um novo gasto.

-   **Header:** `x-api-key: <sua_senha_secreta>`
-   **Body (JSON):** `{ "text": "uber 32,90 nubank" }`
-   **Resposta de Sucesso (JSON):** Contém o objeto do evento criado, incluindo o objeto `user`.

### `GET /api/user`

Valida uma senha e retorna as informações do usuário.

-   **Header:** `x-api-key: <sua_senha_secreta>`
-   **Resposta de Sucesso (JSON):** `{ "user": { "id": "user_1a2b3c", "name": "raj" } }`

### `GET /api/export.csv`

Exporta os gastos de um mês específico em formato CSV.

-   **Query Parameters:**
    -   `month`: O mês no formato `YYYY-MM`.
    -   `key`: Sua senha secreta.
-   **Exemplo:** `GET /api/export.csv?month=2024-01&key=<sua_senha_secreta>`
-   **Resposta CSV:** `Data;Valor;Descricao;Banco`
