import { ErroDeLink } from "./erros.ts";
import type { Link, RepositorioDeLinks } from "./link.ts";
import { validarUrl } from "./validador-de-url.ts";

const MAXIMO_DE_TENTATIVAS = 5;

export class Encurtador {
  readonly #repositorio: RepositorioDeLinks;
  readonly #gerarCodigo: () => string;

  constructor(repositorio: RepositorioDeLinks, gerarCodigo: () => string) {
    this.#repositorio = repositorio;
    this.#gerarCodigo = gerarCodigo;
  }

  encurtar(urlOriginal: string): Link {
    const url = validarUrl(urlOriginal);
    const criadoEm = new Date().toISOString();

    for (let tentativa = 0; tentativa < MAXIMO_DE_TENTATIVAS; tentativa++) {
      const link: Link = { codigo: this.#gerarCodigo(), url, criadoEm };
      if (this.#repositorio.salvar(link)) {
        return link;
      }
    }

    throw new ErroDeLink(
      "codigo_indisponivel",
      "Não foi possível gerar um código agora. Tente novamente.",
    );
  }

  buscar(codigo: string): Link {
    const link = this.#repositorio.buscarPorCodigo(codigo);
    if (link === undefined) {
      throw new ErroDeLink("link_nao_encontrado", "Link não encontrado.");
    }
    return link;
  }
}
