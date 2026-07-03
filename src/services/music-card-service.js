import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";

import axios from "axios";

import * as config from "../config.js";
import { getMusicCardTemplate } from "../utils/database.js";

const BOT_NAME = config.BOT_NAME || "Alya";
const BOT_BANNER_PATH = config.BOT_BANNER_PATH || "";

const require = createRequire(import.meta.url);
const { createCard, getRendererInfo, renderCard } = require("tmxcards");

const MUSIC_CARD_IDS = {
  player: "music/player",
  orbit: "music/orbit",
};

const IMAGE_USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
  "(KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36";

const FALLBACK_IMAGE_PATHS = [
  BOT_BANNER_PATH,
  path.join(process.cwd(), "assets", "images", "alya-bot-preview.png"),
  path.join(process.cwd(), "assets", "images", "alya-preview.png"),
  path.join(process.cwd(), "assets", "images", "alya.png"),
  path.join(process.cwd(), "assets", "images", "banner.png"),
  path.join(process.cwd(), "assets", "images", "logo.png"),
].filter(Boolean);

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

function normalizeMimeType(contentType, fallback = "image/jpeg") {
  const mimeType = String(contentType || "").split(";")[0].trim();

  if (mimeType.startsWith("image/")) {
    return mimeType;
  }

  return fallback;
}

function getMimeTypeFromPath(filePath) {
  const extension = path.extname(String(filePath || "")).toLowerCase();

  if (extension === ".png") {
    return "image/png";
  }

  if (extension === ".webp") {
    return "image/webp";
  }

  return "image/jpeg";
}

function toDataUri({ buffer, mimeType }) {
  if (!buffer?.length) {
    return "";
  }

  return `data:${normalizeMimeType(mimeType)};base64,${buffer.toString("base64")}`;
}

function createImageMedia(image) {
  if (!image?.buffer?.length) {
    return null;
  }

  const dataUri = toDataUri(image);

  return {
    enabled: true,
    buffer: image.buffer,
    data: image.buffer,
    mimeType: normalizeMimeType(image.mimeType),
    dataUri,
    href: dataUri,
    url: dataUri,
    imageUrl: dataUri,
    path: dataUri,
    imagePath: dataUri,
  };
}

function extractYoutubeVideoIdFromThumbnail(thumbnail) {
  const image = String(thumbnail || "");
  const match = image.match(/\/(?:vi|vi_webp)\/([^/?#]+)\//);

  return match?.[1] || "";
}

function buildThumbnailCandidates(thumbnail) {
  const image = String(thumbnail || "").trim();
  const candidates = [];

  if (image) {
    candidates.push(image);
  }

  const videoId = extractYoutubeVideoIdFromThumbnail(image);

  if (videoId) {
    candidates.push(
      `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`,
      `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
      `https://i.ytimg.com/vi/${videoId}/mqdefault.jpg`,
      `https://i.ytimg.com/vi/${videoId}/sddefault.jpg`,
      `https://i.ytimg.com/vi/${videoId}/default.jpg`,
      `https://i.ytimg.com/vi_webp/${videoId}/hqdefault.webp`,
      `https://i.ytimg.com/vi_webp/${videoId}/mqdefault.webp`,
    );
  }

  return [...new Set(candidates)].filter(isRemoteImage);
}

async function fetchImageBuffer(imageUrl) {
  const { data, headers } = await axios.get(imageUrl, {
    responseType: "arraybuffer",
    timeout: 12000,
    validateStatus: (code) => code >= 200 && code < 300,
    headers: {
      "user-agent": IMAGE_USER_AGENT,
      referer: "https://www.youtube.com/",
      accept: "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
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

async function fetchThumbnailBuffer(thumbnail) {
  const candidates = buildThumbnailCandidates(thumbnail);

  for (const candidate of candidates) {
    try {
      const image = await fetchImageBuffer(candidate);

      if (image?.buffer?.length) {
        return image;
      }
    } catch {
      // Tenta a próxima thumbnail.
    }
  }

  return null;
}

function readFallbackImageBuffer() {
  for (const imagePath of FALLBACK_IMAGE_PATHS) {
    try {
      if (!imagePath || !fs.existsSync(imagePath)) {
        continue;
      }

      const buffer = fs.readFileSync(imagePath);

      if (buffer.length) {
        return {
          buffer,
          mimeType: getMimeTypeFromPath(imagePath),
        };
      }
    } catch {
      // Tenta o próximo fallback local.
    }
  }

  return null;
}

async function resolveImageMedia(thumbnail) {
  const thumbnailBuffer = await fetchThumbnailBuffer(thumbnail);

  if (thumbnailBuffer?.buffer?.length) {
    return createImageMedia(thumbnailBuffer);
  }

  const fallbackBuffer = readFallbackImageBuffer();

  if (fallbackBuffer?.buffer?.length) {
    return createImageMedia(fallbackBuffer);
  }

  return null;
}

function normalizeCover(imageMedia) {
  if (imageMedia?.buffer?.length || imageMedia?.dataUri) {
    return {
      ...imageMedia,
      opacity: 1,
    };
  }

  return {
    enabled: false,
    placeholderText: "ALYA",
  };
}

function normalizeBackground(imageMedia) {
  if (imageMedia?.buffer?.length || imageMedia?.dataUri) {
    return {
      ...imageMedia,
      enabled: true,
      opacity: 0.18,
      blur: 8,
      overlayOpacity: 0.58,
    };
  }

  return {};
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

  const imageMedia = await resolveImageMedia(thumbnail);
  const cover = normalizeCover(imageMedia);
  const background = normalizeBackground(imageMedia);

  const card = createCard(cardId, {
    title: cleanTitle,
    subtitle: cleanAuthor,
    music: {
      title: cleanTitle,
      artist: cleanAuthor,
      subtitle: cleanAuthor,
      duration: cleanDuration,
      cover,
      thumbnail: cover,
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

  // Não força duração/canal. Só reaplica mídia porque alguns templates normalizam
  // cover/background durante createCard e podem perder campos de imagem.
  card.cover = {
    ...(card.cover || {}),
    ...cover,
  };

  card.background = {
    ...(card.background || {}),
    ...background,
  };

  const result = await renderCard(card);

  if (!result?.buffer?.length) {
    throw new Error("Não foi possível renderizar o card de música.");
  }

  return result.buffer;
}
