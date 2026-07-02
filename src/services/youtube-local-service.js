import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

import youtubeSearch from "youtube-search-api";
import youtubeDlPackage from "youtube-dl-exec";

import { TEMP_DIR } from "../config.js";
import { getRandomName } from "../utils/index.js";

const YOUTUBE_HOST_PATTERN =
  /^(https?:\/\/)?(www\.|m\.|music\.)?(youtube\.com|youtu\.be)\//i;

const MAX_SEARCH_LENGTH = 120;
const DEFAULT_SEARCH_LIMIT = 5;
const YOUTUBE_AUDIO_MAX_FILESIZE = "16M";
const YOUTUBE_VIDEO_MAX_FILESIZE = "55M";

function resolveYoutubeDl() {
  const customBinary = process.env.ALYA_YT_DLP_PATH?.trim();

  if (customBinary) {
    return youtubeDlPackage.create(customBinary);
  }

  try {
    const systemBinary = execFileSync("which", ["yt-dlp"], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();

    if (systemBinary) {
      return youtubeDlPackage.create(systemBinary);
    }
  } catch {
    // Usa o binário padrão do youtube-dl-exec quando não houver yt-dlp no PATH.
  }

  return youtubeDlPackage;
}

const youtubeDl = resolveYoutubeDl();

function getYoutubeDlBinaryHint() {
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
    return "youtube-dl-exec-default";
  }
}

export function isYoutubeUrl(input) {
  return YOUTUBE_HOST_PATTERN.test(String(input || "").trim());
}

function normalizeText(input) {
  return String(input || "").trim().replace(/\s+/g, " ");
}

function normalizeDuration(seconds) {
  const totalSeconds = Number(seconds || 0);

  if (!Number.isFinite(totalSeconds) || totalSeconds <= 0) {
    return "Desconhecida";
  }

  const minutes = Math.floor(totalSeconds / 60);
  const rest = Math.floor(totalSeconds % 60);

  return `${minutes}:${String(rest).padStart(2, "0")}`;
}

function normalizeSearchDuration(length) {
  if (!length) {
    return "Desconhecida";
  }

  if (typeof length === "string") {
    return length;
  }

  if (typeof length.simpleText === "string") {
    return length.simpleText;
  }

  return "Desconhecida";
}

function normalizeViews(views) {
  if (!views) {
    return "Desconhecidas";
  }

  if (typeof views === "string") {
    return views;
  }

  if (typeof views.simpleText === "string") {
    return views.simpleText;
  }

  return "Desconhecidas";
}

function extractVideoId(item) {
  if (!item) {
    return "";
  }

  if (typeof item.id === "string") {
    return item.id;
  }

  if (typeof item.videoId === "string") {
    return item.videoId;
  }

  if (typeof item.id?.videoId === "string") {
    return item.id.videoId;
  }

  return "";
}

function normalizeSearchItem(item) {
  const id = extractVideoId(item);
  const url = item?.url || (id ? `https://www.youtube.com/watch?v=${id}` : "");

  if (!url) {
    return null;
  }

  return {
    id,
    url,
    title: item?.title || "Sem título",
    author:
      item?.channelTitle ||
      item?.channel?.name ||
      item?.channel?.title ||
      item?.author ||
      "Canal desconhecido",
    duration: normalizeSearchDuration(item?.length || item?.duration),
    views: normalizeViews(item?.viewCount || item?.views),
    thumbnail:
      item?.thumbnail?.thumbnails?.at?.(-1)?.url ||
      item?.thumbnail?.url ||
      item?.thumbnail ||
      "",
    publishedAt:
      item?.publishedTime ||
      item?.published_at ||
      item?.publishedAt ||
      "Desconhecido",
  };
}

export async function searchYoutube(query, limit = DEFAULT_SEARCH_LIMIT) {
  const cleanQuery = normalizeText(query);

  if (!cleanQuery) {
    throw new Error("Você precisa informar um termo ou link do YouTube!");
  }

  if (cleanQuery.length > MAX_SEARCH_LENGTH && !isYoutubeUrl(cleanQuery)) {
    throw new Error(
      `A pesquisa deve ter no máximo ${MAX_SEARCH_LENGTH} caracteres.`,
    );
  }

  if (isYoutubeUrl(cleanQuery)) {
    const info = await getYoutubeInfo(cleanQuery);
    return [info];
  }

  const result = await youtubeSearch.GetListByKeyword(
    cleanQuery,
    false,
    limit,
    [{ type: "video" }],
  );

  const items = Array.isArray(result?.items) ? result.items : [];

  return items
    .filter((item) => item?.type === "video" || extractVideoId(item))
    .map(normalizeSearchItem)
    .filter(Boolean)
    .slice(0, limit);
}

export async function resolveYoutubeInput(input) {
  const cleanInput = normalizeText(input);

  if (!cleanInput) {
    throw new Error("Você precisa informar um termo ou link do YouTube!");
  }

  if (isYoutubeUrl(cleanInput)) {
    return getYoutubeInfo(cleanInput);
  }

  const [firstResult] = await searchYoutube(cleanInput, 1);

  if (!firstResult) {
    throw new Error("Nenhum resultado encontrado no YouTube.");
  }

  return getYoutubeInfo(firstResult.url, firstResult);
}

export async function getYoutubeInfo(url, fallback = {}) {
  const info = await youtubeDl(url, {
    dumpSingleJson: true,
    noPlaylist: true,
    noWarnings: true,
    noCheckCertificates: true,
    preferFreeFormats: false,
    socketTimeout: 12,
    retries: 1,
  });

  return {
    id: info?.id || fallback.id || "",
    url:
      info?.webpage_url ||
      info?.original_url ||
      fallback.url ||
      url,
    title: info?.title || fallback.title || "Sem título",
    author:
      info?.uploader ||
      info?.channel ||
      info?.creator ||
      fallback.author ||
      "Canal desconhecido",
    duration: normalizeDuration(info?.duration) || fallback.duration,
    durationSeconds: Number(info?.duration || 0),
    thumbnail:
      info?.thumbnail ||
      info?.thumbnails?.at?.(-1)?.url ||
      fallback.thumbnail ||
      "",
    views: info?.view_count || fallback.views || "Desconhecidas",
    publishedAt:
      info?.upload_date ||
      info?.release_date ||
      fallback.publishedAt ||
      "Desconhecido",
  };
}

function makeOutputPath(extension) {
  fs.mkdirSync(TEMP_DIR, { recursive: true });
  return path.join(TEMP_DIR, getRandomName(extension));
}

function makeYoutubeOutputTarget(preferredExtension) {
  fs.mkdirSync(TEMP_DIR, { recursive: true });

  const baseName = getRandomName();
  const template = path.join(TEMP_DIR, `${baseName}.%(ext)s`);
  const preferredPath = path.join(TEMP_DIR, `${baseName}.${preferredExtension}`);

  return {
    baseName,
    template,
    preferredPath,
  };
}

function findDownloadedYoutubeFile(target) {
  if (fs.existsSync(target.preferredPath)) {
    return target.preferredPath;
  }

  const fileNames = fs.existsSync(TEMP_DIR) ? fs.readdirSync(TEMP_DIR) : [];
  const prefix = `${target.baseName}.`;

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

  return target.preferredPath;
}

function assertDownloaded(filePath) {
  const stats = fs.existsSync(filePath) ? fs.statSync(filePath) : null;

  if (!stats || stats.size <= 0) {
    throw new Error("Não foi possível baixar o arquivo do YouTube.");
  }

  return filePath;
}

export async function downloadYoutubeAudio(url) {
  const target = makeYoutubeOutputTarget("m4a");

  await youtubeDl(url, {
    output: target.template,
    format: "ba[ext=m4a]/ba",
    noPlaylist: true,
    maxFilesize: YOUTUBE_AUDIO_MAX_FILESIZE,
    forceOverwrites: true,
  });

  return assertDownloaded(findDownloadedYoutubeFile(target));
}

export function getYoutubeRuntimeInfo() {
  return {
    binary: getYoutubeDlBinaryHint(),
    cookies: Boolean(process.env.ALYA_YT_COOKIES_PATH?.trim()),
  };
}

export async function downloadYoutubeVideo(url) {
  const outputPath = makeOutputPath("mp4");

  await youtubeDl(url, {
    output: outputPath,
    format:
      "best[ext=mp4][height<=480]/bestvideo[ext=mp4][height<=480]+bestaudio[ext=m4a]/best[height<=480]/best",
    mergeOutputFormat: "mp4",
    noPlaylist: true,
    noWarnings: true,
    noCheckCertificates: true,
    maxFilesize: YOUTUBE_VIDEO_MAX_FILESIZE,
    socketTimeout: 12,
    retries: 1,
    concurrentFragments: 1,
    forceOverwrites: true,
  });

  return assertDownloaded(outputPath);
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
    // Ignora falha de limpeza para não quebrar o fluxo de envio.
  }
}

export function buildAlyaPlayAudioMessage({ title, author, duration, url }) {
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

export function buildAlyaPlayVideoMessage({ title, author, duration, url }) {
  return `꒰ 🎬 𝐀𝐋𝐘𝐀 𝐏𝐋𝐀𝐘 🎬 ꒱
Vídeo encontrado com sucesso 𖹭

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
