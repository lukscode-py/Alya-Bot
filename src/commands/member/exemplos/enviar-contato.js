import { delay } from "baileys";
import { PREFIX } from "../../../config.js";
import { SAMPLE_CONTACT } from "../../../utils/sample-media.js";

export default {
  name: "enviar-contato",
  description: "Exemplo de como enviar um contato",
  commands: ["enviar-contato"],
  usage: `${PREFIX}enviar-contato`,
  /**
   * @param {CommandHandleProps} props
   */
  handle: async ({ sendReply, sendReact, sendContact }) => {
    await sendReact("📲");

    await delay(3000);

    await sendReply("Vou enviar um contato de exemplo.");

    await delay(3000);

    await sendContact(SAMPLE_CONTACT.phone, SAMPLE_CONTACT.name);

    await delay(3000);

    await sendReply(
      "Use a função `sendContact('+55 99 99999-9999', 'Nome do contato')` para enviar um contato!"
    );
  },
};
