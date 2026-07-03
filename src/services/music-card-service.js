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
  const { data, headers, status } = await axios.get(imageUrl, {
    responseType: "arraybuffer",
    timeout: 12000,
    validateStatus: (code) => code >= 200 && code < 300,
    headers: {
      "user-agent": IMAGE_USER_AGENT,
      referer: "https://www.youtube.com/",
      accept: "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
    },
  });

  if (status < 200 || status >= 300) {
    return null;
  }

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
      // Tenta a próxima thumb.
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
      // Tenta o próximo fallback.
    }
  }

  return null;
}

async function resolveImageBuffer(thumbnail) {
  const thumbnailBuffer = await fetchThumbnailBuffer(thumbnail);

  if (thumbnailBuffer?.buffer?.length) {
    return thumbnailBuffer;
  }

  const fallbackBuffer = readFallbackImageBuffer();

  if (fallbackBuffer?.buffer?.length) {
    return fallbackBuffer;
  }

  return null;
}

async function normalizeCover(thumbnail) {
  const image = await resolveImageBuffer(thumbnail);

  if (image?.buffer?.length) {
    return {
      enabled: true,
      ...image,
    };
  }

  return {
    enabled: false,
    placeholderText: "ALYA",
  };
}

async function normalizeBackground(thumbnail) {
  const image = await resolveImageBuffer(thumbnail);

  if (image?.buffer?.length) {
    return {
      ...image,
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
      thumbnail: cover,
      cover,
      image: cover,
      artwork: cover,
    },
    cover,
    image: cover,
    thumbnail: cover,
    artwork: cover,
    albumArt: cover,
    background,
    images: {
      cover,
      thumbnail: cover,
      artwork: cover,
      background,
    },
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
