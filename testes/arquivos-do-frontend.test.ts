import assert from "node:assert/strict";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { after, before, describe, it } from "node:test";

import { criarApp } from "../src/backend/http/app.ts";
import { Encurtador } from "../src/backend/links/encurtador.ts";
import { gerarCodigo } from "../src/backend/links/gerador-de-codigo.ts";
import { abrirBanco } from "../src/dados/banco.ts";
import { RepositorioDeLinksSqlite } from "../src/dados/repositorio-de-links-sqlite.ts";

const PAGINA = "<!doctype html><title>Teste</title>";
const PAGINA_NAO_ENCONTRADA = "<!doctype html><title>Link não encontrado</title>";
const ACCEPT_DO_NAVEGADOR = "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8";

describe("arquivos do frontend", () => {
  let pasta: string;

  before(() => {
    pasta = mkdtempSync(join(tmpdir(), "encurtador-"));
    writeFileSync(join(pasta, "index.html"), PAGINA);
    writeFileSync(join(pasta, "nao-encontrado.html"), PAGINA_NAO_ENCONTRADA);
  });

  after(() => rmSync(pasta, { recursive: true }));

  function criarAppDeTeste(pastaDoFrontend: string) {
    const repositorio = new RepositorioDeLinksSqlite(abrirBanco(":memory:"));
    const encurtador = new Encurtador(repositorio, gerarCodigo);
    const app = criarApp({
      encurtador,
      urlBase: "https://curto.exemplo",
      registrarLogs: false,
      pastaDoFrontend,
    });
    return { app, encurtador };
  }

  it("serve a página em /", async () => {
    const resposta = await criarAppDeTeste(pasta).app.inject("/");
    assert.equal(resposta.statusCode, 200);
    assert.match(String(resposta.headers["content-type"]), /text\/html/);
    assert.equal(resposta.body, PAGINA);
  });

  it("mantém o redirecionamento e o 404 dos códigos", async () => {
    const { app, encurtador } = criarAppDeTeste(pasta);
    const { codigo } = encurtador.encurtar("https://exemplo.com/");

    assert.equal((await app.inject(`/${codigo}`)).statusCode, 302);

    const inexistente = await app.inject("/naoexiste");
    assert.equal(inexistente.statusCode, 404);
    assert.equal(inexistente.json().erro, "link_nao_encontrado");
  });

  it("mostra a página quando o navegador abre um link inexistente", async () => {
    const { app } = criarAppDeTeste(pasta);
    const resposta = await app.inject({
      url: "/naoexiste",
      headers: { accept: ACCEPT_DO_NAVEGADOR },
    });

    assert.equal(resposta.statusCode, 404);
    assert.match(String(resposta.headers["content-type"]), /text\/html/);
    assert.equal(resposta.headers.vary, "accept");
    assert.equal(resposta.body, PAGINA_NAO_ENCONTRADA);
  });

  for (const headers of [{}, { accept: "*/*" }, { accept: "application/json" }]) {
    it(`responde JSON a um link inexistente com ${JSON.stringify(headers)}`, async () => {
      const { app } = criarAppDeTeste(pasta);
      const resposta = await app.inject({ url: "/naoexiste", headers });

      assert.equal(resposta.statusCode, 404);
      assert.match(String(resposta.headers["content-type"]), /application\/json/);
      assert.equal(resposta.json().erro, "link_nao_encontrado");
    });
  }

  it("responde JSON ao navegador se o build não existe", async () => {
    const { app } = criarAppDeTeste(join(pasta, "inexistente"));
    const resposta = await app.inject({
      url: "/naoexiste",
      headers: { accept: ACCEPT_DO_NAVEGADOR },
    });

    assert.equal(resposta.statusCode, 404);
    assert.equal(resposta.json().erro, "link_nao_encontrado");
  });

  it("documenta as duas respostas de link inexistente", async () => {
    const resposta = await criarAppDeTeste(pasta).app.inject("/docs/json");
    const conteudo = resposta.json().paths["/{codigo}"].get.responses["404"].content;
    assert.deepEqual(Object.keys(conteudo).sort(), ["application/json", "text/html"]);
  });

  it("não inclui os arquivos na documentação da API", async () => {
    const resposta = await criarAppDeTeste(pasta).app.inject("/docs/json");
    assert.deepEqual(Object.keys(resposta.json().paths).sort(), ["/links", "/{codigo}"]);
  });

  it("mantém a API funcionando se o build não existe", async () => {
    const { app } = criarAppDeTeste(join(pasta, "inexistente"));
    const resposta = await app.inject({
      method: "POST",
      url: "/links",
      payload: { url: "https://exemplo.com" },
    });
    assert.equal(resposta.statusCode, 201);
  });
});
