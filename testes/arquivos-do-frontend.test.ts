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

describe("arquivos do frontend", () => {
  let pasta: string;

  before(() => {
    pasta = mkdtempSync(join(tmpdir(), "encurtador-"));
    writeFileSync(join(pasta, "index.html"), PAGINA);
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
