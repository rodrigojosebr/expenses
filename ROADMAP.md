# 🗺️ Plano de Melhorias: Gastos KV MVP

Este documento descreve o roteiro para evoluir a arquitetura, estilo e funcionalidades do projeto, focando em escalabilidade e manutenção.

## 🔄 Fluxo de Desenvolvimento

Para manter a organização, utilizaremos o seguinte fluxo:
1. **Source of Truth**: A branch `main` contém o código estável e o `ROADMAP.md` atualizado.
2. **Feature Branches**: Cada item deste roadmap será implementado em uma branch separada (ex: `feature/nome-da-tarefa`).
3. **Atualização do Roadmap**: Ao concluir uma tarefa na branch, marcamos o item como concluído `[x]` no `ROADMAP.md` da própria branch.
4. **Merge**: Após a validação, a branch é mergeada na `main`.

---

## 🎨 1. Estilização e UI Declarativa
O objetivo é remover os estilos inline (`const styles = {...}`) e adotar uma solução robusta, type-safe e performática.

- [x] **Instalar e Configurar PandaCSS**
    - Escolha ideal para Next.js (Server Components) pois é *zero-runtime* e *type-safe*.
    - Permite criar "Recipes" (receitas) para variantes de componentes (ex: botão primário/secundário).
- [x] **Migrar Estilos Inline para PandaCSS**
    - Converter o layout flexbox global.
    - Criar padrões de tokens (cores, espaçamentos) no arquivo de configuração.

## 🧩 2. Componentização e Arquitetura
O objetivo é "quebrar" o arquivo gigante `page.tsx` em partes menores e reutilizáveis.

- [x] **Atomic Design (Pastas)**
    - `components/ui`: Botões, Inputs, Selects (burros/sem lógica).
    - `components/features`: Painel de Configuração, Botão do Microfone (com contexto).
    - `components/layout`: Header, Footer.
- [x] **Extração de Componentes**
    - Mover `MicIcon`, `SettingsIcon`, `MoneyRain` para arquivos isolados.
    - Criar componente `SettingsDrawer` (Gaveta de configurações).

## 🧠 3. Separação de Lógica (Hooks e Contextos)
O objetivo é tirar a lógica de negócio de dentro da interface, de forma **gradual e segura**, validando cada passo.

- [ ] **3.1 Isolamento do Reconhecimento de Voz**
    - [ ] Criar o hook isolado `hooks/useSpeechRecognition.ts`.
    - [ ] Refatorar `app/voice/page.tsx` para usar esse hook.
- [ ] **3.2 Isolamento das Chamadas de API**
    - [ ] Criar o hook isolado `hooks/useGastosApi.ts`.
    - [ ] Refatorar chamadas de API na `page.tsx` para usarem o hook.
- [ ] **3.3 Gerenciamento de Estado Global do Usuário**
    - [ ] Criar o `contexts/UserContext.tsx` para gerenciar `apiKey` e `userName`.
    - [ ] Envolver a aplicação no `UserProvider` e migrar lógica de persistência.

## 🔐 4. Autenticação e Dados
O objetivo é profissionalizar o acesso, saindo do modelo de "Senha única no JSON".

- [ ] **Implementar NextAuth.js (Auth.js)**
    - Configurar provider (ex: Google ou Credentials com hash seguro).
- [ ] **Tela de Login e Cadastro**
    - Criar rotas `/login` e `/register`.
    - Proteger a rota `/voice` via Middleware.
- [ ] **Refatoração do Banco (KV)**
    - Adaptar a chave dos dados para incluir o ID do usuário autenticado.
