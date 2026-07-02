import { PREFIX } from "../../../config.js";
import { InvalidParameterError } from "../../../errors/index.js";
import {
  buildAlyaPlayVideoMessage,
  cleanupYoutubeTempFile,
  downloadYoutubeVideo,
  resolveYoutubeInput,
} from "../../../services/youtube-local-service.js";
import { errorLog } from "../../../utils/logger.js";

export default {
  name: "play-video",
  description: "Pesquisa e baixa vídeos do YouTube por termo ou link.",
  commands: ["play-video", "pv"],
  usage: `${PREFIX}play-video MC Hariel ou ${PREFIX}play-video https://youtube.com/watch?v=...`,
  /**
   * @param {CommandHandleProps} props
   */
  handle: async ({
    fullArgs,
    sendReply,
    sendVideoFromFile,
    sendWaitReact,
    sendSuccessReact,
    sendErrorReply,
  }) => {
    if (!fullArgs.length) {
      throw new InvalidParameterError(
        "Você precisa me dizer o nome ou link do vídeo!",
      );
    }

    let videoPath = "";

    try {
      await sendWaitReact();

      const video = await resolveYoutubeInput(fullArgs);

      await sendReply(
        buildAlyaPlayVideoMessage({
          title: video.title,
          author: video.author,
          duration: video.duration,
          url: video.url,
        }),
      );

      videoPath = await downloadYoutubeVideo(video.url);

      await sendVideoFromFile(videoPath);
      await sendSuccessReact();
    } catch (error) {
      errorLog(error?.stack || error?.message || String(error));
      await sendErrorReply(
        error?.message || "Não foi possível baixar esse vídeo.",
      );
    } finally {
      cleanupYoutubeTempFile(videoPath);
    }
  },
};
