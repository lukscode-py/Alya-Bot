import fs from "node:fs";
import path from "node:path";
import { BOT_EMOJI, BOT_NAME, PREFIX, TEMP_DIR } from "../../config.js";
import { InvalidParameterError } from "../../errors/index.js";
import { brat } from "../../services/alya-external-api.js";
import { processStaticSticker } from "../../services/sticker.js";
import { getRandomName } from "../../utils/index.js";
import { fetchRemoteCommandResource } from "../../utils/remote-service.js";

function readBratText(fullArgs) {
  return fullArgs.trim();
}

function validateBratText(text) {
  if (!text) {
    throw new InvalidParameterError(
      "Você precisa informar o texto que deseja transformar em imagem.",
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

async function saveRemoteImage(response) {
  const inputPath = path.resolve(TEMP_DIR, getRandomName("png"));
  const imageBuffer = Buffer.from(await response.arrayBuffer());

  await fs.promises.writeFile(inputPath, imageBuffer);

  return inputPath;
}

function removeFileIfExists(filePath) {
  if (filePath && fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
}

export default {
  name: "brat",
  description: "Gera uma figurinha estática no estilo brat.",
  commands: ["brat"],
  usage: `${PREFIX}brat Nem judas mentiu tanto assim ☠️`,
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

    const url = await brat(text);
    const response = await fetchRemoteCommandResource({
      url,
      commandName: "brat",
      sendErrorReply,
    });

    if (!response) {
      return;
    }

    let inputPath = null;
    let finalStickerPath = null;

    try {
      inputPath = await saveRemoteImage(response);
      finalStickerPath = await processStaticSticker(
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
