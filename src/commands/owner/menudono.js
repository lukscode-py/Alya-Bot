import { BOT_BANNER_PATH, PREFIX } from "../../config.js";
import { ownerMenuMessage } from "../../menu.js";

export default {
  name: "menudono",
  description: "Menu de comandos do dono.",
  commands: ["menudono", "menu-dono", "menuowner", "menu-owner"],
  usage: `${PREFIX}menudono`,
  /**
   * @param {CommandHandleProps} props
   */
  handle: async ({ remoteJid, webMessage, sendImageFromFile, sendSuccessReact }) => {
    await sendSuccessReact();

    await sendImageFromFile(
      BOT_BANNER_PATH,
      `\n\n${ownerMenuMessage({
        groupJid: remoteJid,
        pushName: webMessage?.pushName || webMessage?.notifyName,
      })}`,
    );
  },
};
