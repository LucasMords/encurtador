import type { FastifyInstance } from "fastify";

import type { Encurtador } from "../links/encurtador.ts";
import { esquemaDeCriacao, esquemaDeRedirecionamento } from "./esquemas-de-links.ts";

export function registrarRotasDeLinks(
  app: FastifyInstance,
  encurtador: Encurtador,
  urlBase: string,
): void {
  app.post<{ Body: { url: string } }>(
    "/links",
    { schema: esquemaDeCriacao },
    async (requisicao, resposta) => {
      const link = encurtador.encurtar(requisicao.body.url);
      return resposta.code(201).send({ ...link, urlCurta: `${urlBase}/${link.codigo}` });
    },
  );

  app.get<{ Params: { codigo: string } }>(
    "/:codigo",
    { schema: esquemaDeRedirecionamento },
    async (requisicao, resposta) => {
      const link = encurtador.buscar(requisicao.params.codigo);
      return resposta.redirect(link.url, 302);
    },
  );
}
