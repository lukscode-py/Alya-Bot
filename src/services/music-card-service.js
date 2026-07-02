import { createRequire } from "node:module";

import axios from "axios";

import { BOT_NAME } from "../config.js";
import { getMusicCardTemplate } from "../utils/database.js";

const require = createRequire(import.meta.url);
const { createCard, getRendererInfo, renderCard } = require("tmxcards");

const MUSIC_CARD_IDS = {
  player: "music/player",
  orbit: "music/orbit",
};

const IMAGE_USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
  "(KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36";

function safeText(value, fallback) {
  const text = String(value || "").trim();

  return text || fallback;
}

function clampProgress(value) {
  const number = Number(value);

  if (!Number.isFinite(number)) {
    return 18;
  }

  return Math.max(0, Math.min(100, number));
}

function isRemoteImage(image) {
  return /^https?:\/\//i.test(String(image || "").trim());
}

function normalizeMimeType(contentType) {
  const mimeType = String(contentType || "").split(";")[0].trim();

  if (mimeType.startsWith("image/")) {
    return mimeType;
  }

  return "image/jpeg";
}

async function fetchThumbnailBuffer(thumbnail) {
  const image = String(thumbnail || "").trim();

  if (!isRemoteImage(image)) {
    return null;
  }

  const { data, headers } = await axios.get(image, {
    responseType: "arraybuffer",
    timeout: 12000,
    headers: {
      "user-agent": IMAGE_USER_AGENT,
      referer: "https://www.youtube.com/",
    },
  });

  const buffer = Buffer.from(data);

  if (!buffer.length) {
    return null;
  }

  return {
    buffer,
    mimeType: normalizeMimeType(headers["content-type"]),
  };
}

async function normalizeCover(thumbnail) {
  const image = String(thumbnail || "").trim();

  if (!image) {
    return {
      enabled: false,
      placeholderText: "ALYA",
    };
  }

  try {
    const thumbnailBuffer = await fetchThumbnailBuffer(image);

    if (thumbnailBuffer) {
      return {
        enabled: true,
        ...thumbnailBuffer,
      };
    }
  } catch {
    // Se a thumb remota falhar, mantém fallback por URL.
  }

  return {
    enabled: true,
    url: image,
    imageUrl: image,
  };
}

async function normalizeBackground(thumbnail) {
  const image = String(thumbnail || "").trim();

  if (!image) {
    return {};
  }

  try {
    const thumbnailBuffer = await fetchThumbnailBuffer(image);

    if (thumbnailBuffer) {
      return {
        ...thumbnailBuffer,
        opacity: 0.18,
        blur: 8,
        overlayOpacity: 0.58,
      };
    }
  } catch {
    // Se falhar, tenta URL direta como fallback.
  }

  return {
    url: image,
    imageUrl: image,
    opacity: 0.18,
    blur: 8,
    overlayOpacity: 0.58,
  };
}

export function resolveMusicCardId(template = getMusicCardTemplate()) {
  return MUSIC_CARD_IDS[template] || MUSIC_CARD_IDS.player;
}

export function getMusicCardRuntimeInfo() {
  return {
    renderer: getRendererInfo(),
    template: getMusicCardTemplate(),
    cardId: resolveMusicCardId(),
  };
}

export async function renderMusicCardBuffer({
  template = getMusicCardTemplate(),
  title,
  author,
  duration,
  thumbnail,
  progress = 18,
}) {
  const selectedTemplate = template === "orbit" ? "orbit" : "player";
  const cardId = resolveMusicCardId(selectedTemplate);

  const cleanTitle = safeText(title, "Música encontrada");
  const cleanAuthor = safeText(author, BOT_NAME);
  const cleanDuration = safeText(duration, "Desconhecida");

  const cover = await normalizeCover(thumbnail);
  const background = await normalizeBackground(thumbnail);

  const card = createCard(cardId, {
    title: cleanTitle,
    subtitle: cleanAuthor,
    music: {
      title: cleanTitle,
      artist: cleanAuthor,
      subtitle: cleanAuthor,
      duration: cleanDuration,
    },
    cover,
    background,
    text: {
      badge: { value: "ALYA PLAY" },
      title: { value: cleanTitle },
      subtitle: { value: cleanAuthor },
      timeStart: { value: "0:00" },
      timeEnd: { value: cleanDuration },
    },
    tag: {
      text: "ALYA PLAY",
    },
    bottomBlock: {
      enabled: true,
      text: `${cleanDuration} • ${cleanAuthor}`,
    },
    progress: {
      value: clampProgress(progress),
    },
    output: {
      format: "png",
      returnType: "buffer",
    },
  });

  const result = await renderCard(card);

  if (!result?.buffer?.length) {
    throw new Error("Não foi possível renderizar o card de música.");
  }

  return result.buffer;
}
