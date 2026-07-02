import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

import youtubeDlPackage from "youtube-dl-exec";
import youtubeSearchApi from "youtube-search-api";

import { TEMP_DIR } from "../config.js";
import { getRandomName } from "../utils/index.js";
import {
  getCookieRuntimeInfo,
  getYtDlpCookieOptions,
  withCookieFallback,
} from "./cookie-service.js";

const YOUTUBE_AUDIO_MAX_FILESIZE = "20M";
const YOUTUBE_VIDEO_MAX_FILESIZE = "120M";

const YOUTUBE_USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
  "(KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36";

function resolveYtDlpBinary() {
  const customBinary = process.env.ALYA_YT_DLP_PATH?.trim();

  if (customBinary) {
    return customBinary;
  }

  try {
    return execFileSync("which", ["yt-dlp"], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();
  } catch {
    return "";
  }
}

function resolveYtDlp() {
  const binary = resolveYtDlpBinary();

  return binary ? youtubeDlPackage.create(binary) : youtubeDlPackage;
}

const ytDlp = resolveYtDlp();

function ensureTempDir() {
  fs.mkdirSync(TEMP_DIR, { recursive: true });
}

function isYoutubeUrl(input) {
  try {
    const url = new URL(String(input || "").trim());
    const host = url.hostname.toLowerCase();

    return (
      host === "youtube.com" ||
      host.endsWith(".youtube.com") ||
      host === "youtu.be" ||
      host.endsWith(".youtu.be")
    );
  } catch {
    return false;
  }
}

function makeOutputTarget(preferredExtension) {
  ensureTempDir();

  const baseName = getRandomName();
  const template = path.join(TEMP_DIR, `${baseName}.%(ext)s`);
  const preferredPath = path.join(TEMP_DIR, `${baseName}.${preferredExtension}`);

  return {
    baseName,
    template,
    preferredPath,
  };
}

function findDownloadedFile(target) {
  if (fs.existsSync(target.preferredPath)) {
    return target.preferredPath;
  }

  const prefix = `${target.baseName}.`;
  const fileNames = fs.existsSync(TEMP_DIR) ? fs.readdirSync(TEMP_DIR) : [];

  for (const fileName of fileNames) {
    if (!fileName.startsWith(prefix)) {
      continue;
    }

    const filePath = path.join(TEMP_DIR, fileName);
    const stats = fs.existsSync(filePath) ? fs.statSync(filePath) : null;

    if (stats?.size > 0) {
      return filePath;
    }
  }

  return "";
}

function assertDownloaded(filePath) {
  const stats = fs.existsSync(filePath) ? fs.statSync(filePath) : null;

  if (!stats?.size) {
    throw new Error("O download local do YouTube não gerou um arquivo válido.");
  }

  return filePath;
}

function getCommonYtDlpOptions(cookiesPath = "") {
  return {
    noPlaylist: true,
    noWarnings: true,
    noCheckCertificates: true,
    socketTimeout: 25,
    retries: 2,
    fragmentRetries: 2,
    concurrentFragments: 1,
    forceOverwrites: true,
    userAgent: YOUTUBE_USER_AGENT,
    ...getYtDlpCookieOptions("youtube", cookiesPath),
  };
}

async function runYtDlp(url, target, options = {}) {
  return withCookieFallback("youtube", async ({ cookiesPath }) => {
    await ytDlp(url, {
      ...getCommonYtDlpOptions(cookiesPath),
      ...options,
      output: target.template,
    });

    return assertDownloaded(findDownloadedFile(target));
  });
}

async function getYoutubeInfoByUrl(url) {
  return withCookieFallback("youtube", async ({ cookiesPath }) => {
    const info = await ytDlp(url, {
      ...getCommonYtDlpOptions(cookiesPath),
      dumpSingleJson: true,
      skipDownload: true,
    });

    return normalizeVideoInfo(info, url);
  });
}

function normalizeDuration(seconds) {
  const value = Number(seconds || 0);

  if (!value) {
    return "Desconhecida";
  }

  const minutes = Math.floor(value / 60);
  const remainingSeconds = String(value % 60).padStart(2, "0");

  return `${minutes}:${remainingSeconds}`;
}

function normalizeVideoInfo(item, fallbackUrl = "") {
  const id = item?.id || item?.videoId || "";
  const url = item?.url || item?.webpage_url || fallbackUrl || (id ? `https://youtu.be/${id}` : "");

  return {
    id,
    url,
    title: item?.title || "Sem título",
    author:
      item?.channel ||
      item?.channel_name ||
      item?.uploader ||
      item?.author ||
      "Desconhecido",
    duration: item?.duration_simple_text || normalizeDuration(item?.duration),
    thumbnail:
      item?.thumbnail ||
      item?.thumbnails?.at?.(-1)?.url ||
      (id ? `https://i.ytimg.com/vi/${id}/hqdefault.jpg` : ""),
  };
}

async function searchYoutubeVideos(query, limit = 5) {
  const result = await youtubeSearchApi.GetListByKeyword(query, false, limit, [
    { type: "video" },
  ]);

  const items = Array.isArray(result?.items) ? result.items : [];

  return items
    .filter((item) => item?.id || item?.videoId)
    .map((item) => normalizeVideoInfo(item));
}

export async function searchYoutube(input) {
  const query = String(input || "").trim();

  if (!query) {
    throw new Error("Informe um termo ou link do YouTube.");
  }

  if (isYoutubeUrl(query)) {
    return getYoutubeInfoByUrl(query);
  }

  const videos = await searchYoutubeVideos(query, 5);
  const video = videos[0];

  if (!video) {
    throw new Error("Nenhum vídeo encontrado no YouTube.");
  }

  return video;
}

export const searchYoutubeVideo = searchYoutube;
export const findYoutubeVideo = searchYoutube;
export const getYoutubeVideo = searchYoutube;

export async function downloadYoutubeAudio(url) {
  const target = makeOutputTarget("m4a");

  return runYtDlp(url, target, {
    format: "ba[ext=m4a]/ba/bestaudio/best",
    maxFilesize: YOUTUBE_AUDIO_MAX_FILESIZE,
  });
}

export async function downloadYoutubeVideo(url) {
  const target = makeOutputTarget("mp4");

  return runYtDlp(url, target, {
    format:
      "bv*[height<=720][ext=mp4]+ba[ext=m4a]/b[height<=720][ext=mp4]/b[ext=mp4]/b",
    mergeOutputFormat: "mp4",
    maxFilesize: YOUTUBE_VIDEO_MAX_FILESIZE,
  });
}

export function cleanupYoutubeTempFile(filePath) {
  if (!filePath) {
    return;
  }

  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  } catch {
    // Ignora falha ao limpar temporário.
  }
}

export function getYoutubeRuntimeInfo() {
  const cookieInfo = getCookieRuntimeInfo("youtube");

  return {
    binary: resolveYtDlpBinary() || "youtube-dl-exec-default",
    cookies: cookieInfo.valid,
    cookiesPath: cookieInfo.valid ? cookieInfo.path : "",
    cookiesDir: cookieInfo.cookiesDir,
  };
}

export function buildAlyaPlayAudioMessage(video) {
  const title = video?.title || "Desconhecido";
  const author = video?.author || "Desconhecido";
  const duration = video?.duration || "Desconhecida";
  const url = video?.url || "";

  return `꒰ 🎧 𝐀𝐋𝐘𝐀 𝐏𝐋𝐀𝐘 🎧 ꒱
𝙼úsica encontrada com sucesso 𖹭

╎✦ۣۜۜ͜͡🤍 𝗧ítulo:
╎${title}

╎❀ۣۜۜ͜͡🤍 𝗖anal:
╎${author}

╎ꕥۣۜۜ͜͡🤍 𝗗uração:
╎${duration}

╎⚘ۣۜۜ͜͡🤍 𝗙ormato:
╎M4A / Áudio

╎✧ۣۜۜ͜͡🤍 𝗟ink:
╎${url}

╎✦ۣۜۜ͜͡🤍 𝗦tatus:
╎Baixando sua música...

╎❃ۣۜۜ͜͡🤍 Aguarde um instante,
╎já estou preparando pra você 𖹭

꒰ ⚡ 𝐀𝐋𝐘𝐀 𝐁𝐎𝐓 ⚡ ꒱`;
}

export async function resolveYoutubeInput(input) {
  return searchYoutube(input);
}

export function buildAlyaPlayVideoMessage(video) {
  const title = video?.title || "Desconhecido";
  const author = video?.author || "Desconhecido";
  const duration = video?.duration || "Desconhecida";
  const url = video?.url || "";

  return `꒰ 🎬 𝐀𝐋𝐘𝐀 𝐏𝐋𝐀𝐘 🎬 ꒱
𝚅ídeo encontrado com sucesso 𖹭

╎✦ۣۜۜ͜͡🤍 𝗧ítulo:
╎${title}

╎❀ۣۜۜ͜͡🤍 𝗖anal:
╎${author}

╎ꕥۣۜۜ͜͡🤍 𝗗uração:
╎${duration}

╎⚘ۣۜۜ͜͡🤍 𝗙ormato:
╎MP4 / Vídeo

╎✧ۣۜۜ͜͡🤍 𝗟ink:
╎${url}

╎✦ۣۜۜ͜͡🤍 𝗦tatus:
╎Baixando seu vídeo...

╎❃ۣۜۜ͜͡🤍 Aguarde um instante,
╎já estou preparando pra você 𖹭

꒰ ⚡ 𝐀𝐋𝐘𝐀 𝐁𝐎𝐓 ⚡ ꒱`;
}
