import { ErroDeLink } from "./erros.ts";

export const TAMANHO_MAXIMO_DA_URL = 2048;

const PROTOCOLOS_PERMITIDOS = new Set(["http:", "https:"]);

/** Retorna a URL normalizada ou lança `ErroDeLink` se ela não for aceita. */
export function validarUrl(texto: string): string {
  const url = URL.parse(texto);

  if (url === null) {
    throw new ErroDeLink("url_invalida", "A URL informada não é válida.");
  }
  if (!PROTOCOLOS_PERMITIDOS.has(url.protocol)) {
    throw new ErroDeLink("url_invalida", "A URL deve usar http ou https.");
  }
  if (url.href.length > TAMANHO_MAXIMO_DA_URL) {
    throw new ErroDeLink(
      "url_invalida",
      `A URL deve ter no máximo ${TAMANHO_MAXIMO_DA_URL} caracteres.`,
    );
  }

  return url.href;
}
