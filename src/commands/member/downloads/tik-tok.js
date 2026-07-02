import { PREFIX } from "../../../config.js";
import { InvalidParameterError, WarningError } from "../../../errors/index.js";
import {
  cleanupSocialTempFile,
  downloadSocialVideo,
  getSocialDownloadRuntimeInfo,
  isTikTokUrl,
} from "../../../services/social-download-service.js";
import { formatSuccessfulDeliveryCaption } from "../../../utils/delivery-caption.js";
import { errorLog } from "../../../utils/logger.js";

export default {
  name: "tik-tok",
  description: "Baixa vídeos do TikTok localmente com yt-dlp.",
  commands: ["tik-tok", "ttk", "tik"],
  usage: `${PREFIX}tik-tok https://www.tiktok.com/@usuario/video/7359413022483287301`,
  /**
   * @param {CommandHandleProps} props
   */
  handle: async ({
    sendVideoFromFile,
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

    let videoPath = "";

    try {
      await sendWaitReact();

      videoPath = await downloadSocialVideo(fullArgs, "tiktok");

      await sendVideoFromFile(videoPath, formatSuccessfulDeliveryCaption());
      await sendSuccessReact();
    } catch (error) {
      const runtimeInfo = getSocialDownloadRuntimeInfo("tiktok");

      errorLog(error?.stack || error?.message || String(error));
      errorLog(
        `Social runtime: yt-dlp=${runtimeInfo.binary} cookies=${runtimeInfo.cookies} cookiesPath=${runtimeInfo.cookiesPath}`,
      );

      await sendErrorReply(
        error?.message || "Não foi possível baixar esse vídeo do TikTok.",
      );
    } finally {
      cleanupSocialTempFile(videoPath);
    }
  },
};
