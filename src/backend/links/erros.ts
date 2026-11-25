export type TipoDeErro = "url_invalida" | "link_nao_encontrado" | "codigo_indisponivel";

export class ErroDeLink extends Error {
  readonly tipo: TipoDeErro;

  constructor(tipo: TipoDeErro, mensagem: string) {
    super(mensagem);
    this.name = "ErroDeLink";
    this.tipo = tipo;
  }
}
