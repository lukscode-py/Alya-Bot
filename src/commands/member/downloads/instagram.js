import { PREFIX } from "../../../config.js";
import { InvalidParameterError, WarningError } from "../../../errors/index.js";
import {
  cleanupSocialTempFile,
  downloadSocialVideo,
  getSocialDownloadRuntimeInfo,
  isInstagramUrl,
} from "../../../services/social-download-service.js";
import { formatSuccessfulDeliveryCaption } from "../../../utils/delivery-caption.js";
import { errorLog } from "../../../utils/logger.js";

export default {
  name: "instagram",
  description: "Baixa vídeos/reels do Instagram localmente com yt-dlp.",
  commands: ["instagram", "ig", "inst", "insta"],
  usage: `${PREFIX}instagram https://www.instagram.com/reel/Cx789012345/`,
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
      throw new InvalidParameterError(
        "Você precisa enviar uma URL do Instagram!",
      );
    }

    if (!isInstagramUrl(fullArgs)) {
      throw new WarningError("O link não é do Instagram!");
    }

    let videoPath = "";

    try {
      await sendWaitReact();

      videoPath = await downloadSocialVideo(fullArgs, "instagram");

      await sendVideoFromFile(videoPath, formatSuccessfulDeliveryCaption());
      await sendSuccessReact();
    } catch (error) {
      const runtimeInfo = getSocialDownloadRuntimeInfo("instagram");

      errorLog(error?.stack || error?.message || String(error));
      errorLog(
        `Social runtime: yt-dlp=${runtimeInfo.binary} cookies=${runtimeInfo.cookies} cookiesPath=${runtimeInfo.cookiesPath}`,
      );

      await sendErrorReply(
        error?.message ||
          "Não foi possível baixar esse conteúdo do Instagram.",
      );
    } finally {
      cleanupSocialTempFile(videoPath);
    }
  },
};
