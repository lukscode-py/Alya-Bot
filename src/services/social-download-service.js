import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

import axios from "axios";
import youtubeDlPackage from "youtube-dl-exec";

import { TEMP_DIR } from "../config.js";
import { getRandomName } from "../utils/index.js";
import {
  createCookieRequiredError,
  getCookieHeader,
  getCookieRuntimeInfo,
  getYtDlpCookieOptions,
  isCookieBlockError,
  withCookieFallback,
} from "./cookie-service.js";

const SOCIAL_VIDEO_MAX_FILESIZE = "75M";
const SOCIAL_AUDIO_MAX_FILESIZE = "18M";
const SOCIAL_IMAGE_MAX_BYTES = 16 * 1024 * 1024;
const SOCIAL_VIDEO_MAX_BYTES = 75 * 1024 * 1024;

const DEFAULT_USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
  "(KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36";

const SUPPORTED_SOCIAL_HOSTS = {
  instagram: ["instagram.com"],
  tiktok: ["tiktok.com", "vm.tiktok.com", "vt.tiktok.com"],
  pinterest: ["pinterest.com", "pin.it"],
};

function ensureTempDir() {
  fs.mkdirSync(TEMP_DIR, { recursive: true });
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

function getCommonOptions(url, platform = getPlatformFromUrl(url), cookiesPath = "") {
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
    ...getYtDlpCookieOptions(platform, cookiesPath),
  };
}

async function downloadWithYtDlp(url, target, options = {}, cookiesPath = "") {
  const { platform: optionPlatform, ...ytDlpOptions } = options;
  const platform = optionPlatform || getPlatformFromUrl(url);

  await ytDlp(url, {
    ...getCommonOptions(url, platform, cookiesPath),
    ...ytDlpOptions,
    output: target.template,
  });

  return assertDownloaded(findDownloadedFile(target));
}

export async function downloadSocialVideo(url, platform = getPlatformFromUrl(url)) {
  const target = makeOutputTarget("mp4");

  return withCookieFallback(platform, ({ cookiesPath }) =>
    downloadWithYtDlp(
      url,
      target,
      {
        platform,
        format: "b[ext=mp4]/bv*+ba/b",
        mergeOutputFormat: "mp4",
        maxFilesize: SOCIAL_VIDEO_MAX_FILESIZE,
      },
      cookiesPath,
    ),
  );
}

export async function downloadSocialAudio(url, platform = getPlatformFromUrl(url)) {
  const target = makeOutputTarget("m4a");

  return withCookieFallback(platform, ({ cookiesPath }) =>
    downloadWithYtDlp(
      url,
      target,
      {
        platform,
        format: "ba[ext=m4a]/ba/b",
        extractAudio: true,
        audioFormat: "m4a",
        audioQuality: 5,
        maxFilesize: SOCIAL_AUDIO_MAX_FILESIZE,
      },
      cookiesPath,
    ),
  );
}

function normalizePinterestHtml(html) {
  return String(html || "")
    .replace(/\\u002F/g, "/")
    .replace(/\\u0026/g, "&")
    .replace(/\\\//g, "/")
    .replace(/&amp;/g, "&")
    .replace(/\\"/g, '"');
}

function buildAxiosHeaders(platform, cookiesPath = "") {
  const cookieHeader = cookiesPath ? getCookieHeader(platform, cookiesPath) : "";

  return {
    "user-agent": DEFAULT_USER_AGENT,
    referer: platform === "pinterest"
      ? "https://www.pinterest.com/"
      : undefined,
    accept:
      "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
    ...(cookieHeader ? { cookie: cookieHeader } : {}),
  };
}

async function fetchPinterestHtml(url, cookiesPath = "") {
  const response = await axios.get(url, {
    responseType: "text",
    timeout: 25000,
    maxRedirects: 8,
    validateStatus: (status) => status >= 200 && status < 400,
    headers: buildAxiosHeaders("pinterest", cookiesPath),
  });

  const html = normalizePinterestHtml(response.data);

  if (
    html.includes("Log in") &&
    html.includes("Pinterest") &&
    !html.includes("i.pinimg.com")
  ) {
    throw createCookieRequiredError("Pinterest pediu login para abrir esse pin.");
  }

  return html;
}

function uniqueItems(items) {
  return [...new Set(items.filter(Boolean))];
}

function scorePinterestImageUrl(url) {
  const value = String(url || "");
  let score = 0;

  if (value.includes("/originals/")) {
    score += 100000;
  }

  const sizeMatch = value.match(/\/(\d+)x\//);

  if (sizeMatch) {
    score += Number(sizeMatch[1]);
  }

  if (value.includes(".jpg") || value.includes(".jpeg")) {
    score += 30;
  }

  if (value.includes(".png")) {
    score += 20;
  }

  if (value.includes(".webp")) {
    score += 10;
  }

  return score;
}

function extractPinterestImageUrls(html) {
  const normalizedHtml = normalizePinterestHtml(html);
  const matches = normalizedHtml.match(
    /https?:\/\/i\.pinimg\.com\/[^"'<>\\\s]+?\.(?:jpg|jpeg|png|webp)(?:\?[^"'<>\\\s]*)?/gi,
  );

  return uniqueItems(matches || []).sort(
    (a, b) => scorePinterestImageUrl(b) - scorePinterestImageUrl(a),
  );
}

function extractPinterestVideoUrls(html) {
  const normalizedHtml = normalizePinterestHtml(html);
  const matches = normalizedHtml.match(
    /https?:\/\/v\.pinimg\.com\/[^"'<>\\\s]+?\.mp4(?:\?[^"'<>\\\s]*)?/gi,
  );

  return uniqueItems(matches || []);
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

function getExtensionFromUrl(url, fallback = "bin") {
  try {
    const extension = path
      .extname(new URL(url).pathname)
      .replace(".", "")
      .toLowerCase();

    return extension || fallback;
  } catch {
    return fallback;
  }
}

async function downloadBinaryFromUrl(
  url,
  { type, platform = "pinterest", cookiesPath = "", extension, maxBytes },
) {
  ensureTempDir();

  const response = await axios.get(url, {
    responseType: "arraybuffer",
    timeout: 30000,
    maxContentLength: maxBytes,
    headers: buildAxiosHeaders(platform, cookiesPath),
  });

  const buffer = Buffer.from(response.data);

  if (!buffer.length) {
    throw new Error(`O arquivo veio vazio (${type}).`);
  }

  const contentType = String(response.headers["content-type"] || "");
  const mimeExtension = getImageExtensionFromMime(contentType);
  const finalExtension = mimeExtension || extension || getExtensionFromUrl(url, "bin");
  const outputPath = path.join(TEMP_DIR, getRandomName(finalExtension));

  fs.writeFileSync(outputPath, buffer);

  return assertDownloaded(outputPath, `Não foi possível salvar o arquivo (${type}).`);
}

async function downloadPinterestImageOnce(url, cookiesPath = "") {
  const html = await fetchPinterestHtml(url, cookiesPath);
  const imageUrls = extractPinterestImageUrls(html);
  const imageUrl = imageUrls[0];

  if (!imageUrl) {
    throw createCookieRequiredError(
      "Não encontrei imagem pública nesse pin. Talvez o Pinterest esteja exigindo cookie.",
    );
  }

  return downloadBinaryFromUrl(imageUrl, {
    type: "image",
    platform: "pinterest",
    cookiesPath,
    extension: getExtensionFromUrl(imageUrl, "jpg"),
    maxBytes: SOCIAL_IMAGE_MAX_BYTES,
  });
}

async function downloadPinterestVideoByScrape(url, cookiesPath = "") {
  const html = await fetchPinterestHtml(url, cookiesPath);
  const videoUrls = extractPinterestVideoUrls(html);
  const videoUrl = videoUrls[0];

  if (!videoUrl) {
    throw new Error("Não encontrei vídeo direto nesse link do Pinterest.");
  }

  return downloadBinaryFromUrl(videoUrl, {
    type: "video",
    platform: "pinterest",
    cookiesPath,
    extension: "mp4",
    maxBytes: SOCIAL_VIDEO_MAX_BYTES,
  });
}

function isNoVideoFormatsError(error) {
  const message = String(error?.stderr || error?.message || error || "");

  return (
    message.includes("No video formats found") ||
    message.includes("Requested format is not available")
  );
}

async function downloadPinterestMediaOnce(url, cookiesPath = "") {
  try {
    const target = makeOutputTarget("mp4");
    const videoPath = await downloadWithYtDlp(
      url,
      target,
      {
        platform: "pinterest",
        format: "b[ext=mp4]/bv*+ba/b",
        mergeOutputFormat: "mp4",
        maxFilesize: SOCIAL_VIDEO_MAX_FILESIZE,
      },
      cookiesPath,
    );

    return {
      type: "video",
      path: videoPath,
    };
  } catch (error) {
    if (!isNoVideoFormatsError(error) && isCookieBlockError(error)) {
      throw error;
    }
  }

  try {
    const videoPath = await downloadPinterestVideoByScrape(url, cookiesPath);

    return {
      type: "video",
      path: videoPath,
    };
  } catch {
    const imagePath = await downloadPinterestImageOnce(url, cookiesPath);

    return {
      type: "image",
      path: imagePath,
    };
  }
}

export async function downloadPinterestImage(url) {
  return withCookieFallback(
    "pinterest",
    ({ cookiesPath }) => downloadPinterestImageOnce(url, cookiesPath),
    { retryOnAnyError: false },
  );
}

export async function downloadPinterestMedia(url) {
  return withCookieFallback(
    "pinterest",
    ({ cookiesPath }) => downloadPinterestMediaOnce(url, cookiesPath),
    { retryOnAnyError: false },
  );
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
  const cookieInfo = getCookieRuntimeInfo(platform);

  return {
    binary: resolveYtDlpBinary() || "youtube-dl-exec-default",
    cookiesDir: cookieInfo.cookiesDir,
    cookiesPath: cookieInfo.valid ? cookieInfo.path : "",
    cookies: cookieInfo.valid,
  };
}
