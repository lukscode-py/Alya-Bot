import { BOT_BANNER_PATH, PREFIX } from "../../config.js";
import { memberMenuMessage } from "../../menu.js";

export default {
  name: "menumemb",
  description: "Menu de comandos para membros.",
  commands: ["menumemb", "menu-membro", "menu-membros"],
  usage: `${PREFIX}menumemb`,
  /**
   * @param {CommandHandleProps} props
   */
  handle: async ({ remoteJid, webMessage, sendImageFromFile, sendSuccessReact }) => {
    await sendSuccessReact();

    await sendImageFromFile(
      BOT_BANNER_PATH,
      `\n\n${memberMenuMessage({
        groupJid: remoteJid,
        pushName: webMessage?.pushName || webMessage?.notifyName,
      })}`,
    );
  },
};
