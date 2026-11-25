import arquivosEstaticos from "@fastify/static";
import type { FastifyInstance } from "fastify";

/**
 * Serve a saída do build do frontend. Com `wildcard: false`, cada arquivo vira uma rota
 * própria, e os demais caminhos continuam com `GET /:codigo`.
 */
export function registrarArquivosDoFrontend(app: FastifyInstance, pasta: string): void {
  app.register(arquivosEstaticos, { root: pasta, wildcard: false, decorateReply: false });
}
