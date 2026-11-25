export interface LinkCriado {
  readonly url: string;
  readonly urlCurta: string;
}

/** Erro cuja mensagem pode ser mostrada ao usuário. */
export class ErroDaApi extends Error {}

const MENSAGEM_SEM_CONEXAO =
  "Não foi possível falar com o servidor. Confira sua conexão e tente de novo.";
const MENSAGEM_GENERICA = "Algo deu errado no servidor. Tente de novo em instantes.";
const MENSAGEM_DE_REQUISICAO_INVALIDA = "Confira o endereço: ele deve ter até 2048 caracteres.";

export async function criarLink(url: string): Promise<LinkCriado> {
  const resposta = await enviar(url);
  const corpo = await lerCorpo(resposta);

  if (!resposta.ok) {
    throw new ErroDaApi(escolherMensagem(corpo));
  }
  if (!ehLinkCriado(corpo)) {
    throw new ErroDaApi(MENSAGEM_GENERICA);
  }
  return corpo;
}

async function enviar(url: string): Promise<Response> {
  try {
    return await fetch("/links", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ url }),
    });
  } catch {
    throw new ErroDaApi(MENSAGEM_SEM_CONEXAO);
  }
}

async function lerCorpo(resposta: Response): Promise<unknown> {
  try {
    return await resposta.json();
  } catch {
    throw new ErroDaApi(MENSAGEM_GENERICA);
  }
}

function escolherMensagem(corpo: unknown): string {
  if (!ehObjeto(corpo) || typeof corpo["mensagem"] !== "string") {
    return MENSAGEM_GENERICA;
  }
  // As mensagens desse erro vêm do Fastify, em inglês.
  if (corpo["erro"] === "requisicao_invalida") {
    return MENSAGEM_DE_REQUISICAO_INVALIDA;
  }
  return corpo["mensagem"];
}

function ehLinkCriado(corpo: unknown): corpo is LinkCriado {
  return (
    ehObjeto(corpo) && typeof corpo["url"] === "string" && typeof corpo["urlCurta"] === "string"
  );
}

function ehObjeto(valor: unknown): valor is Record<string, unknown> {
  return typeof valor === "object" && valor !== null;
}
