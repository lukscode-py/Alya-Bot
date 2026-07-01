import { delay } from "baileys";
import { PREFIX } from "../../../config.js";
import { getBuffer } from "../../../utils/index.js";
import {
  readLocalLabMedia,
  readRemoteLabMediaBuffer,
} from "../../../utils/lab-media.js";

export default {
  name: "enviar-audio-de-buffer",
  description: "Exemplo de como enviar um áudio através de um buffer",
  commands: ["enviar-audio-de-buffer"],
  usage: `${PREFIX}enviar-audio-de-buffer`,
  /**
   * @param {CommandHandleProps} props
   */
  handle: async ({ sendReply, sendAudioFromBuffer, sendReact }) => {
    await sendReact("🔈");

    await delay(3000);

    await sendReply(
      "Vou enviar um áudio de um buffer extraído de uma URL, enviarei como reprodução de arquivo."
    );

    await delay(3000);

    await sendAudioFromBuffer(
      await readRemoteLabMediaBuffer("lab-audio.mp3", getBuffer)
    );

    await delay(3000);

    await sendReply(
      "Agora enviarei um áudio de um buffer extraído de um arquivo, porém como se eu tivesse gravado o áudio."
    );

    await delay(3000);

    await sendAudioFromBuffer(
      readLocalLabMedia("lab-audio.mp3"),
      true
    );

    await delay(3000);

    await sendReply(
      "Agora enviarei um áudio de um buffer extraído de um arquivo, porém sem mencionar em cima da sua mensagem."
    );

    await delay(3000);

    await sendAudioFromBuffer(
      readLocalLabMedia("lab-audio.mp3"),
      false,
      false
    );

    await delay(3000);

    await sendReply(
      "E por fim, enviarei um áudio de um buffer extraído de uma URL, como se eu tivesse gravado, porém sem mencionar em cima da sua mensagem."
    );

    await delay(3000);

    await sendAudioFromBuffer(
      await readRemoteLabMediaBuffer("lab-audio.mp3", getBuffer),
      true,
      false
    );
  },
};
