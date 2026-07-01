import path from "node:path";
import { ASSETS_DIR } from "../config.js";
import { InvalidParameterError } from "../errors/index.js";
import { onlyNumbers } from "./index.js";

export function resolveMentionedLid(rawMention) {
  const number = onlyNumbers(rawMention || "");

  if (!number) {
    return null;
  }

  return `${number}@lid`;
}

export function assertMinimumTextLength(text, minLength, errorMessage) {
  if (String(text || "").trim().length < minLength) {
    throw new InvalidParameterError(errorMessage);
  }
}

export function buildFakeQuotedMessage({ remoteJid, mentionedLid, quotedText }) {
  return {
    key: {
      fromMe: false,
      participant: mentionedLid,
      remoteJid,
    },
    message: {
      extendedTextMessage: {
        text: quotedText,
        contextInfo: {
          mentionedJid: [mentionedLid],
        },
      },
    },
  };
}

export function formatProcessUptime(totalSeconds) {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = Math.floor(totalSeconds % 60);

  return `${hours}h ${minutes}m ${seconds}s`;
}

export function getDiceStickerPath(result) {
  return path.resolve(ASSETS_DIR, "stickers", "dice", `${result}.webp`);
}
