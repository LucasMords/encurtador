import assert from "node:assert/strict";
import { it } from "node:test";

import { abrirBanco } from "../src/dados/banco.ts";
import { RepositorioDeLinksSqlite } from "../src/dados/repositorio-de-links-sqlite.ts";

const LINK = { codigo: "abc", url: "https://um.com/", criadoEm: "2026-01-01T00:00:00.000Z" };

function criarRepositorio(): RepositorioDeLinksSqlite {
  return new RepositorioDeLinksSqlite(abrirBanco(":memory:"));
}

it("salva e busca um link", () => {
  const repositorio = criarRepositorio();
  assert.equal(repositorio.salvar(LINK), true);
  assert.deepEqual(repositorio.buscarPorCodigo("abc"), LINK);
});

it("não sobrescreve um código já usado", () => {
  const repositorio = criarRepositorio();
  repositorio.salvar(LINK);
  assert.equal(repositorio.salvar({ ...LINK, url: "https://dois.com/" }), false);
  assert.deepEqual(repositorio.buscarPorCodigo("abc"), LINK);
});

it("diferencia maiúsculas de minúsculas", () => {
  const repositorio = criarRepositorio();
  repositorio.salvar(LINK);
  assert.equal(repositorio.buscarPorCodigo("ABC"), undefined);
});
