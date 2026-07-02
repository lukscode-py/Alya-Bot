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
  name: "yt-mp4",
  description: "Baixa vídeo do YouTube por termo ou link.",
  commands: ["yt-mp4", "youtube-mp4", "yt-video", "youtube-video", "mp4"],
  usage: `${PREFIX}yt-mp4 MC Hariel ou ${PREFIX}yt-mp4 https://youtube.com/watch?v=...`,
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
        "Você precisa enviar o nome ou link do vídeo do YouTube!",
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
