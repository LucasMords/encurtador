import Fastify, { type FastifyInstance } from "fastify";

import type { Encurtador } from "../links/encurtador.ts";
import { registrarArquivosDoFrontend } from "./arquivos-do-frontend.ts";
import { registrarDocumentacao } from "./documentacao.ts";
import { registrarRotasDeLinks } from "./rotas-de-links.ts";
import { tratarErro, tratarRotaInexistente } from "./tratador-de-erros.ts";

const LIMITE_DO_CORPO_EM_BYTES = 16 * 1024;

interface OpcoesDoApp {
  readonly encurtador: Encurtador;
  readonly urlBase: string;
  readonly registrarLogs: boolean;
  /** Pasta com o build do frontend; sem ela, o app serve apenas a API. */
  readonly pastaDoFrontend?: string;
}

export function criarApp({
  encurtador,
  urlBase,
  registrarLogs,
  pastaDoFrontend,
}: OpcoesDoApp): FastifyInstance {
  const app = Fastify({ logger: registrarLogs, bodyLimit: LIMITE_DO_CORPO_EM_BYTES });

  app.setErrorHandler(tratarErro);
  app.setNotFoundHandler(tratarRotaInexistente);
  registrarDocumentacao(app);
  if (pastaDoFrontend !== undefined) {
    registrarArquivosDoFrontend(app, pastaDoFrontend);
  }
  app.register(async (escopo) => registrarRotasDeLinks(escopo, encurtador, urlBase));

  return app;
}
