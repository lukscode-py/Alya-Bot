import fs from "node:fs";
import path from "node:path";
import { ASSETS_DIR } from "../config.js";

const DEFAULT_LAB_MEDIA_BASE_URL =
  "https://raw.githubusercontent.com/lukscode-py/Alya-Bot/refs/heads/main/assets/lab-media";

const LAB_MEDIA_BASE_URL = (
  process.env.ALYA_LAB_MEDIA_BASE_URL || DEFAULT_LAB_MEDIA_BASE_URL
).replace(/\/+$/, "");

const LAB_MEDIA_FILES = {
  audio: "lab-audio.mp3",
  document: "lab-document.pdf",
  image: "lab-image.jpg",
  sticker: "lab-sticker.webp",
  text: "lab-text.txt",
  video: "lab-video.mp4",
};

export const LAB_CONTACT = {
  phone: "+55 11 90000-0000",
  name: "Alya Bot",
};

export function labMediaUrl(fileName) {
  return `${LAB_MEDIA_BASE_URL}/${fileName}`;
}

export function labMediaPath(fileName) {
  return path.join(ASSETS_DIR, "lab-media", fileName);
}

export function readLocalLabMedia(fileName) {
  return fs.readFileSync(labMediaPath(fileName));
}

export async function readRemoteLabMediaBuffer(fileName, getBuffer) {
  return getBuffer(labMediaUrl(fileName));
}

export const LAB_MEDIA_URLS = {
  audio: labMediaUrl(LAB_MEDIA_FILES.audio),
  document: labMediaUrl(LAB_MEDIA_FILES.document),
  image: labMediaUrl(LAB_MEDIA_FILES.image),
  logo: labMediaUrl(LAB_MEDIA_FILES.image),
  sticker: labMediaUrl(LAB_MEDIA_FILES.sticker),
  text: labMediaUrl(LAB_MEDIA_FILES.text),
  video: labMediaUrl(LAB_MEDIA_FILES.video),
};

export const LAB_REELS = [
  {
    title: "Alya Bot",
    profileIconUrl: LAB_MEDIA_URLS.image,
    thumbnailUrl: LAB_MEDIA_URLS.image,
    videoUrl: LAB_MEDIA_URLS.video,
    source: "Alya",
  },
  {
    title: "Alya Bot",
    profileIconUrl: LAB_MEDIA_URLS.image,
    thumbnailUrl: LAB_MEDIA_URLS.image,
    videoUrl: LAB_MEDIA_URLS.video,
    source: "Demo",
  },
  {
    title: "Alya Bot",
    profileIconUrl: LAB_MEDIA_URLS.image,
    thumbnailUrl: LAB_MEDIA_URLS.image,
    videoUrl: LAB_MEDIA_URLS.video,
    source: "Bot",
  },
];

export { LAB_MEDIA_FILES };
