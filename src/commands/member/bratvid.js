import fs from "node:fs";
import path from "node:path";
import { BOT_EMOJI, BOT_NAME, PREFIX, TEMP_DIR } from "../../config.js";
import { InvalidParameterError } from "../../errors/index.js";
import { abrat } from "../../services/spider-x-api.js";
import { processAnimatedGifToSticker } from "../../services/sticker.js";
import { getRandomName } from "../../utils/index.js";
import { fetchRemoteCommandResource } from "../../utils/remote-service.js";

function readBratText(fullArgs) {
  return fullArgs.trim();
}

function validateBratText(text) {
  if (!text) {
    throw new InvalidParameterError(
      "Você precisa informar o texto que deseja transformar em figurinha animada.",
    );
  }
}

function buildStickerMetadata({ webMessage, userLid }) {
  const username =
    webMessage.pushName || webMessage.notifyName || userLid.replace(/@lid/, "");

  return {
    username,
    botName: `${BOT_EMOJI} ${BOT_NAME}`,
  };
}

async function saveRemoteGif(response) {
  const inputPath = path.resolve(TEMP_DIR, getRandomName("gif"));
  const gifBuffer = Buffer.from(await response.arrayBuffer());

  await fs.promises.writeFile(inputPath, gifBuffer);

  return inputPath;
}

function removeFileIfExists(filePath) {
  if (filePath && fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
}

export default {
  name: "bratvid",
  description: "Gera uma figurinha animada no estilo brat.",
  commands: ["bratvid", "abrat"],
  usage: `${PREFIX}bratvid Nem judas mentiu tanto assim ☠️`,
  /**
   * @param {CommandHandleProps} props
   */
  handle: async ({
    sendWaitReact,
    fullArgs,
    sendStickerFromFile,
    sendSuccessReact,
    sendErrorReply,
    webMessage,
    userLid,
  }) => {
    const text = readBratText(fullArgs);

    validateBratText(text);
    await sendWaitReact();

    const url = await abrat(text);
    const response = await fetchRemoteCommandResource({
      url,
      commandName: "bratvid",
      sendErrorReply,
    });

    if (!response) {
      return;
    }

    let inputPath = null;
    let finalStickerPath = null;

    try {
      inputPath = await saveRemoteGif(response);
      finalStickerPath = await processAnimatedGifToSticker(
        inputPath,
        buildStickerMetadata({ webMessage, userLid }),
      );

      await sendSuccessReact();
      await sendStickerFromFile(finalStickerPath);
    } finally {
      removeFileIfExists(inputPath);
      removeFileIfExists(finalStickerPath);
    }
  },
};
