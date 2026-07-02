import { PREFIX } from "../../../config.js";
import { InvalidParameterError } from "../../../errors/index.js";
import {
  buildAlyaPlayAudioMessage,
  cleanupYoutubeTempFile,
  downloadYoutubeAudio,
  resolveYoutubeInput,
} from "../../../services/youtube-local-service.js";
import { errorLog } from "../../../utils/logger.js";

export default {
  name: "yt-mp3",
  description: "Baixa áudio do YouTube por termo ou link.",
  commands: ["yt-mp3", "youtube-mp3", "yt-audio", "youtube-audio", "mp3"],
  usage: `${PREFIX}yt-mp3 MC Hariel ou ${PREFIX}yt-mp3 https://youtube.com/watch?v=...`,
  /**
   * @param {CommandHandleProps} props
   */
  handle: async ({
    fullArgs,
    sendReply,
    sendAudioFromFile,
    sendWaitReact,
    sendSuccessReact,
    sendErrorReply,
  }) => {
    if (!fullArgs.length) {
      throw new InvalidParameterError(
        "Você precisa enviar o nome ou link do vídeo do YouTube!",
      );
    }

    let audioPath = "";

    try {
      await sendWaitReact();

      const video = await resolveYoutubeInput(fullArgs);

      await sendReply(
        buildAlyaPlayAudioMessage({
          title: video.title,
          author: video.author,
          duration: video.duration,
          url: video.url,
        }),
      );

      audioPath = await downloadYoutubeAudio(video.url);

      await sendAudioFromFile(audioPath);
      await sendSuccessReact();
    } catch (error) {
      errorLog(error?.stack || error?.message || String(error));
      await sendErrorReply(
        error?.message || "Não foi possível baixar esse áudio.",
      );
    } finally {
      cleanupYoutubeTempFile(audioPath);
    }
  },
};
