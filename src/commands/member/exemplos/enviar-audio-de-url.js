import { delay } from "baileys";
import { PREFIX } from "../../../config.js";
import { SAMPLE_URLS } from "../../../utils/sample-media.js";

export default {
  name: "enviar-audio-de-url",
  description: "Exemplo de como enviar um áudio através de um link/url",
  commands: ["enviar-audio-de-url"],
  usage: `${PREFIX}enviar-audio-de-url`,
  /**
   * @param {CommandHandleProps} props
   */
  handle: async ({ sendReply, sendAudioFromURL, sendReact }) => {
    await sendReact("🔈");

    await delay(3000);

    await sendReply(
      "Vou enviar um áudio de um link, enviarei como reprodução de arquivo."
    );

    await delay(3000);

    await sendAudioFromURL(SAMPLE_URLS.audio);

    await delay(3000);

    await sendReply(
      "Agora enviarei um áudio de um link, porém como se eu tivesse gravado o áudio."
    );

    await delay(3000);

    await sendAudioFromURL(SAMPLE_URLS.audio, true);

    await delay(3000);

    await sendReply(
      "Agora enviarei um áudio de um link, porém sem mencionar em cima da sua mensagem."
    );

    await delay(3000);

    await sendAudioFromURL(SAMPLE_URLS.audio, false, false);

    await delay(3000);

    await sendReply(
      "E por fim, enviarei um áudio de um link, como se eu tivesse gravado, porém sem mencionar em cima da sua mensagem."
    );

    await delay(3000);

    await sendAudioFromURL(SAMPLE_URLS.audio, true, false);
  },
};
