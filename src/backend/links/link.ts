export interface Link {
  readonly codigo: string;
  readonly url: string;
  readonly criadoEm: string;
}

export interface RepositorioDeLinks {
  /** Retorna `false`, sem gravar nada, se o código já estiver em uso. */
  salvar(link: Link): boolean;
  buscarPorCodigo(codigo: string): Link | undefined;
}
