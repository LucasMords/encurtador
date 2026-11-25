import type { FastifyError, FastifyReply, FastifyRequest } from "fastify";

import { ErroDeLink, type TipoDeErro } from "../links/erros.ts";

type Responder = (resposta: FastifyReply, mensagem: string) => FastifyReply;

const respostasPorErro: Record<TipoDeErro, Responder> = {
  url_invalida: (resposta, mensagem) => enviarErro(resposta, 400, "url_invalida", mensagem),
  link_nao_encontrado: (resposta, mensagem) =>
    enviarErro(resposta, 404, "link_nao_encontrado", mensagem),
  codigo_indisponivel: (resposta, mensagem) =>
    enviarErro(resposta, 503, "codigo_indisponivel", mensagem),
};

export function tratarErro(
  erro: FastifyError | ErroDeLink,
  requisicao: FastifyRequest,
  resposta: FastifyReply,
): FastifyReply {
  if (erro instanceof ErroDeLink) {
    return respostasPorErro[erro.tipo](resposta, erro.message);
  }
  if (erro.statusCode !== undefined && erro.statusCode < 500) {
    return enviarErro(resposta, erro.statusCode, "requisicao_invalida", erro.message);
  }

  requisicao.log.error(erro);
  return enviarErro(resposta, 500, "erro_interno", "Erro interno do servidor.");
}

export function tratarRotaInexistente(
  _requisicao: FastifyRequest,
  resposta: FastifyReply,
): FastifyReply {
  return enviarErro(resposta, 404, "rota_nao_encontrada", "Rota não encontrada.");
}

function enviarErro(
  resposta: FastifyReply,
  status: number,
  erro: string,
  mensagem: string,
): FastifyReply {
  return resposta.code(status).send({ erro, mensagem });
}
