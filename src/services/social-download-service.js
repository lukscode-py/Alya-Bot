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
  facebook: ["facebook.com", "fb.watch", "fb.com"],
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

export function isFacebookUrl(input) {
  const url = parseUrl(input);

  return Boolean(
    url && isHostAllowed(url.hostname, SUPPORTED_SOCIAL_HOSTS.facebook),
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

  if (isFacebookUrl(input)) {
    return "facebook";
  }

  return "default";
}

function getReferer(platform) {
  if (platform === "instagram") {
    return "https://www.instagram.com/";
  }

  if (platform === "tiktok") {
    return "https://www.tiktok.com/";
  }

  if (platform === "pinterest") {
    return "https://www.pinterest.com/";
  }

  if (platform === "facebook") {
    return "https://www.facebook.com/";
  }

  return undefined;
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
    referer: getReferer(platform),
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

function normalizeHtml(html) {
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
    referer: getReferer(platform),
    accept:
      "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
    ...(cookieHeader ? { cookie: cookieHeader } : {}),
  };
}

async function fetchSocialHtml(url, platform, cookiesPath = "") {
  const response = await axios.get(url, {
    responseType: "text",
    timeout: 25000,
    maxRedirects: 8,
    validateStatus: (status) => status >= 200 && status < 400,
    headers: buildAxiosHeaders(platform, cookiesPath),
  });

  const html = normalizeHtml(response.data);

  if (isLoginWallHtml(html, platform)) {
    throw createCookieRequiredError(`${platform} pediu login para abrir essa mídia.`);
  }

  return html;
}

function isLoginWallHtml(html, platform) {
  const text = String(html || "").toLowerCase();

  if (platform === "facebook") {
    return (
      text.includes("login") &&
      text.includes("facebook") &&
      !text.includes("fbcdn.net")
    );
  }

  if (platform === "instagram") {
    return (
      text.includes("login") &&
      text.includes("instagram") &&
      !text.includes("cdninstagram.com")
    );
  }

  if (platform === "pinterest") {
    return (
      text.includes("log in") &&
      text.includes("pinterest") &&
      !text.includes("i.pinimg.com")
    );
  }

  return false;
}

function uniqueItems(items) {
  return [...new Set(items.filter(Boolean))];
}

function decodeHtmlUrl(url) {
  return String(url || "")
    .replace(/&amp;/g, "&")
    .replace(/\\u0026/g, "&")
    .replace(/\\u002F/g, "/")
    .replace(/\\\//g, "/")
    .replace(/\\"/g, '"');
}

function extractMetaUrls(html, kinds) {
  const results = [];
  const normalized = normalizeHtml(html);

  for (const kind of kinds) {
    const propertyFirst = new RegExp(
      `<meta[^>]+(?:property|name)=["']${kind}["'][^>]+content=["']([^"']+)["'][^>]*>`,
      "gi",
    );
    const contentFirst = new RegExp(
      `<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["']${kind}["'][^>]*>`,
      "gi",
    );

    for (const match of normalized.matchAll(propertyFirst)) {
      results.push(decodeHtmlUrl(match[1]));
    }

    for (const match of normalized.matchAll(contentFirst)) {
      results.push(decodeHtmlUrl(match[1]));
    }
  }

  return uniqueItems(results);
}

function scoreImageUrl(url) {
  const value = String(url || "");
  let score = 0;

  if (value.includes("/originals/")) {
    score += 100000;
  }

  const sizeMatch = value.match(/\/(\d+)x\//);

  if (sizeMatch) {
    score += Number(sizeMatch[1]);
  }

  if (value.includes("scontent")) {
    score += 500;
  }

  if (value.includes("cdninstagram")) {
    score += 500;
  }

  if (value.includes("pinimg")) {
    score += 500;
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

function extractImageUrls(html) {
  const normalizedHtml = normalizeHtml(html);
  const metaImages = extractMetaUrls(normalizedHtml, [
    "og:image",
    "og:image:secure_url",
    "twitter:image",
  ]);

  const directImages =
    normalizedHtml.match(
      /https?:\/\/[^"'<>\\\s]+?\.(?:jpg|jpeg|png|webp)(?:\?[^"'<>\\\s]*)?/gi,
    ) || [];

  return uniqueItems([...metaImages, ...directImages].map(decodeHtmlUrl)).sort(
    (a, b) => scoreImageUrl(b) - scoreImageUrl(a),
  );
}

function extractVideoUrls(html) {
  const normalizedHtml = normalizeHtml(html);
  const metaVideos = extractMetaUrls(normalizedHtml, [
    "og:video",
    "og:video:url",
    "og:video:secure_url",
    "twitter:player:stream",
  ]);

  const directVideos =
    normalizedHtml.match(
      /https?:\/\/[^"'<>\\\s]+?\.mp4(?:\?[^"'<>\\\s]*)?/gi,
    ) || [];

  return uniqueItems([...metaVideos, ...directVideos].map(decodeHtmlUrl));
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

function getExtensionFromMime(mimeType) {
  const cleanMime = String(mimeType || "").split(";")[0].trim().toLowerCase();

  if (cleanMime.startsWith("video/")) {
    return "mp4";
  }

  return getImageExtensionFromMime(cleanMime);
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
  { type, platform, cookiesPath = "", extension, maxBytes },
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
  const mimeExtension = getExtensionFromMime(contentType);
  const finalExtension = mimeExtension || extension || getExtensionFromUrl(url, "bin");
  const outputPath = path.join(TEMP_DIR, getRandomName(finalExtension));

  fs.writeFileSync(outputPath, buffer);

  return assertDownloaded(outputPath, `Não foi possível salvar o arquivo (${type}).`);
}

function isNoVideoFormatsError(error) {
  const message = String(error?.stderr || error?.message || error || "");

  return (
    message.includes("No video formats found") ||
    message.includes("Requested format is not available") ||
    message.includes("Unsupported URL")
  );
}

async function downloadScrapedVideo(url, platform, cookiesPath = "") {
  const html = await fetchSocialHtml(url, platform, cookiesPath);
  const videoUrls = extractVideoUrls(html);
  const videoUrl = videoUrls[0];

  if (!videoUrl) {
    throw new Error("Não encontrei vídeo direto nessa página.");
  }

  return downloadBinaryFromUrl(videoUrl, {
    type: "video",
    platform,
    cookiesPath,
    extension: "mp4",
    maxBytes: SOCIAL_VIDEO_MAX_BYTES,
  });
}

async function downloadScrapedImage(url, platform, cookiesPath = "") {
  const html = await fetchSocialHtml(url, platform, cookiesPath);
  const imageUrls = extractImageUrls(html);
  const imageUrl = imageUrls[0];

  if (!imageUrl) {
    throw createCookieRequiredError(
      "Não encontrei imagem pública nessa página. Talvez o site esteja exigindo cookie.",
    );
  }

  return downloadBinaryFromUrl(imageUrl, {
    type: "image",
    platform,
    cookiesPath,
    extension: getExtensionFromUrl(imageUrl, "jpg"),
    maxBytes: SOCIAL_IMAGE_MAX_BYTES,
  });
}

async function downloadSocialMediaOnce(url, platform, cookiesPath = "") {
  let videoError = null;

  try {
    const target = makeOutputTarget("mp4");
    const videoPath = await downloadWithYtDlp(
      url,
      target,
      {
        platform,
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
    videoError = error;

    if (!isNoVideoFormatsError(error) && isCookieBlockError(error)) {
      throw error;
    }
  }

  try {
    const videoPath = await downloadScrapedVideo(url, platform, cookiesPath);

    return {
      type: "video",
      path: videoPath,
    };
  } catch (scrapeVideoError) {
    if (isCookieBlockError(scrapeVideoError)) {
      throw scrapeVideoError;
    }
  }

  try {
    const imagePath = await downloadScrapedImage(url, platform, cookiesPath);

    return {
      type: "image",
      path: imagePath,
    };
  } catch (imageError) {
    if (isCookieBlockError(imageError)) {
      throw imageError;
    }

    throw videoError || imageError;
  }
}

export async function downloadSocialMedia(url, platform = getPlatformFromUrl(url)) {
  return withCookieFallback(
    platform,
    ({ cookiesPath }) => downloadSocialMediaOnce(url, platform, cookiesPath),
    { retryOnAnyError: false },
  );
}

export async function downloadPinterestImage(url) {
  return withCookieFallback(
    "pinterest",
    ({ cookiesPath }) => downloadScrapedImage(url, "pinterest", cookiesPath),
    { retryOnAnyError: false },
  );
}

export async function downloadPinterestMedia(url) {
  return downloadSocialMedia(url, "pinterest");
}

export async function downloadFacebookMedia(url) {
  return downloadSocialMedia(url, "facebook");
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
