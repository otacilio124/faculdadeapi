export const openApiSpec = {
  openapi: "3.0.0",
  info: {
    title: "Users API",
    version: "1.0.0",
    description: "CRUD de usuários — backend Next.js + Prisma + Neon Postgres",
  },
  servers: [{ url: "/api", description: "Servidor local" }],
  paths: {
    "/users": {
      get: {
        summary: "Listar todos os usuários",
        operationId: "listUsers",
        tags: ["Users"],
        responses: {
          "200": {
            description: "Lista de usuários",
            content: {
              "application/json": {
                schema: { type: "array", items: { $ref: "#/components/schemas/User" } },
              },
            },
          },
        },
      },
      post: {
        summary: "Criar usuário",
        operationId: "createUser",
        tags: ["Users"],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/CreateUserInput" },
            },
          },
        },
        responses: {
          "201": {
            description: "Usuário criado",
            content: { "application/json": { schema: { $ref: "#/components/schemas/User" } } },
          },
          "409": { description: "E-mail já em uso" },
          "422": { description: "Erro de validação" },
        },
      },
    },
    "/users/{id}": {
      parameters: [
        { name: "id", in: "path", required: true, schema: { type: "integer" } },
      ],
      get: {
        summary: "Buscar usuário por ID",
        operationId: "getUser",
        tags: ["Users"],
        responses: {
          "200": {
            description: "Usuário encontrado",
            content: { "application/json": { schema: { $ref: "#/components/schemas/User" } } },
          },
          "404": { description: "Usuário não encontrado" },
        },
      },
      put: {
        summary: "Atualizar usuário",
        operationId: "updateUser",
        tags: ["Users"],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/UpdateUserInput" },
            },
          },
        },
        responses: {
          "200": {
            description: "Usuário atualizado",
            content: { "application/json": { schema: { $ref: "#/components/schemas/User" } } },
          },
          "404": { description: "Usuário não encontrado" },
          "409": { description: "E-mail já em uso" },
          "422": { description: "Erro de validação" },
        },
      },
      delete: {
        summary: "Remover usuário",
        operationId: "deleteUser",
        tags: ["Users"],
        responses: {
          "204": { description: "Usuário removido" },
          "404": { description: "Usuário não encontrado" },
        },
      },
    },
  },
  components: {
    schemas: {
      User: {
        type: "object",
        properties: {
          id: { type: "integer", example: 1 },
          name: { type: "string", example: "Maria Silva" },
          email: { type: "string", format: "email", example: "maria@exemplo.com" },
          createdAt: { type: "string", format: "date-time" },
        },
        required: ["id", "name", "email", "createdAt"],
      },
      CreateUserInput: {
        type: "object",
        properties: {
          name: { type: "string", minLength: 1, example: "Maria Silva" },
          email: { type: "string", format: "email", example: "maria@exemplo.com" },
        },
        required: ["name", "email"],
      },
      UpdateUserInput: {
        type: "object",
        properties: {
          name: { type: "string", minLength: 1, example: "Maria Silva" },
          email: { type: "string", format: "email", example: "maria@exemplo.com" },
        },
      },
    },
  },
};
