# 🎓 Sistema de Atestado Escolar — API

API REST para gestão de atestados escolares, com **autenticação JWT**, **sistema de API Keys com permissões granulares (escopos)**, **painel administrativo** e **documentação interativa por chave**.

> Projeto acadêmico — backend construído sobre um diagrama de classes UML, do schema do banco até o deploy em produção.

**🌐 Produção:** https://faculdadeapi.vercel.app

| Recurso | URL |
| --- | --- |
| Painel administrativo | [`/admin/login`](https://faculdadeapi.vercel.app/admin/login) |
| Documentação interativa (Scalar) | [`/api/docs`](https://faculdadeapi.vercel.app/api/docs) |
| Spec OpenAPI (JSON) | [`/api/openapi.json`](https://faculdadeapi.vercel.app/api/openapi.json) |

---

## 📚 Índice

- [Stack](#-stack)
- [Funcionalidades](#-funcionalidades)
- [Arquitetura](#-arquitetura)
- [Modelo de dados](#-modelo-de-dados)
- [Como rodar localmente](#-como-rodar-localmente)
- [Autenticação](#-autenticação)
- [Sistema de API Keys e escopos](#-sistema-de-api-keys-e-escopos)
- [Referência de endpoints](#-referência-de-endpoints)
- [Painel administrativo](#-painel-administrativo)
- [Testando com Postman](#-testando-com-postman)
- [Deploy no Vercel](#-deploy-no-vercel)
- [Estrutura de pastas](#-estrutura-de-pastas)

---

## 🧱 Stack

| Camada | Tecnologia |
| --- | --- |
| Framework | [Next.js 16](https://nextjs.org) (App Router, Route Handlers) |
| Linguagem | TypeScript |
| ORM | [Prisma 7](https://www.prisma.io) |
| Banco de dados | [Neon](https://neon.tech) (PostgreSQL serverless) |
| Conexão | `@prisma/adapter-neon` (driver serverless, sem engine binário) |
| Validação | [Zod](https://zod.dev) |
| Autenticação | JWT (`jsonwebtoken`) + senhas com `bcryptjs` |
| Documentação | OpenAPI 3.0 + UI [Scalar](https://scalar.com) |
| Estilo (painel) | Tailwind CSS v4 |
| Deploy | Vercel |

---

## ✨ Funcionalidades

- 🔐 **Login de administrador** com JWT
- 🔑 **API Keys com escopos** — cada chave acessa apenas os recursos liberados
- 📋 **Documentação filtrada por chave** — o consumidor vê só os endpoints que pode usar
- 🛡️ **Hash de chaves** — a chave completa é exibida uma única vez; o banco guarda só o SHA-256
- 📄 **CRUD completo** de atestados, usuários, turmas, cursos, disciplinas, cronograma
- 🔔 **Notificações automáticas** ao mudar o status de um atestado
- 📊 **Relatórios** agregados de atestados
- 🖥️ **Painel administrativo** responsivo para gerenciar as chaves

---

## 🏗 Arquitetura

```
Cliente (front / Postman)
        │
        │  Authorization: Bearer <jwt>   (admin)
        │  X-Api-Key: <chave>            (consumidor)
        ▼
  Route Handlers (app/api/*)
        │
        │  getAuth() → valida JWT ou API Key
        │  requireScope() / requireAdmin()
        ▼
  Prisma Client (singleton) ──► Neon PostgreSQL
```

A autenticação acontece em `lib/auth.ts`:
- **JWT** → para administradores (perfis `ADMIN` e `DIRECAO` têm acesso total)
- **API Key** → para consumidores, validada por escopo a cada requisição

---

## 🗂 Modelo de dados

Modelos (Prisma):

- **Usuario** — herança *single-table* via enum `PerfilUsuario` (`ALUNO`, `RESPONSAVEL`, `SECRETARIA`, `COORDENACAO`, `DIRECAO`, `ADMIN`)
- **Atestado** — enum `StatusAtestado` (`RECEBIDO` → `EM_ANALISE` → `APROVADO` / `RECUSADO`)
- **Turma** — relação N:N com alunos, ligada a `Curso` e `Disciplina`
- **Curso**, **Disciplina**, **Cronograma**
- **Notificacao** — gerada automaticamente em mudanças de status
- **Relatorio** — resultados agregados
- **Sessao** — sessões de autenticação
- **ApiKey** — chaves de acesso com `scopes`, `keyHash`, expiração e status

---

## 🚀 Como rodar localmente

### 1. Pré-requisitos
- Node.js 20+ (testado em 24)
- Uma connection string do Neon (ou qualquer PostgreSQL)

### 2. Instalar dependências
```bash
npm install
```

### 3. Configurar variáveis de ambiente
Crie um arquivo `.env` na raiz (use o [`.env.example`](.env.example) como base):

```bash
# Conexão de runtime (pooler do Neon)
DATABASE_URL="postgresql://usuario:senha@host-pooler.regiao.aws.neon.tech/db?sslmode=require"

# Conexão direta (usada pelo Prisma Migrate)
DIRECT_URL="postgresql://usuario:senha@host.regiao.aws.neon.tech/db?sslmode=require"

# Segredo do JWT — gere um valor aleatório longo:
# node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
JWT_SECRET="seu-segredo-aleatorio"
```

### 4. Criar as tabelas e popular o banco
```bash
npx prisma migrate dev    # aplica as migrations
npm run db:seed           # popula com dados de exemplo
```

### 5. Subir o servidor
```bash
npm run dev
```
Acesse http://localhost:3000

### Credenciais do seed

| Perfil | E-mail | Senha |
| --- | --- | --- |
| Admin | `admin@escola.edu.br` | `Admin@123` |
| Direção | `direcao@escola.edu.br` | `Direcao@123` |
| Coordenação | `coordenacao@escola.edu.br` | `Coord@123` |
| Secretaria | `secretaria@escola.edu.br` | `Sec@123` |
| Alunos | `joao.silva@aluno.escola.edu.br` (e outros) | `Aluno@123` |

---

## 🔐 Autenticação

### Login (obter JWT)
```http
POST /api/auth/login
Content-Type: application/json

{ "email": "admin@escola.edu.br", "senha": "Admin@123" }
```
Resposta:
```json
{ "token": "eyJhbGci...", "usuario": { "id": 1, "nome": "Admin Sistema", "perfil": "ADMIN" } }
```

Use o token nas rotas de administração:
```http
Authorization: Bearer <token>
```

### Consumindo com API Key
```http
GET /api/atestados
X-Api-Key: sk_xxxxxxxx_...
```

---

## 🔑 Sistema de API Keys e escopos

Administradores geram chaves com permissões específicas. Cada escopo segue o formato `recurso:ação`.

| Recurso | Escopos disponíveis |
| --- | --- |
| Usuários | `usuarios:read`, `usuarios:write`, `usuarios:delete` |
| Atestados | `atestados:read`, `atestados:write`, `atestados:delete` |
| Turmas | `turmas:read`, `turmas:write`, `turmas:delete` |
| Notificações | `notificacoes:read`, `notificacoes:write` |
| Cronograma | `cronograma:read`, `cronograma:write` |
| Relatórios | `relatorios:read` |
| Cursos | `cursos:read`, `cursos:write` |
| Disciplinas | `disciplinas:read`, `disciplinas:write` |
| **Acesso total** | `*` (apenas para chaves de confiança) |

**Como funciona o controle:** se a chave não tiver o escopo exigido pela rota, a resposta é `403`. Cada chave também tem um link de documentação que mostra **somente** os endpoints liberados:

```
/api/docs/key/{id}
```

---

## 📡 Referência de endpoints

> Códigos: `200/201` ok · `401` sem autenticação · `403` sem permissão · `404` não encontrado · `409` conflito · `422` dados inválidos

### Autenticação
| Método | Rota | Descrição | Auth |
| --- | --- | --- | --- |
| `POST` | `/api/auth/login` | Login, retorna JWT | — |

### API Keys *(somente admin via JWT)*
| Método | Rota | Descrição |
| --- | --- | --- |
| `GET` | `/api/api-keys` | Listar chaves |
| `POST` | `/api/api-keys` | Criar chave |
| `GET` | `/api/api-keys/:id` | Detalhe da chave |
| `PATCH` | `/api/api-keys/:id` | Atualizar (nome/escopos/status) |
| `DELETE` | `/api/api-keys/:id` | Revogar |

### Usuários
| Método | Rota | Escopo |
| --- | --- | --- |
| `GET` | `/api/usuarios` | `usuarios:read` |
| `POST` | `/api/usuarios` | `usuarios:write` |
| `GET` | `/api/usuarios/:id` | `usuarios:read` |
| `PUT` | `/api/usuarios/:id` | `usuarios:write` |
| `DELETE` | `/api/usuarios/:id` | `usuarios:delete` |

### Atestados
| Método | Rota | Escopo |
| --- | --- | --- |
| `GET` | `/api/atestados` *(filtros: `?status=`, `?usuarioId=`)* | `atestados:read` |
| `POST` | `/api/atestados` | `atestados:write` |
| `GET` | `/api/atestados/:id` | `atestados:read` |
| `PATCH` | `/api/atestados/:id/status` *(gera notificação)* | `atestados:write` |
| `DELETE` | `/api/atestados/:id` | `atestados:delete` |

### Turmas
| Método | Rota | Escopo |
| --- | --- | --- |
| `GET` | `/api/turmas` | `turmas:read` |
| `POST` | `/api/turmas` | `turmas:write` |
| `GET` | `/api/turmas/:id` | `turmas:read` |
| `PATCH` | `/api/turmas/:id` *(vincular/desvincular alunos)* | `turmas:write` |
| `DELETE` | `/api/turmas/:id` | `turmas:delete` |

### Demais recursos
| Método | Rota | Escopo |
| --- | --- | --- |
| `GET` | `/api/notificacoes` *(filtros: `?usuarioId=`, `?naoLidas=`)* | `notificacoes:read` |
| `PATCH` | `/api/notificacoes/:id` *(marcar como lida)* | `notificacoes:write` |
| `GET` `POST` | `/api/cursos` | `cursos:read` / `cursos:write` |
| `GET` `POST` | `/api/disciplinas` | `disciplinas:read` / `disciplinas:write` |
| `GET` `POST` | `/api/cronograma` | `cronograma:read` / `cronograma:write` |
| `GET` `POST` | `/api/relatorios` | `relatorios:read` |

---

## 🖥 Painel administrativo

Disponível em [`/admin/login`](https://faculdadeapi.vercel.app/admin/login). Permite:

- Login com perfil de administrador ou direção
- Listar, filtrar e visualizar estatísticas das chaves
- **Criar chaves** selecionando escopos por categoria
- Ver a chave gerada **uma única vez** (com cópia segura)
- Abrir/compartilhar o **link de documentação** filtrado de cada chave
- **Revogar** chaves

Totalmente responsivo (tabela no desktop, cards no mobile).

---

## 🧪 Testando com Postman

Há uma coleção pronta em [`postman/Atestado-Escolar.postman_collection.json`](postman/Atestado-Escolar.postman_collection.json).

1. No Postman: **Import** → selecione o arquivo
2. Rode na ordem: **Login** → **Criar API Key** → demais pastas
3. As variáveis (`{{jwt}}`, `{{apiKey}}`, ids) são salvas automaticamente entre as requisições

A coleção inclui também testes de segurança (`401` sem auth, `403` com escopo insuficiente).

---

## ☁️ Deploy no Vercel

1. Conecte o repositório ao Vercel
2. Em **Settings → Environment Variables**, adicione `DATABASE_URL`, `DIRECT_URL` e `JWT_SECRET`
3. O build já executa `prisma generate` automaticamente (script `build`)
4. Deploy 🚀

> O banco já deve estar migrado. Em mudanças de schema, rode `npx prisma migrate deploy`.

---

## 📁 Estrutura de pastas

```
app/
├── admin/                  # Painel administrativo (UI)
│   ├── login/              # Tela de login
│   └── keys/               # Gestão de API keys
├── api/
│   ├── auth/login/         # Autenticação
│   ├── api-keys/           # CRUD de chaves (admin)
│   ├── usuarios/           # CRUD de usuários
│   ├── atestados/          # CRUD + mudança de status
│   ├── turmas/             # CRUD + vínculo de alunos
│   ├── notificacoes/       # Listar / marcar lida
│   ├── cursos/ disciplinas/ cronograma/ relatorios/
│   ├── docs/               # UI Scalar (+ /key/:id filtrada)
│   └── openapi.json/       # Spec OpenAPI (+ /key/:id filtrada)
lib/
├── prisma.ts               # Singleton do Prisma Client
├── auth.ts                 # getAuth, requireScope, requireAdmin, signJwt
├── crypto.ts               # Geração e hash de API keys
├── scopes.ts               # Catálogo de escopos
└── openapi.ts              # Spec OpenAPI + filtro por escopo
prisma/
├── schema.prisma           # Modelos
├── migrations/             # Histórico de migrations
└── seed.ts                 # Dados de exemplo
postman/                    # Coleção de testes
```

---

## 📝 Scripts disponíveis

| Comando | Ação |
| --- | --- |
| `npm run dev` | Servidor de desenvolvimento |
| `npm run build` | Build de produção (`prisma generate` + `next build`) |
| `npm run start` | Servir o build de produção |
| `npm run db:seed` | Popular o banco com dados de exemplo |
| `npm run lint` | Rodar o ESLint |

---

<div align="center">
  <sub>Construído com Next.js, Prisma e Neon · Projeto acadêmico</sub>
</div>
