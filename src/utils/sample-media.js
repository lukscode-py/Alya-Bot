import fs from "node:fs";
import path from "node:path";
import { ASSETS_DIR } from "../config.js";

const DEFAULT_SAMPLE_BASE_URL =
  "https://raw.githubusercontent.com/lukscode-py/Alya-Bot/refs/heads/main/assets/samples";

const SAMPLE_BASE_URL = (
  process.env.ALYA_SAMPLE_MEDIA_BASE_URL || DEFAULT_SAMPLE_BASE_URL
).replace(/\/+$/, "");

const SAMPLE_FILES = {
  audio: "sample-audio.mp3",
  document: "sample-document.pdf",
  image: "sample-image.jpg",
  sticker: "sample-sticker.webp",
  text: "sample-text.txt",
  video: "sample-video.mp4",
};

export const SAMPLE_CONTACT = {
  phone: "+55 11 90000-0000",
  name: "Alya Bot",
};

export function sampleUrl(fileName) {
  return `${SAMPLE_BASE_URL}/${fileName}`;
}

export function samplePath(fileName) {
  return path.join(ASSETS_DIR, "samples", fileName);
}

export function readLocalSample(fileName) {
  return fs.readFileSync(samplePath(fileName));
}

export async function readRemoteSampleBuffer(fileName, getBuffer) {
  return getBuffer(sampleUrl(fileName));
}

export const SAMPLE_URLS = {
  audio: sampleUrl(SAMPLE_FILES.audio),
  document: sampleUrl(SAMPLE_FILES.document),
  image: sampleUrl(SAMPLE_FILES.image),
  logo: sampleUrl(SAMPLE_FILES.image),
  sticker: sampleUrl(SAMPLE_FILES.sticker),
  text: sampleUrl(SAMPLE_FILES.text),
  video: sampleUrl(SAMPLE_FILES.video),
};

export const SAMPLE_REELS = [
  {
    title: "Alya Bot",
    profileIconUrl: SAMPLE_URLS.image,
    thumbnailUrl: SAMPLE_URLS.image,
    videoUrl: SAMPLE_URLS.video,
    source: "Alya",
  },
  {
    title: "Alya Bot",
    profileIconUrl: SAMPLE_URLS.image,
    thumbnailUrl: SAMPLE_URLS.image,
    videoUrl: SAMPLE_URLS.video,
    source: "Demo",
  },
  {
    title: "Alya Bot",
    profileIconUrl: SAMPLE_URLS.image,
    thumbnailUrl: SAMPLE_URLS.image,
    videoUrl: SAMPLE_URLS.video,
    source: "Bot",
  },
];

export { SAMPLE_FILES };
