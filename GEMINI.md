# Diretrizes de Desenvolvimento: Nosso Universo (`mary.pyxie.com.br`)

## 1. Escopo e Isolamento Arquitetural
- **Projeto 100% Independente**: Este repositório (`E:\mary-pwa`) contém exclusivamente a plataforma de casais **Nosso Universo** (`mary.pyxie.com.br`).
- **Zero Acoplamento com o Bot Pyxie**: Não há compartilhamento de código, banco de dados ou dependências com o bot do Discord (`E:\botMelody`). A única conexão com o domínio `pyxie.com.br` é o proxy reverso do subdomínio `mary.pyxie.com.br` no Nginx apontando para a porta interna `3001`.
- **Idioma**: O aplicativo é voltado ao mercado nacional brasileiro (`pt-BR`), não exigindo paridade bilíngue inglês/português do bot do Discord.

## 2. Stack Tecnológica Principal
- **Servidor (`server/`)**: Node.js (ESM) + Express 5 + SQLite (`better-sqlite3` em modo WAL) + Drizzle ORM + Sharp + Multer + Web Push (VAPID) + Socket.IO (porta `3001`).
- **Cliente (`client/`)**: Vite + React 19 + Tailwind CSS + Framer Motion + `@xyflow/react` (React Flow) + Tiptap + MiniSearch + `idb-keyval` + `lucide-react` + `@phosphor-icons/react` + `@iconify/react`.
- **Infraestrutura (`nginx/` & `ecosystem.config.cjs`)**: PM2 (`name: "mary-pwa"`, `PORT: 3001`) + Nginx (`mary.pyxie.com.br` -> `http://127.0.0.1:3001`).

## 3. Documentação de Referência (Master Blueprint v1.0 a v4.0)
- A especificação completa de todos os 4 Módulos e dos **Prompts de Engenharia (Agentes 1 a 7)** encontra-se em [`docs/MASTER_BLUEPRINT.md`](file:///e:/mary-pwa/docs/MASTER_BLUEPRINT.md).

## 4. Testes e Validação
- Para validar a API e o banco SQLite:
  ```bash
  npm test
  ```
- Para compilar o bundle de produção do cliente:
  ```bash
  npm run build
  ```
