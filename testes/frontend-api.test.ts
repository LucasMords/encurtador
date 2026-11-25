import assert from "node:assert/strict";
import { describe, it, type TestContext } from "node:test";

import { criarLink, ErroDaApi } from "../src/frontend/api/links.ts";

const URL_LONGA = "https://exemplo.com/pagina";

function simularResposta(contexto: TestContext, status: number, corpo: string) {
  return contexto.mock.method(globalThis, "fetch", async () => new Response(corpo, { status }));
}

function erroComMensagem(trecho: RegExp) {
  return (erro: unknown) => erro instanceof ErroDaApi && trecho.test(erro.message);
}

describe("criarLink", () => {
  it("envia a URL e devolve o link criado", async (contexto) => {
    const link = { codigo: "abc1234", url: URL_LONGA, urlCurta: "https://curto.exemplo/abc1234" };
    const simulacao = simularResposta(contexto, 201, JSON.stringify(link));

    assert.deepEqual(await criarLink(URL_LONGA), link);

    const [caminho, opcoes] = simulacao.mock.calls[0]?.arguments as unknown as [
      string,
      RequestInit,
    ];
    assert.equal(caminho, "/links");
    assert.equal(opcoes.method, "POST");
    assert.equal(opcoes.body, JSON.stringify({ url: URL_LONGA }));
  });

  it("mostra a mensagem de erro da API", async (contexto) => {
    const corpo = { erro: "url_invalida", mensagem: "A URL deve usar http ou https." };
    simularResposta(contexto, 400, JSON.stringify(corpo));

    await assert.rejects(criarLink("ftp://exemplo.com"), erroComMensagem(/http ou https/));
  });

  it("traduz o erro de validação do Fastify", async (contexto) => {
    const corpo = { erro: "requisicao_invalida", mensagem: "body/url must NOT have more than…" };
    simularResposta(contexto, 400, JSON.stringify(corpo));

    await assert.rejects(criarLink(URL_LONGA), erroComMensagem(/Confira o endereço/));
  });

  for (const [status, corpo] of [
    [502, "<html></html>"],
    [500, "null"],
    [201, "{}"],
  ] as const) {
    it(`usa uma mensagem genérica para ${status} com corpo ${corpo}`, async (contexto) => {
      simularResposta(contexto, status, corpo);
      await assert.rejects(criarLink(URL_LONGA), erroComMensagem(/Algo deu errado/));
    });
  }

  it("avisa quando não há conexão", async (contexto) => {
    contexto.mock.method(globalThis, "fetch", async () => {
      throw new TypeError("fetch failed");
    });
    await assert.rejects(criarLink(URL_LONGA), erroComMensagem(/Não foi possível falar/));
  });
});
