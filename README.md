# gastos-kv-mvp

MVP: registrar gastos via webhook e exportar CSV por mês usando Vercel KV.

## Variáveis de ambiente
- `USER_KEYS_JSON` (mapeia apiKey -> userId). Exemplo:
  ```json
  {
    "SUA_KEY_RAJ": "raj",
    "SUA_KEY_ROSEANE": "roseane"
  }
  ```

## Endpoints

### POST /api/gasto
Header: `x-api-key: <sua_key>`
Body JSON: `{ "text": "uber 32,90 nubank" }`

### GET /api/export.csv
`GET /api/export.csv?month=YYYY-MM&key=<sua_key>`

CSV: `Data;Valor;Descricao;Banco`
