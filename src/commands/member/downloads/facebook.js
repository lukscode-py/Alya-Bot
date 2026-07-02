import { PREFIX } from "../../../config.js";
import { InvalidParameterError, WarningError } from "../../../errors/index.js";
import {
  cleanupSocialTempFile,
  downloadFacebookMedia,
  getSocialDownloadRuntimeInfo,
  isFacebookUrl,
} from "../../../services/social-download-service.js";
import { formatSuccessfulDeliveryCaption } from "../../../utils/delivery-caption.js";
import { errorLog } from "../../../utils/logger.js";

export default {
  name: "facebook",
  description: "Baixa vídeos ou imagens do Facebook localmente.",
  commands: ["facebook", "fb", "face"],
  usage: `${PREFIX}facebook https://www.facebook.com/watch/?v=123456789`,
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
        "Você precisa enviar uma URL do Facebook!",
      );
    }

    if (!isFacebookUrl(fullArgs)) {
      throw new WarningError("O link não é do Facebook!");
    }

    let media = null;

    try {
      await sendWaitReact();

      media = await downloadFacebookMedia(fullArgs);

      if (media.type === "video") {
        await sendVideoFromFile(media.path, formatSuccessfulDeliveryCaption());
      } else {
        await sendImageFromFile(media.path, formatSuccessfulDeliveryCaption());
      }

      await sendSuccessReact();
    } catch (error) {
      const runtimeInfo = getSocialDownloadRuntimeInfo("facebook");

      errorLog(error?.stack || error?.message || String(error));
      errorLog(
        `Social runtime: yt-dlp=${runtimeInfo.binary} cookies=${runtimeInfo.cookies} cookiesPath=${runtimeInfo.cookiesPath}`,
      );

      await sendErrorReply(
        error?.message ||
          "Não foi possível baixar esse conteúdo do Facebook.",
      );
    } finally {
      cleanupSocialTempFile(media?.path);
    }
  },
};
