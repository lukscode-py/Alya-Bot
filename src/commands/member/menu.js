import { BOT_BANNER_PATH, PREFIX } from "../../config.js";
import { menuMessage } from "../../menu.js";

export default {
  name: "menu",
  description: "Menu de comandos",
  commands: ["menu", "help"],
  usage: `${PREFIX}menu`,
  /**
   * @param {CommandHandleProps} props
   */
  handle: async ({ remoteJid, sendImageFromFile, sendSuccessReact }) => {
    await sendSuccessReact();

    await sendImageFromFile(
      BOT_BANNER_PATH,
      `\n\n${menuMessage(remoteJid)}`
    );
  },
};
