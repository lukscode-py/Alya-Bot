import { PREFIX } from "../../config.js";
import { InvalidParameterError } from "../../errors/index.js";
import { attp } from "../../services/alya-external-api.js";
import { fetchRemoteCommandResource } from "../../utils/remote-service.js";

function readStickerText(args) {
  return args.join(" ").trim();
}

function validateStickerText(text) {
  if (!text) {
    throw new InvalidParameterError(
      "Você precisa informar o texto que deseja transformar em figurinha.",
    );
  }
}

export default {
  name: "attp",
  description: "Gera figurinha animada com o texto informado.",
  commands: ["attp"],
  usage: `${PREFIX}attp teste`,
  /**
   * @param {CommandHandleProps} props
   */
  handle: async ({
    sendWaitReact,
    args,
    sendStickerFromURL,
    sendSuccessReact,
    sendErrorReply,
  }) => {
    const text = readStickerText(args);

    validateStickerText(text);
    await sendWaitReact();

    const url = await attp(text);
    const response = await fetchRemoteCommandResource({
      url,
      commandName: "attp",
      sendErrorReply,
    });

    if (!response) {
      return;
    }

    await sendSuccessReact();
    await sendStickerFromURL(url);
  },
};
