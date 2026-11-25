import swagger from "@fastify/swagger";
import swaggerUi from "@fastify/swagger-ui";
import type { FastifyInstance } from "fastify";

export const CAMINHO_DA_DOCUMENTACAO = "/docs";

/** Deve ser chamada antes do registro das rotas, para que elas sejam documentadas. */
export function registrarDocumentacao(app: FastifyInstance): void {
  app.register(swagger, {
    openapi: {
      openapi: "3.0.3",
      info: {
        title: "Encurtador de URLs",
        description: "API aberta e pública para encurtar URLs. Não exige autenticação.",
        version: "0.1.0",
      },
      tags: [{ name: "Links", description: "Criação e acesso de links curtos" }],
    },
  });
  app.register(swaggerUi, { routePrefix: CAMINHO_DA_DOCUMENTACAO });
}
