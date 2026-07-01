import fs from "node:fs";
import path from "node:path";
import { ASSETS_DIR, TEMP_DIR } from "../config.js";
import { getBuffer, getRandomName } from "../utils/index.js";

function getDefaultProfileImagePath() {
  return path.resolve(ASSETS_DIR, "images", "default-user.png");
}

function readDefaultProfileImage() {
  const profileImage = getDefaultProfileImagePath();

  if (!fs.existsSync(profileImage)) {
    return { buffer: null, profileImage };
  }

  return {
    buffer: fs.readFileSync(profileImage),
    profileImage,
  };
}

async function saveRemoteProfileImage(profileImageUrl) {
  const buffer = await getBuffer(profileImageUrl);
  const profileImage = path.resolve(TEMP_DIR, getRandomName("png"));

  fs.writeFileSync(profileImage, buffer);

  return { buffer, profileImage };
}

export async function getProfileImageData(socket, userLid) {
  try {
    const profileImageUrl = await socket.profilePictureUrl(userLid, "image");
    const { buffer, profileImage } = await saveRemoteProfileImage(profileImageUrl);

    return { buffer, profileImage, success: true };
  } catch {
    const { buffer, profileImage } = readDefaultProfileImage();

    return { buffer, profileImage, success: false };
  }
}
