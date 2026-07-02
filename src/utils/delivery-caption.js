import { BOT_EMOJI, BOT_NAME } from "../config.js";

function cleanBotDisplayName(botName = BOT_NAME) {
  const cleanName = String(botName || "Alya")
    .replace(/\bbot\b.*$/i, "")
    .replace(/bot/gi, "")
    .trim();

  return cleanName.split(/\s+/)[0] || "Alya";
}

export function formatSuccessfulDeliveryCaption() {
  const emoji = String(BOT_EMOJI || "").trim();
  const botDisplayName = cleanBotDisplayName();

  return `🌸✦ۣۜۜ͜͡${emoji} 𝗣edido entregue com sucesso!
𝙰gora aproveite... a ${botDisplayName} fez com carinho, tá bom? 𖹭`;
}
