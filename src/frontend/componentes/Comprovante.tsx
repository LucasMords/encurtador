import { QRCodeSVG } from "qrcode.react";

import type { LinkCriado } from "../api/links.ts";
import { BotaoDeCopiar } from "./BotaoDeCopiar.tsx";

const TAMANHO_DO_QR_CODE = 144;

interface Props {
  readonly link: LinkCriado;
}

export function Comprovante({ link }: Props) {
  return (
    <section className="comprovante" aria-label="Link criado">
      <div className="dados">
        <h2>Seu link curto</h2>
        <a className="url-curta" href={link.urlCurta} target="_blank" rel="noreferrer">
          {link.urlCurta}
        </a>
        <p className="url-original" title={link.url}>
          Leva para {link.url}
        </p>
        <BotaoDeCopiar texto={link.urlCurta} />
      </div>
      <div className="canhoto">
        <QRCodeSVG
          value={link.urlCurta}
          size={TAMANHO_DO_QR_CODE}
          marginSize={2}
          title="QR Code do link curto"
        />
      </div>
    </section>
  );
}
