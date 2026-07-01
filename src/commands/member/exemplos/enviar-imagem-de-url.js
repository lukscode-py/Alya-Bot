import { delay } from "baileys";
import { PREFIX } from "../../../config.js";
import { SAMPLE_URLS } from "../../../utils/sample-media.js";

export default {
  name: "enviar-imagem-de-url",
  description: "Exemplo de como enviar uma imagem a partir de uma URL",
  commands: ["enviar-imagem-de-url"],
  usage: `${PREFIX}enviar-imagem-de-url`,
  /**
   * @param {CommandHandleProps} props
   */
  handle: async ({ sendReply, sendImageFromURL, sendReact, userLid }) => {
    await sendReact("🖼️");

    await delay(3000);

    await sendReply("Vou enviar uma imagem a partir de uma URL");

    await delay(3000);

    await sendImageFromURL(
      SAMPLE_URLS.image,
      "Esta é uma legenda para a imagem da URL"
    );

    await delay(3000);

    await sendReply("Você também pode enviar imagens de URL sem legenda:");

    await delay(3000);

    await sendImageFromURL(SAMPLE_URLS.image);

    await delay(3000);

    await sendReply("Agora vou enviar uma imagem de URL mencionando você:");

    await delay(3000);

    await sendImageFromURL(
      SAMPLE_URLS.image,
      `Logo da Alya Bot para você ${userLid.split("@")[0]}!`,
      [userLid]
    );

    await sendReply(
      "Para enviar imagens de URL, use a função sendImageFromURL(url, caption, [mentions], quoted).\n\n" +
        "Isso é útil quando você tem imagens hospedadas online ou obtidas de APIs."
    );
  },
};
