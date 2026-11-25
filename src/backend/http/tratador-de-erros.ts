import type { FastifyError, FastifyReply, FastifyRequest } from "fastify";

import { ErroDeLink, type TipoDeErro } from "../links/erros.ts";

type Responder = (
  resposta: FastifyReply,
  mensagem: string,
  pagina: string | undefined,
) => FastifyReply;

const respostasPorErro: Record<TipoDeErro, Responder> = {
  url_invalida: (resposta, mensagem) => enviarErro(resposta, 400, "url_invalida", mensagem),
  link_nao_encontrado: (resposta, mensagem, pagina) =>
    enviarLinkNaoEncontrado(resposta, mensagem, pagina),
  codigo_indisponivel: (resposta, mensagem) =>
    enviarErro(resposta, 503, "codigo_indisponivel", mensagem),
};

/** Com `paginaNaoEncontrada`, navegadores a recebem no lugar do JSON de link inexistente. */
export function criarTratadorDeErros(paginaNaoEncontrada: string | undefined) {
  return (
    erro: FastifyError | ErroDeLink,
    requisicao: FastifyRequest,
    resposta: FastifyReply,
  ): FastifyReply => {
    if (erro instanceof ErroDeLink) {
      return respostasPorErro[erro.tipo](resposta, erro.message, paginaNaoEncontrada);
    }
    return tratarErroDoFramework(erro, requisicao, resposta);
  };
}

function tratarErroDoFramework(
  erro: FastifyError,
  requisicao: FastifyRequest,
  resposta: FastifyReply,
): FastifyReply {
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

function enviarLinkNaoEncontrado(
  resposta: FastifyReply,
  mensagem: string,
  pagina: string | undefined,
): FastifyReply {
  resposta.header("vary", "accept");
  if (pagina === undefined || !aceitaHtml(resposta.request)) {
    return enviarErro(resposta, 404, "link_nao_encontrado", mensagem);
  }
  return resposta.code(404).type("text/html; charset=utf-8").send(pagina);
}

/** Navegadores pedem `text/html` ao abrir um link; clientes da API costumam enviar outro valor. */
function aceitaHtml({ headers }: FastifyRequest): boolean {
  return headers.accept?.includes("text/html") ?? false;
}

function enviarErro(
  resposta: FastifyReply,
  status: number,
  erro: string,
  mensagem: string,
): FastifyReply {
  return resposta.code(status).send({ erro, mensagem });
}
