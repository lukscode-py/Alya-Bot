import { BOT_BANNER_PATH, PREFIX } from "../../config.js";
import { adminMenuMessage } from "../../menu.js";

export default {
  name: "menuadm",
  description: "Menu de comandos administrativos.",
  commands: ["menuadm", "menu-admin", "menuadmins", "menu-adm"],
  usage: `${PREFIX}menuadm`,
  /**
   * @param {CommandHandleProps} props
   */
  handle: async ({ remoteJid, webMessage, sendImageFromFile, sendSuccessReact }) => {
    await sendSuccessReact();

    await sendImageFromFile(
      BOT_BANNER_PATH,
      `\n\n${adminMenuMessage({
        groupJid: remoteJid,
        pushName: webMessage?.pushName || webMessage?.notifyName,
      })}`,
    );
  },
};
