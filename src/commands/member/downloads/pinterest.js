import { PREFIX } from "../../../config.js";
import { InvalidParameterError, WarningError } from "../../../errors/index.js";
import {
  cleanupSocialTempFile,
  downloadPinterestMedia,
  getSocialDownloadRuntimeInfo,
  isPinterestUrl,
} from "../../../services/social-download-service.js";
import { formatSuccessfulDeliveryCaption } from "../../../utils/delivery-caption.js";
import { errorLog } from "../../../utils/logger.js";

export default {
  name: "pinterest",
  description: "Baixa imagens ou vídeos do Pinterest localmente.",
  commands: ["pinterest", "pin"],
  usage: `${PREFIX}pinterest https://www.pinterest.com/pin/123456789/`,
  /**
   * @param {CommandHandleProps} props
   */
  handle: async ({
    sendImageFromFile,
    sendVideoFromFile,
    fullArgs,
    sendWaitReact,
    sendSuccessReact,
    sendErrorReply,
  }) => {
    if (!fullArgs.length) {
      throw new InvalidParameterError(
        "Você precisa enviar uma URL do Pinterest!",
      );
    }

    if (!isPinterestUrl(fullArgs)) {
      throw new WarningError("O link não é do Pinterest!");
    }

    let media = null;

    try {
      await sendWaitReact();

      media = await downloadPinterestMedia(fullArgs);

      if (media.type === "video") {
        await sendVideoFromFile(media.path, formatSuccessfulDeliveryCaption());
      } else {
        await sendImageFromFile(media.path, formatSuccessfulDeliveryCaption());
      }

      await sendSuccessReact();
    } catch (error) {
      const runtimeInfo = getSocialDownloadRuntimeInfo("pinterest");

      errorLog(error?.stack || error?.message || String(error));
      errorLog(
        `Social runtime: yt-dlp=${runtimeInfo.binary} cookies=${runtimeInfo.cookies} cookiesPath=${runtimeInfo.cookiesPath}`,
      );

      await sendErrorReply(
        error?.message ||
          "Não foi possível baixar esse conteúdo do Pinterest.",
      );
    } finally {
      cleanupSocialTempFile(media?.path);
    }
  },
};
