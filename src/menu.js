import pkg from "../package.json" with { type: "json" };
import { BOT_NAME, OWNER_NAME } from "./config.js";
import { getPrefix } from "./utils/database.js";

const MENU_STYLE = {
  top: "╭═•❃ུ۪ ❀ུ۪ ❁ུ۪ ❃ུ۪ ❀ུ۪•═╮",
  bottom: "╰═•❃ུ۪ ❀ུ۪ ❁ུ۪ ❃ུ۪ ❀ུ۪•═╯",
  stars: "✫✫✫✫✫",
  love: "╎   ᶫᵒᵛᵉᵧₒᵤ ᶫᵒᵛᵉᵧₒᵤ ᶫᵒᵛᵉᵧₒᵤ",
  commandIcon: "✰ۣۜۜ͜͡",
};

const MAIN_SECTIONS = [
  {
    title: "PRINCIPAL",
    emoji: "🍾",
    icon: "🍭",
    commands: [
      "menumemb",
      "menuadm",
      "menudono",
      "ping",
      "perfil",
      "info <comando>",
      "suporte",
    ],
  },
  {
    title: "ATALHOS",
    emoji: "❤️‍🔥",
    icon: "✨",
    commands: ["play <nome/link>", "sticker", "brat", "gpt <pergunta>", "gemini <pergunta>"],
  },
];

const MEMBER_SECTIONS = [
  {
    title: "DOWNLOADS",
    emoji: "🎶",
    icon: "🍭",
    commands: [
      "play <nome/link>",
      "play-video <nome/link>",
      "yt-mp3 <nome/link>",
      "yt-mp4 <nome/link>",
      "instagram <link>",
      "tik-tok <link>",
      "tik-tok-audio <link>",
      "pinterest <link>",
      "facebook <link>",
      "yt-search <pesquisa>",
    ],
  },
  {
    title: "FIGURINHAS",
    emoji: "🌸",
    icon: "🎠",
    commands: [
      "sticker",
      "attp <texto>",
      "ttp <texto>",
      "brat <texto>",
      "bratvid <texto>",
      "rename pacote / autor",
      "toimage",
      "togif",
      "ia-sticker <descrição>",
    ],
  },
  {
    title: "IA",
    emoji: "✨",
    icon: "🧠",
    commands: [
      "gpt <pergunta>",
      "gpt-5-mini <pergunta>",
      "gemini <pergunta>",
      "deepseek <pergunta>",
      "flux <descrição>",
    ],
  },
  {
    title: "IMAGEM",
    emoji: "🧩",
    icon: "❃",
    commands: [
      "removebg",
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
  {
    title: "UTILIDADES",
    emoji: "🥎",
    icon: "🎠",
    commands: [
      "cep <cep>",
      "gerar-link",
      "info <comando>",
      "meu-lid",
      "perfil",
      "ping",
      "suporte",
      "fake-chat",
      "raw-message",
    ],
  },
  {
    title: "BRINCADEIRAS",
    emoji: "🪩",
    icon: "🌎",
    commands: ["abracar", "beijar", "dado", "jantar", "lutar", "matar", "socar", "tapa"],
  },
  {
    title: "LABORATÓRIO",
    emoji: "🧪",
    icon: "⚗️",
    commands: [
      "laboratorio-mensagens",
      "enviar-botoes",
      "enviar-lista",
      "enviar-carrossel",
      "enviar-tabela",
      "enviar-reels",
      "obter-dados-grupo",
      "obter-metadados-mensagem",
    ],
  },
];

const ADMIN_SECTIONS = [
  {
    title: "GRUPO",
    emoji: "⭐",
    icon: "⚘",
    commands: [
      "abrir",
      "fechar",
      "welcome (1/0)",
      "link-grupo",
      "set-name <nome>",
      "hide-tag <texto>",
      "delete",
      "limpar-chat",
      "revelar",
    ],
  },
  {
    title: "MODERAÇÃO",
    emoji: "🛡️",
    icon: "✘",
    commands: [
      "ban @membro",
      "mute @membro",
      "unmute @membro",
      "promover @membro",
      "rebaixar @membro",
      "warn @membro",
      "unwarn @membro",
      "warn-reactivate @membro",
      "only-admin (1/0)",
    ],
  },
  {
    title: "PROTEÇÕES",
    emoji: "🩸",
    icon: "❃",
    commands: [
      "anti-link (1/0)",
      "anti-audio (1/0)",
      "anti-video (1/0)",
      "anti-image (1/0)",
      "anti-sticker (1/0)",
      "anti-document (1/0)",
      "anti-event (1/0)",
      "anti-product (1/0)",
      "anti-payment (1/0)",
      "anti-status-grupo (1/0)",
      "anti-lottie-sticker (1/0)",
      "anti-call (1/0)",
    ],
  },
  {
    title: "AUTOMAÇÃO",
    emoji: "☀️",
    icon: "✨",
    commands: [
      "add-auto-responder termo / resposta",
      "delete-auto-responder <id>",
      "list-auto-responder",
      "auto-responder (1/0)",
      "auto-sticker (1/0)",
      "agendar <msg> / <tempo>",
      "afk <motivo>",
      "exit (1/0)",
      "saldo",
      "block-wpp <telefone>",
    ],
  },
];

const OWNER_SECTIONS = [
  {
    title: "DONO",
    emoji: "👑",
    icon: "🍾",
    commands: [
      "on",
      "off",
      "exec <comando>",
      "get-group-id",
      "testing",
      "set-prefix <prefixo>",
      "set-menu-image",
    ],
  },
  {
    title: "SISTEMA",
    emoji: "🌌",
    icon: "✨",
    commands: [
      "set-api-token <token>",
      "importcookie youtube <cookies.txt>",
      "importcookie instagram <cookies.txt>",
      "importcookie tiktok <cookies.txt>",
      "musiccard player",
      "musiccard orbit",
    ],
  },
];

function normalizeContext(context) {
  if (typeof context === "string") {
    return {
      groupJid: context,
      pushName: "",
    };
  }

  return {
    groupJid: context?.groupJid || context?.remoteJid || "",
    pushName: context?.pushName || context?.pushname || "",
  };
}

function getTimeInfo() {
  const date = new Date();
  const hour = date.getHours();

  const tempo =
    hour >= 5 && hour < 12
      ? "Bom dia"
      : hour >= 12 && hour < 18
        ? "Boa tarde"
        : "Boa noite";

  return {
    tempo,
    hora: date.toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
    }),
    data: date.toLocaleDateString("pt-BR"),
  };
}

function decorateTitle(title, emoji) {
  return [
    `╭═• ೋ✧๑${emoji}๑✧ೋ •═╮`,
    `╎ ${emoji}×>𝐌𝐄𝐍𝐔 ${title}<×${emoji}`,
    `╰═• ೋ✧๑${emoji}๑✧ೋ •═╯`,
  ].join("\n");
}

function formatCommand(prefix, command, icon) {
  return `╎${MENU_STYLE.commandIcon}${icon} ${prefix}${command}`;
}

function formatSection(section, prefix) {
  return [
    MENU_STYLE.love,
    decorateTitle(section.title, section.emoji),
    ...section.commands.map((command) => formatCommand(prefix, command, section.icon)),
    `╰═• ೋ✧๑${section.emoji}๑✧ೋ •═╯`,
  ].join("\n");
}

function formatHeader({ prefix, pushName }) {
  const { tempo, hora, data } = getTimeInfo();
  const userName = pushName || "usuário";

  return [
    MENU_STYLE.top,
    `┏│ ${MENU_STYLE.stars}`,
    `┃│Oiê @${userName}`,
    `┃│${tempo} ฅ^•ﻌ•^ฅ`,
    `┃│ʜᴏʀᴀ: ${hora}`,
    `┃│ᴅᴀᴛᴀ: ${data}`,
    `┃│ᴅᴏɴᴏ: ${OWNER_NAME}`,
    `┃│ʙᴏᴛ: ${BOT_NAME}`,
    `┃│ᴘʀᴇғɪxᴏ: ${prefix}`,
    `┃│ᴠᴇʀsãᴏ: ${pkg.version}`,
    `┗│ ${MENU_STYLE.stars}`,
    MENU_STYLE.bottom,
  ].join("\n");
}

function buildMenu(context, sections) {
  const { groupJid, pushName } = normalizeContext(context);
  const prefix = getPrefix(groupJid);
  const body = sections.map((section) => formatSection(section, prefix)).join("\n╎\n");

  return `${formatHeader({ prefix, pushName })}\n\n${body}`;
}

export function mainMenuMessage(context) {
  return buildMenu(context, MAIN_SECTIONS);
}

export function memberMenuMessage(context) {
  return buildMenu(context, MEMBER_SECTIONS);
}

export function adminMenuMessage(context) {
  return buildMenu(context, ADMIN_SECTIONS);
}

export function ownerMenuMessage(context) {
  return buildMenu(context, OWNER_SECTIONS);
}

export function menuMessage(context) {
  return mainMenuMessage(context);
}
