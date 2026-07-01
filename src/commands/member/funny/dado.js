import { delay } from "baileys";
import { PREFIX } from "../../../config.js";
import { DangerError } from "../../../errors/index.js";
import { getRandomNumber } from "../../../utils/index.js";
import { getDiceStickerPath } from "../../../utils/member-command-utils.js";

function parseDiceGuess(rawGuess) {
  const number = Number(rawGuess);

  if (!Number.isInteger(number) || number < 1 || number > 6) {
    throw new DangerError(
      `Por favor, escolha um número entre 1 e 6!\nExemplo: ${PREFIX}dado 3`,
    );
  }

  return number;
}

function buildDiceResultMessage({ pushName, guess, result }) {
  if (guess === result) {
    return `🎉 *${pushName} GANHOU!* Você apostou no número *${guess}* e o dado caiu em *${result}*! 🍀`;
  }

  return `💥 *${pushName} PERDEU...* Você apostou no *${guess}*, mas o dado caiu em *${result}*! Tente novamente.`;
}

export default {
  name: "dado",
  description: "Rola um dado de 1 a 6 e compara com o número escolhido.",
  commands: ["dado", "dice"],
  usage: `${PREFIX}dado número`,
  /**
   * @param {CommandHandleProps} props
   */
  handle: async ({
    args,
    sendWaitReply,
    sendReply,
    sendStickerFromURL,
    sendReact,
    webMessage,
  }) => {
    const guess = parseDiceGuess(args[0]);
    const result = getRandomNumber(1, 6);
    const pushName = webMessage?.pushName || "Usuário";

    await sendWaitReply("🎲 Rolando o dado...");
    await sendStickerFromURL(getDiceStickerPath(result));
    await delay(2000);

    await sendReact(guess === result ? "🏆" : "😭");
    await sendReply(buildDiceResultMessage({ pushName, guess, result }));
  },
};
