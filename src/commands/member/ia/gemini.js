import { PREFIX } from "../../../config.js";
import { InvalidParameterError } from "../../../errors/index.js";
import { requestAiText } from "../../../services/ai/command-utils.js";

export default {
  name: "gemini",
  description: "Use a inteligência artificial da Google Gemini!",
  commands: ["gemini", "alya"],
  usage: `${PREFIX}gemini com quantos paus se faz uma canoa?`,
  /**
   * @param {CommandHandleProps} props
   */
  handle: async ({ sendSuccessReply, sendWaitReply, args, fullArgs }) => {
    const text = fullArgs || args.join(" ");

    if (!text) {
      throw new InvalidParameterError(
        "Você precisa me dizer o que eu devo responder!",
      );
    }

    await sendWaitReply();

    const responseText = await requestAiText({
      provider: "gemini",
      text,
    });

    await sendSuccessReply(responseText);
  },
};
