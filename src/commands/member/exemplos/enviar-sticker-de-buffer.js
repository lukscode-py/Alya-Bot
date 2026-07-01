import { delay } from "baileys";
import { PREFIX } from "../../../config.js";
import { getBuffer } from "../../../utils/index.js";
import {
  readLocalSample,
  readRemoteSampleBuffer,
} from "../../../utils/sample-media.js";

export default {
  name: "enviar-sticker-de-buffer",
  description: "Exemplo de como enviar um sticker a partir de um buffer",
  commands: ["enviar-sticker-de-buffer"],
  usage: `${PREFIX}enviar-sticker-de-buffer`,
  /**
   * @param {CommandHandleProps} props
   */
  handle: async ({ sendReply, sendReact, sendStickerFromBuffer }) => {
    await sendReact("🏷️");

    await delay(3000);

    await sendReply(
      "Vou enviar um sticker a partir de um buffer de arquivo local"
    );

    await delay(3000);

    const stickerBuffer = readLocalSample("sample-sticker.webp");

    await sendStickerFromBuffer(stickerBuffer);

    await delay(3000);

    await sendReply(
      "Agora vou enviar um sticker a partir de um buffer de URL e sem mencionar a mensagem"
    );

    await delay(3000);

    const urlBuffer = await readRemoteSampleBuffer(
      "sample-sticker.webp",
      getBuffer,
    );

    await sendStickerFromBuffer(urlBuffer, false);

    await delay(3000);

    await sendReply(
      "Para enviar stickers de buffer, use a função sendStickerFromBuffer(buffer, quoted)."
    );

    await delay(3000);

    await sendReply(
      "💡 *Dica:* Buffers são úteis para stickers gerados dinamicamente ou convertidos de outros formatos."
    );
  },
};
