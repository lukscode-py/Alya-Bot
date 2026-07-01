import pkg from "../package.json" with { type: "json" };
import { BorderMenu, BOT_NAME, IconMenu } from "./config.js";
import { getPrefix } from "./utils/database.js";
import { readMore } from "./utils/index.js";

const MENU_SECTIONS = [
  {
    title: "DONO",
    emoji: "🌌",
    commands: [
      "exec",
      "get-group-id",
      "off",
      "on",
      "set-menu-image",
      "set-prefix",
      "set-api-token",
    ],
  },
  {
    title: "ADMINS",
    emoji: "⭐",
    commands: [
      "abrir",
      "add-auto-responder",
      "agendar-mensagem",
      "anti-audio (1/0)",
      "anti-call (1/0)",
      "anti-document (1/0)",
      "anti-event (1/0)",
      "anti-image (1/0)",
      "anti-link (1/0)",
      "anti-lottie-sticker (1/0)",
      "anti-payment (1/0)",
      "anti-product (1/0)",
      "anti-sticker (1/0)",
      "anti-status-grupo (1/0)",
      "anti-video (1/0)",
      "auto-responder (1/0)",
      "auto-sticker (1/0)",
      "ban",
      "delete",
      "delete-auto-responder",
      "exit (1/0)",
      "fechar",
      "hidetag",
      "limpar-chat",
      "link-grupo",
      "list-auto-responder",
      "mute",
      "only-admin (1/0)",
      "promover",
      "rebaixar",
      "revelar",
      "saldo",
      "set-proxy",
      "unmute",
      "welcome (1/0)",
    ],
  },
  {
    title: "PRINCIPAL",
    emoji: "🚀",
    commands: [
      "attp",
      "brat",
      "bratvid",
      "cep",
      "laboratorio-mensagens",
      "fake-chat",
      "gerar-link",
      "info",
      "meu-lid",
      "perfil",
      "ping",
      "raw-message",
      "rename",
      "removebg",
      "sticker",
      "suporte",
      "to-gif",
      "to-image",
      "to-mp3",
      "ttp",
      "yt-search",
    ],
  },
  {
    title: "DOWNLOADS",
    emoji: "🎶",
    commands: [
      "facebook",
      "instagram",
      "play-audio",
      "play-video",
      "pinterest",
      "tik-tok",
      "tik-tok-audio",
      "yt-mp3",
      "yt-mp4",
    ],
  },
  {
    title: "BRINCADEIRAS",
    emoji: "🎡",
    commands: ["abracar", "beijar", "dado", "jantar", "lutar", "matar", "socar"],
  },
  {
    title: "IA",
    emoji: "✨",
    commands: ["deepseek", "flux", "gemini", "gpt-5-mini", "ia-sticker"],
  },
  {
    title: "CANVAS",
    emoji: "❇",
    commands: [
      "blur",
      "bolsonaro",
      "cadeia",
      "contraste",
      "espelhar",
      "gray",
      "inverter",
      "pixel",
      "rip",
    ],
  },
];

function formatCommand(prefix, command) {
  return `${BorderMenu}${IconMenu}${prefix}${command}`;
}

function formatSection(section, prefix) {
  return [
    `╭━━⪩ ${section.title} ⪨━━`,
    "▢",
    ...section.commands.map((command) => formatCommand(prefix, command)),
    "▢",
    `╰━━─「${section.emoji}」─━━`,
  ].join("\n");
}

function formatHeader(prefix) {
  const date = new Date();

  return [
    `╭━━⪩ ALYA MENU ⪨━━${readMore()}`,
    "▢",
    `▢ • ${BOT_NAME}`,
    `▢ • Data: ${date.toLocaleDateString("pt-br")}`,
    `▢ • Hora: ${date.toLocaleTimeString("pt-br")}`,
    `▢ • Prefixo: ${prefix}`,
    `▢ • Versão: ${pkg.version}`,
    "▢",
    "╰━━─「🪐」─━━",
  ].join("\n");
}

export function menuMessage(groupJid) {
  const prefix = getPrefix(groupJid);
  const sections = MENU_SECTIONS.map((section) =>
    formatSection(section, prefix),
  ).join("\n\n");

  return `${formatHeader(prefix)}\n\n${sections}`;
}
