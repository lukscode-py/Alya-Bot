import { PREFIX } from "../../../config.js";
import { InvalidParameterError, WarningError } from "../../../errors/index.js";
import {
  cleanupSocialTempFile,
  downloadSocialAudio,
  getSocialDownloadRuntimeInfo,
  isTikTokUrl,
} from "../../../services/social-download-service.js";
import { errorLog } from "../../../utils/logger.js";

export default {
  name: "tik-tok-audio",
  description: "Baixa áudios de vídeos do TikTok localmente com yt-dlp.",
  commands: [
    "tik-tok-audio",
    "tik-tok-mp3",
    "tik-audio",
    "tik-mp3",
    "ttk-audio",
    "ttk-mp3",
  ],
  usage: `${PREFIX}tik-tok-audio https://www.tiktok.com/@usuario/video/7384803418855984389`,
  /**
   * @param {CommandHandleProps} props
   */
  handle: async ({
    sendAudioFromFile,
    fullArgs,
    sendWaitReact,
    sendSuccessReact,
    sendErrorReply,
  }) => {
    if (!fullArgs.length) {
      throw new InvalidParameterError("Você precisa enviar uma URL do TikTok!");
    }

    if (!isTikTokUrl(fullArgs)) {
      throw new WarningError("O link não é do TikTok!");
    }

    let audioPath = "";

    try {
      await sendWaitReact();

      audioPath = await downloadSocialAudio(fullArgs, "tiktok");

      await sendAudioFromFile(audioPath);
      await sendSuccessReact();
    } catch (error) {
      const runtimeInfo = getSocialDownloadRuntimeInfo("tiktok");

      errorLog(error?.stack || error?.message || String(error));
      errorLog(
        `Social runtime: yt-dlp=${runtimeInfo.binary} cookies=${runtimeInfo.cookies} cookiesPath=${runtimeInfo.cookiesPath}`,
      );

      await sendErrorReply(
        error?.message || "Não foi possível baixar esse áudio do TikTok.",
      );
    } finally {
      cleanupSocialTempFile(audioPath);
    }
  },
};
