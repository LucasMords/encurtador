import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { Encurtador } from "../src/backend/links/encurtador.ts";
import { ErroDeLink, type TipoDeErro } from "../src/backend/links/erros.ts";
import { gerarCodigo } from "../src/backend/links/gerador-de-codigo.ts";
import type { Link, RepositorioDeLinks } from "../src/backend/links/link.ts";
import { TAMANHO_MAXIMO_DA_URL, validarUrl } from "../src/backend/links/validador-de-url.ts";

class RepositorioEmMemoria implements RepositorioDeLinks {
  readonly #links = new Map<string, Link>();

  salvar(link: Link): boolean {
    if (this.#links.has(link.codigo)) {
      return false;
    }
    this.#links.set(link.codigo, link);
    return true;
  }

  buscarPorCodigo(codigo: string): Link | undefined {
    return this.#links.get(codigo);
  }
}

function erroDoTipo(tipo: TipoDeErro) {
  return (erro: unknown) => erro instanceof ErroDeLink && erro.tipo === tipo;
}

describe("validarUrl", () => {
  it("aceita http e https", () => {
    assert.equal(validarUrl("http://exemplo.com/a"), "http://exemplo.com/a");
    assert.equal(validarUrl("https://exemplo.com/a?b=1#c"), "https://exemplo.com/a?b=1#c");
  });

  for (const url of [
    "",
    "exemplo.com",
    "http://",
    "javascript:alert(1)",
    "data:text/html,oi",
    "file:///etc/passwd",
    "ftp://exemplo.com",
  ]) {
    it(`rejeita "${url}"`, () => {
      assert.throws(() => validarUrl(url), erroDoTipo("url_invalida"));
    });
  }

  it("rejeita URL que passa do limite depois de normalizada", () => {
    const url = `https://exemplo.com/${"é".repeat(TAMANHO_MAXIMO_DA_URL / 2)}`;
    assert.throws(() => validarUrl(url), erroDoTipo("url_invalida"));
  });
});

describe("gerarCodigo", () => {
  it("gera 7 caracteres alfanuméricos", () => {
    assert.match(gerarCodigo(), /^[0-9A-Za-z]{7}$/);
  });

  it("não repete códigos em uma amostra", () => {
    const codigos = new Set(Array.from({ length: 1000 }, gerarCodigo));
    assert.equal(codigos.size, 1000);
  });
});

describe("Encurtador", () => {
  it("recupera o link criado", () => {
    const encurtador = new Encurtador(new RepositorioEmMemoria(), gerarCodigo);
    const link = encurtador.encurtar("https://exemplo.com/");
    assert.deepEqual(encurtador.buscar(link.codigo), link);
  });

  it("gera outro código quando há colisão", () => {
    const codigos = ["aaa", "aaa", "bbb"];
    const encurtador = new Encurtador(new RepositorioEmMemoria(), () => codigos.shift() ?? "");
    assert.equal(encurtador.encurtar("https://um.com").codigo, "aaa");
    assert.equal(encurtador.encurtar("https://dois.com").codigo, "bbb");
    assert.equal(encurtador.buscar("aaa").url, "https://um.com/");
  });

  it("desiste depois de colisões seguidas", () => {
    const encurtador = new Encurtador(new RepositorioEmMemoria(), () => "aaa");
    encurtador.encurtar("https://um.com");
    assert.throws(() => encurtador.encurtar("https://dois.com"), erroDoTipo("codigo_indisponivel"));
  });

  it("avisa quando o código não existe", () => {
    const encurtador = new Encurtador(new RepositorioEmMemoria(), gerarCodigo);
    assert.throws(() => encurtador.buscar("nada"), erroDoTipo("link_nao_encontrado"));
  });
});
