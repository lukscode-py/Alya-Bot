import { delay } from "baileys";
import { PREFIX } from "../../../config.js";
import { getBuffer } from "../../../utils/index.js";
import {
  readLocalSample,
  readRemoteSampleBuffer,
} from "../../../utils/sample-media.js";

export default {
  name: "enviar-documento-de-buffer",
  description: "Exemplo de como enviar documentos a partir de buffers",
  commands: ["enviar-documento-de-buffer"],
  usage: `${PREFIX}enviar-documento-de-buffer`,
  /**
   * @param {CommandHandleProps} props
   */
  handle: async ({ sendReply, sendReact, socket, remoteJid, webMessage }) => {
    await sendReact("📄");

    await delay(3000);

    await sendReply(
      "Vou enviar documentos a partir de buffers (arquivo local e URL)"
    );

    await delay(3000);

    const fileBuffer = readLocalSample("sample-document.pdf");

    await socket.sendMessage(
      remoteJid,
      {
        document: fileBuffer,
        mimetype: "application/pdf",
        fileName: "documento-de-buffer-local.pdf",
      },
      { quoted: webMessage }
    );

    await delay(3000);

    await sendReply(
      "Agora vou enviar um documento a partir de um buffer de URL"
    );

    await delay(3000);

    const urlBuffer = await readRemoteSampleBuffer("sample-text.txt", getBuffer);

    await socket.sendMessage(
      remoteJid,
      {
        document: urlBuffer,
        mimetype: "text/plain",
        fileName: "arquivo-de-buffer-url.txt",
      },
      { quoted: webMessage }
    );

    await delay(3000);

    await sendReply(
      "Você também pode enviar documentos de buffer com mimetype padrão:"
    );

    await delay(3000);

    await socket.sendMessage(
      remoteJid,
      {
        document: fileBuffer,
        fileName: "documento-buffer-default.pdf",
      },
      { quoted: webMessage }
    );

    await delay(3000);

    await sendReply(
      "Para enviar documentos de buffer, use socket.sendMessage() diretamente com o buffer.\n\n" +
        "Isso é útil quando você tem documentos processados em memória ou precisa manipular o arquivo antes de enviar."
    );

    await delay(3000);

    await sendReply(
      "💡 *Dica:* Buffers são úteis para documentos gerados dinamicamente ou quando você precisa processar o arquivo antes do envio."
    );
  },
};
