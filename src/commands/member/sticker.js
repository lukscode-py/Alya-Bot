import { PREFIX } from "../../config.js";
import { InvalidParameterError } from "../../errors/index.js";
import { createSticker } from "../../services/sticker.js";

function assertStickerInput({ isImage, isVideo }) {
  if (!isImage && !isVideo) {
    throw new InvalidParameterError(
      "Você precisa marcar ou responder a uma imagem, gif ou vídeo.",
    );
  }
}

export default {
  name: "sticker",
  description: "Cria figurinhas de imagem, gif ou vídeo de até 10 segundos.",
  commands: ["f", "s", "sticker", "fig"],
  usage: `${PREFIX}sticker (marque ou responda uma imagem/gif/vídeo)`,
  /**
   * @param {CommandHandleProps} props
   */
  handle: async (paramsHandler) => {
    const { isImage, isVideo, sendWaitReact, sendSuccessReact } = paramsHandler;

    assertStickerInput({ isImage, isVideo });

    await sendWaitReact();
    await createSticker(paramsHandler);
    await sendSuccessReact();
  },
};
