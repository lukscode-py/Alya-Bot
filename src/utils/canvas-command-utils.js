import fs from "node:fs";
import { PREFIX } from "../config.js";
import { DangerError, InvalidParameterError } from "../errors/index.js";
import { Ffmpeg } from "../services/ffmpeg.js";
import { upload } from "../services/linker.js";
import { canvas } from "../services/spider-x-api.js";
import { getRandomNumber } from "./index.js";
import { fetchRemoteCommandResource } from "./remote-service.js";

const IMAGE_REQUIRED_MESSAGE =
  "Você precisa marcar uma imagem ou responder a uma imagem.";

function buildImageUsage(commandName) {
  return `${PREFIX}${commandName} (marque a imagem) ou ${PREFIX}${commandName} (responda a imagem)`;
}

function assertImageInput(isImage) {
  if (!isImage) {
    throw new InvalidParameterError(IMAGE_REQUIRED_MESSAGE);
  }
}

function getFfmpegMethod(ffmpeg, methodName) {
  const method = ffmpeg[methodName];

  if (typeof method !== "function") {
    throw new Error(`Efeito de imagem não encontrado: ${methodName}`);
  }

  return method.bind(ffmpeg);
}

async function runFfmpegImageEffect({ downloadImage, effectMethod, webMessage }) {
  const ffmpeg = new Ffmpeg();
  let inputPath = null;

  try {
    inputPath = await downloadImage(webMessage);
    const applyEffect = getFfmpegMethod(ffmpeg, effectMethod);

    return await applyEffect(inputPath);
  } finally {
    if (inputPath) {
      await ffmpeg.cleanup(inputPath);
    }
  }
}

export function createFfmpegImageCommand({
  name,
  description,
  commands,
  effectMethod,
  effectErrorMessage,
}) {
  return {
    name,
    description,
    commands,
    usage: buildImageUsage(name),
    /**
     * @param {CommandHandleProps} props
     */
    handle: async ({
      isImage,
      downloadImage,
      sendSuccessReact,
      sendWaitReact,
      sendImageFromFile,
      webMessage,
    }) => {
      assertImageInput(isImage);

      await sendWaitReact();

      try {
        const outputPath = await runFfmpegImageEffect({
          downloadImage,
          effectMethod,
          webMessage,
        });

        await sendSuccessReact();
        await sendImageFromFile(outputPath);
      } catch (error) {
        throw new Error(`${effectErrorMessage}: ${error.message}`);
      }
    },
  };
}

function removeFileIfExists(filePath) {
  if (filePath && fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
}

async function uploadImageForRemoteCanvas({ downloadImage, webMessage }) {
  const fileName = getRandomNumber(10_000, 99_999).toString();
  const filePath = await downloadImage(webMessage, fileName);
  const buffer = fs.readFileSync(filePath);
  const imageUrl = await upload(buffer, `${fileName}.png`);

  if (!imageUrl) {
    throw new DangerError(
      "Não consegui fazer o upload da imagem. Tente novamente mais tarde!",
    );
  }

  return { filePath, imageUrl };
}

export function createRemoteCanvasCommand({
  name,
  description,
  commands,
  canvasType,
}) {
  return {
    name,
    description,
    commands,
    usage: buildImageUsage(name),
    /**
     * @param {CommandHandleProps} props
     */
    handle: async ({
      isImage,
      downloadImage,
      sendSuccessReact,
      sendWaitReact,
      sendImageFromURL,
      sendErrorReply,
      webMessage,
    }) => {
      assertImageInput(isImage);

      await sendWaitReact();

      let filePath = null;

      try {
        const uploadResult = await uploadImageForRemoteCanvas({
          downloadImage,
          webMessage,
        });

        filePath = uploadResult.filePath;

        const resultUrl = canvas(canvasType, uploadResult.imageUrl);
        const response = await fetchRemoteCommandResource({
          url: resultUrl,
          commandName: name,
          sendErrorReply,
        });

        if (!response) {
          return;
        }

        await sendSuccessReact();
        await sendImageFromURL(resultUrl, "Imagem gerada!");
      } finally {
        removeFileIfExists(filePath);
      }
    },
  };
}
