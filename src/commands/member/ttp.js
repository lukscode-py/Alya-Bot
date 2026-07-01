import { PREFIX } from "../../config.js";
import { InvalidParameterError } from "../../errors/index.js";
import { ttp } from "../../services/spider-x-api.js";
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
  name: "ttp",
  description: "Gera figurinha estática com o texto informado.",
  commands: ["ttp"],
  usage: `${PREFIX}ttp teste`,
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

    const url = await ttp(text);
    const response = await fetchRemoteCommandResource({
      url,
      commandName: "ttp",
      sendErrorReply,
    });

    if (!response) {
      return;
    }

    await sendSuccessReact();
    await sendStickerFromURL(url);
  },
};
