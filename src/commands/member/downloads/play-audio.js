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
  name: "play-audio",
  description: "Pesquisa e baixa músicas do YouTube por termo ou link.",
  commands: ["play-audio", "play", "pa"],
  usage: `${PREFIX}play-audio MC Hariel ou ${PREFIX}play-audio https://youtube.com/watch?v=...`,
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
        "Você precisa me dizer o nome ou link da música!",
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
        error?.message || "Não foi possível baixar essa música.",
      );
    } finally {
      cleanupYoutubeTempFile(audioPath);
    }
  },
};
