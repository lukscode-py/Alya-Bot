/**
 * Menu do bot
 *
 * @author Dev Gui
 */
import pkg from "../package.json" with { type: "json" };
import { BorderMenu, BOT_NAME, IconMenu } from "./config.js";
import { getPrefix } from "./utils/database.js";
import { readMore } from "./utils/index.js";

export function menuMessage(groupJid) {
  const date = new Date();

  const prefix = getPrefix(groupJid);

  return `╭━━⪩ BEM VINDO! ⪨━━${readMore()}
▢
▢ • ${BOT_NAME}
▢ • Data: ${date.toLocaleDateString("pt-br")}
▢ • Hora: ${date.toLocaleTimeString("pt-br")}
▢ • Prefixo: ${prefix}
▢ • Versão: ${pkg.version}
▢
╰━━─「🪐」─━━

╭━━⪩ DONO ⪨━━
▢
${BorderMenu}${IconMenu}${prefix}exec
${BorderMenu}${IconMenu}${prefix}get-group-id
${BorderMenu}${IconMenu}${prefix}off
${BorderMenu}${IconMenu}${prefix}on
${BorderMenu}${IconMenu}${prefix}set-menu-image
${BorderMenu}${IconMenu}${prefix}set-prefix
${BorderMenu}${IconMenu}${prefix}set-spider-api-token
▢
╰━━─「🌌」─━━

╭━━⪩ ADMINS ⪨━━
▢
${BorderMenu}${IconMenu}${prefix}abrir
${BorderMenu}${IconMenu}${prefix}add-auto-responder
${BorderMenu}${IconMenu}${prefix}agendar-mensagem
${BorderMenu}${IconMenu}${prefix}anti-audio (1/0)
${BorderMenu}${IconMenu}${prefix}anti-call (1/0)
${BorderMenu}${IconMenu}${prefix}anti-document (1/0)
${BorderMenu}${IconMenu}${prefix}anti-event (1/0)
${BorderMenu}${IconMenu}${prefix}anti-image (1/0)
${BorderMenu}${IconMenu}${prefix}anti-link (1/0)
${BorderMenu}${IconMenu}${prefix}anti-lottie-sticker (1/0)
${BorderMenu}${IconMenu}${prefix}anti-payment (1/0)
${BorderMenu}${IconMenu}${prefix}anti-product (1/0)
${BorderMenu}${IconMenu}${prefix}anti-sticker (1/0)
${BorderMenu}${IconMenu}${prefix}anti-status-grupo (1/0)
${BorderMenu}${IconMenu}${prefix}anti-video (1/0)
${BorderMenu}${IconMenu}${prefix}auto-responder (1/0)
${BorderMenu}${IconMenu}${prefix}auto-sticker (1/0)
${BorderMenu}${IconMenu}${prefix}ban
${BorderMenu}${IconMenu}${prefix}delete
${BorderMenu}${IconMenu}${prefix}delete-auto-responder
${BorderMenu}${IconMenu}${prefix}exit (1/0)
${BorderMenu}${IconMenu}${prefix}fechar
${BorderMenu}${IconMenu}${prefix}hidetag
${BorderMenu}${IconMenu}${prefix}limpar-chat
${BorderMenu}${IconMenu}${prefix}link-grupo
${BorderMenu}${IconMenu}${prefix}list-auto-responder
${BorderMenu}${IconMenu}${prefix}mute
${BorderMenu}${IconMenu}${prefix}only-admin (1/0)
${BorderMenu}${IconMenu}${prefix}promover
${BorderMenu}${IconMenu}${prefix}rebaixar
${BorderMenu}${IconMenu}${prefix}revelar
${BorderMenu}${IconMenu}${prefix}saldo
${BorderMenu}${IconMenu}${prefix}set-proxy
${BorderMenu}${IconMenu}${prefix}unmute
${BorderMenu}${IconMenu}${prefix}welcome (1/0)
▢
╰━━─「⭐」─━━

╭━━⪩ PRINCIPAL ⪨━━
▢
${BorderMenu}${IconMenu}${prefix}attp
${BorderMenu}${IconMenu}${prefix}brat
${BorderMenu}${IconMenu}${prefix}bratvid
${BorderMenu}${IconMenu}${prefix}cep
${BorderMenu}${IconMenu}${prefix}exemplos-de-mensagens
${BorderMenu}${IconMenu}${prefix}fake-chat
${BorderMenu}${IconMenu}${prefix}gerar-link
${BorderMenu}${IconMenu}${prefix}info
${BorderMenu}${IconMenu}${prefix}meu-lid
${BorderMenu}${IconMenu}${prefix}perfil
${BorderMenu}${IconMenu}${prefix}ping
${BorderMenu}${IconMenu}${prefix}raw-message
${BorderMenu}${IconMenu}${prefix}rename
${BorderMenu}${IconMenu}${prefix}removebg
${BorderMenu}${IconMenu}${prefix}sticker
${BorderMenu}${IconMenu}${prefix}suporte
${BorderMenu}${IconMenu}${prefix}to-gif
${BorderMenu}${IconMenu}${prefix}to-image
${BorderMenu}${IconMenu}${prefix}to-mp3
${BorderMenu}${IconMenu}${prefix}ttp
${BorderMenu}${IconMenu}${prefix}yt-search
▢
╰━━─「🚀」─━━

╭━━⪩ DOWNLOADS ⪨━━
▢
${BorderMenu}${IconMenu}${prefix}facebook
${BorderMenu}${IconMenu}${prefix}instagram
${BorderMenu}${IconMenu}${prefix}play-audio
${BorderMenu}${IconMenu}${prefix}play-video
${BorderMenu}${IconMenu}${prefix}pinterest
${BorderMenu}${IconMenu}${prefix}tik-tok
${BorderMenu}${IconMenu}${prefix}tik-tok-audio
${BorderMenu}${IconMenu}${prefix}yt-mp3
${BorderMenu}${IconMenu}${prefix}yt-mp4
▢
╰━━─「🎶」─━━

╭━━⪩ BRINCADEIRAS ⪨━━
▢
${BorderMenu}${IconMenu}${prefix}abracar
${BorderMenu}${IconMenu}${prefix}beijar
${BorderMenu}${IconMenu}${prefix}dado
${BorderMenu}${IconMenu}${prefix}jantar
${BorderMenu}${IconMenu}${prefix}lutar
${BorderMenu}${IconMenu}${prefix}matar
${BorderMenu}${IconMenu}${prefix}socar
▢
╰━━─「🎡」─━━

╭━━⪩ IA ⪨━━
▢
${BorderMenu}${IconMenu}${prefix}deepseek
${BorderMenu}${IconMenu}${prefix}flux
${BorderMenu}${IconMenu}${prefix}gemini
${BorderMenu}${IconMenu}${prefix}gpt-5-mini
${BorderMenu}${IconMenu}${prefix}ia-sticker
▢
╰━━─「🚀」─━━

╭━━⪩ CANVAS ⪨━━
▢
${BorderMenu}${IconMenu}${prefix}blur
${BorderMenu}${IconMenu}${prefix}bolsonaro
${BorderMenu}${IconMenu}${prefix}cadeia
${BorderMenu}${IconMenu}${prefix}contraste
${BorderMenu}${IconMenu}${prefix}espelhar
${BorderMenu}${IconMenu}${prefix}gray
${BorderMenu}${IconMenu}${prefix}inverter
${BorderMenu}${IconMenu}${prefix}pixel
${BorderMenu}${IconMenu}${prefix}rip
▢
╰━━─「❇」─━━`;
}
