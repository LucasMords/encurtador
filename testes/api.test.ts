import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { criarApp } from "../src/backend/http/app.ts";
import { Encurtador } from "../src/backend/links/encurtador.ts";
import { gerarCodigo } from "../src/backend/links/gerador-de-codigo.ts";
import type { RepositorioDeLinks } from "../src/backend/links/link.ts";
import { abrirBanco } from "../src/dados/banco.ts";
import { RepositorioDeLinksSqlite } from "../src/dados/repositorio-de-links-sqlite.ts";

const URL_BASE = "https://curto.exemplo";

function criarAppDeTeste(
  repositorio: RepositorioDeLinks = new RepositorioDeLinksSqlite(abrirBanco(":memory:")),
) {
  const encurtador = new Encurtador(repositorio, gerarCodigo);
  return criarApp({ encurtador, urlBase: URL_BASE, registrarLogs: false });
}

describe("POST /links", () => {
  it("cria um link sem autenticação", async () => {
    const resposta = await criarAppDeTeste().inject({
      method: "POST",
      url: "/links",
      payload: { url: "https://exemplo.com/pagina" },
    });
    const link = resposta.json();

    assert.equal(resposta.statusCode, 201);
    assert.equal(link.url, "https://exemplo.com/pagina");
    assert.equal(link.urlCurta, `${URL_BASE}/${link.codigo}`);
  });

  for (const payload of [{}, { url: "" }, { url: null }, { url: "x".repeat(3000) }]) {
    it(`responde 400 para o corpo ${JSON.stringify(payload).slice(0, 30)}`, async () => {
      const resposta = await criarAppDeTeste().inject({ method: "POST", url: "/links", payload });
      assert.equal(resposta.statusCode, 400);
      assert.equal(resposta.json().erro, "requisicao_invalida");
    });
  }

  it("responde 400 para esquema não permitido", async () => {
    const resposta = await criarAppDeTeste().inject({
      method: "POST",
      url: "/links",
      payload: { url: "javascript:alert(1)" },
    });
    assert.equal(resposta.statusCode, 400);
    assert.equal(resposta.json().erro, "url_invalida");
  });

  it("responde 503 quando não há código disponível", async () => {
    const app = criarAppDeTeste({ salvar: () => false, buscarPorCodigo: () => undefined });
    const resposta = await app.inject({
      method: "POST",
      url: "/links",
      payload: { url: "https://exemplo.com" },
    });
    assert.equal(resposta.statusCode, 503);
  });
});

describe("GET /:codigo", () => {
  it("redireciona com 302 sem alterar a URL", async () => {
    const app = criarAppDeTeste();
    const url = "https://exemplo.com/a%20b/%C3%A9?q=x%26y&z=1#fim";
    const criacao = await app.inject({ method: "POST", url: "/links", payload: { url } });
    const resposta = await app.inject(`/${criacao.json().codigo}`);

    assert.equal(resposta.statusCode, 302);
    assert.equal(resposta.headers.location, url);
  });

  it("responde 404 para código inexistente", async () => {
    const resposta = await criarAppDeTeste().inject("/naoexiste");
    assert.equal(resposta.statusCode, 404);
    assert.equal(resposta.json().erro, "link_nao_encontrado");
  });

  it("responde 404 para rota inexistente", async () => {
    const resposta = await criarAppDeTeste().inject("/a/b");
    assert.equal(resposta.statusCode, 404);
    assert.equal(resposta.json().erro, "rota_nao_encontrada");
  });

  it("responde 500 sem expor detalhes internos", async () => {
    const app = criarAppDeTeste({
      salvar: () => true,
      buscarPorCodigo: () => {
        throw new Error("segredo do banco");
      },
    });
    const resposta = await app.inject("/abc");
    assert.equal(resposta.statusCode, 500);
    assert.doesNotMatch(resposta.body, /segredo/);
  });
});

describe("documentação", () => {
  it("serve a interface do Swagger em /docs", async () => {
    const resposta = await criarAppDeTeste().inject("/docs");
    assert.equal(resposta.statusCode, 200);
    assert.match(String(resposta.headers["content-type"]), /text\/html/);
  });

  it("descreve todas as rotas da API", async () => {
    const resposta = await criarAppDeTeste().inject("/docs/json");
    const { paths } = resposta.json();
    assert.deepEqual(Object.keys(paths).sort(), ["/links", "/{codigo}"]);
    assert.ok(paths["/links"].post);
    assert.ok(paths["/{codigo}"].get);
  });
});
