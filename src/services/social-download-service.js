import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

import axios from "axios";
import youtubeDlPackage from "youtube-dl-exec";

import { ROOT_DIR, TEMP_DIR } from "../config.js";
import { getRandomName } from "../utils/index.js";

const SOCIAL_VIDEO_MAX_FILESIZE = "75M";
const SOCIAL_AUDIO_MAX_FILESIZE = "18M";
const SOCIAL_IMAGE_MAX_BYTES = 16 * 1024 * 1024;
const COOKIES_DIR = path.join(ROOT_DIR, "cookies", "yt-dlp");

const DEFAULT_USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
  "(KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36";

const SUPPORTED_SOCIAL_HOSTS = {
  instagram: ["instagram.com"],
  tiktok: ["tiktok.com", "vm.tiktok.com", "vt.tiktok.com"],
  pinterest: ["pinterest.com", "pin.it"],
};

const IMAGE_EXTENSIONS = new Set(["jpg", "jpeg", "png", "webp"]);

function ensureDirectory(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

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

function resolveCookiePath(platform = "default") {
  ensureDirectory(COOKIES_DIR);

  const platformName = String(platform || "default").toLowerCase();
  const envName = `ALYA_${platformName.toUpperCase()}_COOKIES_PATH`;

  const candidates = [
    process.env[envName]?.trim(),
    process.env.ALYA_YTDLP_COOKIES_PATH?.trim(),
    process.env.ALYA_YT_COOKIES_PATH?.trim(),
    path.join(COOKIES_DIR, `${platformName}.txt`),
    path.join(COOKIES_DIR, "default.txt"),
  ].filter(Boolean);

  return candidates.find((candidate) => fs.existsSync(candidate)) || "";
}

function getCookiesOptions(platform) {
  const cookiesPath = resolveCookiePath(platform);

  return cookiesPath ? { cookies: cookiesPath } : {};
}

function parseUrl(input) {
  try {
    return new URL(String(input || "").trim());
  } catch {
    return null;
  }
}

function isHostAllowed(hostname, allowedHosts) {
  const cleanHostname = String(hostname || "").toLowerCase();

  return allowedHosts.some(
    (allowedHost) =>
      cleanHostname === allowedHost || cleanHostname.endsWith(`.${allowedHost}`),
  );
}

export function isInstagramUrl(input) {
  const url = parseUrl(input);

  return Boolean(
    url && isHostAllowed(url.hostname, SUPPORTED_SOCIAL_HOSTS.instagram),
  );
}

export function isTikTokUrl(input) {
  const url = parseUrl(input);

  return Boolean(url && isHostAllowed(url.hostname, SUPPORTED_SOCIAL_HOSTS.tiktok));
}

export function isPinterestUrl(input) {
  const url = parseUrl(input);

  return Boolean(
    url && isHostAllowed(url.hostname, SUPPORTED_SOCIAL_HOSTS.pinterest),
  );
}

function getPlatformFromUrl(input) {
  if (isInstagramUrl(input)) {
    return "instagram";
  }

  if (isTikTokUrl(input)) {
    return "tiktok";
  }

  if (isPinterestUrl(input)) {
    return "pinterest";
  }

  return "default";
}

function getReferer(input) {
  if (isInstagramUrl(input)) {
    return "https://www.instagram.com/";
  }

  if (isTikTokUrl(input)) {
    return "https://www.tiktok.com/";
  }

  if (isPinterestUrl(input)) {
    return "https://www.pinterest.com/";
  }

  const url = parseUrl(input);

  return url ? `${url.protocol}//${url.hostname}/` : undefined;
}

function makeOutputTarget(preferredExtension) {
  ensureDirectory(TEMP_DIR);

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

function assertDownloaded(
  filePath,
  message = "O download local não gerou um arquivo válido.",
) {
  const stats = fs.existsSync(filePath) ? fs.statSync(filePath) : null;

  if (!stats?.size) {
    throw new Error(message);
  }

  return filePath;
}

function getCommonOptions(url, platform = getPlatformFromUrl(url)) {
  return {
    noPlaylist: true,
    noWarnings: true,
    noCheckCertificates: true,
    socketTimeout: 25,
    retries: 2,
    fragmentRetries: 2,
    concurrentFragments: 1,
    forceOverwrites: true,
    userAgent: DEFAULT_USER_AGENT,
    referer: getReferer(url),
    ...getCookiesOptions(platform),
  };
}

async function downloadWithYtDlp(url, target, options = {}) {
  const { platform: optionPlatform, ...ytDlpOptions } = options;
  const platform = optionPlatform || getPlatformFromUrl(url);

  await ytDlp(url, {
    ...getCommonOptions(url, platform),
    ...ytDlpOptions,
    output: target.template,
  });

  return assertDownloaded(findDownloadedFile(target));
}

export async function downloadSocialVideo(url, platform = getPlatformFromUrl(url)) {
  const target = makeOutputTarget("mp4");

  return downloadWithYtDlp(url, target, {
    platform,
    format: "b[ext=mp4]/bv*+ba/b",
    mergeOutputFormat: "mp4",
    maxFilesize: SOCIAL_VIDEO_MAX_FILESIZE,
  });
}

export async function downloadSocialAudio(url, platform = getPlatformFromUrl(url)) {
  const target = makeOutputTarget("m4a");

  return downloadWithYtDlp(url, target, {
    platform,
    format: "ba[ext=m4a]/ba/b",
    extractAudio: true,
    audioFormat: "m4a",
    audioQuality: 5,
    maxFilesize: SOCIAL_AUDIO_MAX_FILESIZE,
  });
}

async function extractMediaInfo(url, platform = getPlatformFromUrl(url)) {
  return ytDlp(url, {
    ...getCommonOptions(url, platform),
    dumpSingleJson: true,
  });
}

function getImageExtensionFromMime(mimeType) {
  const cleanMime = String(mimeType || "").split(";")[0].trim().toLowerCase();

  if (cleanMime === "image/png") {
    return "png";
  }

  if (cleanMime === "image/webp") {
    return "webp";
  }

  if (cleanMime === "image/jpeg" || cleanMime === "image/jpg") {
    return "jpg";
  }

  return "";
}

function getImageExtensionFromUrl(url) {
  try {
    const extension = path
      .extname(new URL(url).pathname)
      .replace(".", "")
      .toLowerCase();

    return IMAGE_EXTENSIONS.has(extension) ? extension : "";
  } catch {
    return "";
  }
}

function normalizeImageCandidate(candidate) {
  if (!candidate?.url) {
    return null;
  }

  const extension = String(candidate.ext || "").toLowerCase();
  const width = Number(candidate.width || 0);
  const height = Number(candidate.height || 0);

  return {
    url: candidate.url,
    ext: IMAGE_EXTENSIONS.has(extension)
      ? extension
      : getImageExtensionFromUrl(candidate.url),
    score: width * height,
  };
}

function pickPinterestImageUrl(info) {
  const candidates = [];

  for (const format of info?.formats || []) {
    const candidate = normalizeImageCandidate(format);

    if (candidate?.url) {
      candidates.push(candidate);
    }
  }

  for (const thumbnail of info?.thumbnails || []) {
    const candidate = normalizeImageCandidate(thumbnail);

    if (candidate?.url) {
      candidates.push(candidate);
    }
  }

  const directCandidates = [
    normalizeImageCandidate({
      url: info?.url,
      ext: info?.ext,
      width: info?.width,
      height: info?.height,
    }),
    normalizeImageCandidate({
      url: info?.thumbnail,
      width: info?.thumbnail_width,
      height: info?.thumbnail_height,
    }),
  ].filter(Boolean);

  candidates.push(...directCandidates);
  candidates.sort((a, b) => b.score - a.score);

  const selected = candidates.find((candidate) => candidate.url);

  if (!selected?.url) {
    throw new Error("Não encontrei uma imagem válida nesse link do Pinterest.");
  }

  return selected.url;
}

async function downloadImageFromUrl(imageUrl) {
  ensureDirectory(TEMP_DIR);

  const response = await axios.get(imageUrl, {
    responseType: "arraybuffer",
    timeout: 25000,
    maxContentLength: SOCIAL_IMAGE_MAX_BYTES,
    headers: {
      "user-agent": DEFAULT_USER_AGENT,
      referer: "https://www.pinterest.com/",
    },
  });

  const buffer = Buffer.from(response.data);

  if (!buffer.length) {
    throw new Error("A imagem do Pinterest veio vazia.");
  }

  const mimeExtension = getImageExtensionFromMime(response.headers["content-type"]);
  const urlExtension = getImageExtensionFromUrl(imageUrl);
  const extension = mimeExtension || urlExtension || "jpg";
  const outputPath = path.join(TEMP_DIR, getRandomName(extension));

  fs.writeFileSync(outputPath, buffer);

  return assertDownloaded(
    outputPath,
    "Não foi possível salvar a imagem do Pinterest.",
  );
}

export async function downloadPinterestImage(url) {
  const info = await extractMediaInfo(url, "pinterest");
  const imageUrl = pickPinterestImageUrl(info);

  return downloadImageFromUrl(imageUrl);
}

export function cleanupSocialTempFile(filePath) {
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

export function getSocialDownloadRuntimeInfo(platform = "default") {
  const cookiesPath = resolveCookiePath(platform);

  return {
    binary: resolveYtDlpBinary() || "youtube-dl-exec-default",
    cookiesDir: COOKIES_DIR,
    cookiesPath,
    cookies: Boolean(cookiesPath),
  };
}
