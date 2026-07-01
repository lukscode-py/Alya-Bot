import { delay } from "baileys";
import { PREFIX } from "../../../config.js";
import { getBuffer } from "../../../utils/index.js";
import {
  readLocalSample,
  readRemoteSampleBuffer,
} from "../../../utils/sample-media.js";

export default {
  name: "enviar-video-de-buffer",
  description: "Exemplo de como enviar um vídeo a partir de um buffer",
  commands: ["enviar-video-de-buffer"],
  usage: `${PREFIX}enviar-video-de-buffer`,
  /**
   * @param {CommandHandleProps} props
   */
  handle: async ({ sendReply, sendReact, sendVideoFromBuffer, userLid }) => {
    await sendReact("🎥");

    await delay(3000);

    await sendReply(
      "Vou enviar um vídeo a partir de um buffer de arquivo local"
    );

    await delay(3000);

    const videoBuffer = readLocalSample("sample-video.mp4");

    await sendVideoFromBuffer(videoBuffer, "Aqui está o vídeo do buffer local");

    await delay(3000);

    await sendReply("Agora vou enviar um vídeo a partir de um buffer de URL");

    await delay(3000);

    const urlBuffer = await readRemoteSampleBuffer("sample-video.mp4", getBuffer);

    await sendVideoFromBuffer(urlBuffer, "Aqui está o vídeo do buffer de URL");

    await delay(3000);

    await sendReply("Você também pode enviar vídeos de buffer sem legenda");

    await delay(3000);

    await sendVideoFromBuffer(videoBuffer);

    await delay(3000);

    await sendReply(
      "Também vídeos de buffer com legenda, mencionando o usuário:"
    );

    await delay(3000);

    await sendVideoFromBuffer(
      await readRemoteSampleBuffer("sample-video.mp4", getBuffer),
      `Aqui está o vídeo que você pediu @${userLid.split("@")[0]}!`,
      [userLid]
    );

    await delay(3000);

    await sendReply(
      "Para enviar vídeos de buffer, use a função sendVideoFromBuffer(url, caption, [mentions], quoted).\n\n" +
        "Isso é útil quando você tem vídeos hospedados online ou obtidos de APIs."
    );
  },
};
