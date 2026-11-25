import { randomInt } from "node:crypto";

const ALFABETO = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
const TAMANHO_DO_CODIGO = 7;

export function gerarCodigo(): string {
  return Array.from({ length: TAMANHO_DO_CODIGO }, sortearCaractere).join("");
}

function sortearCaractere(): string {
  return ALFABETO.charAt(randomInt(ALFABETO.length));
}
