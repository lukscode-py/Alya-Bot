import { PREFIX } from "../../../config.js";
import { InvalidParameterError } from "../../../errors/index.js";
import { requestAiText } from "../../../services/ai/command-utils.js";

export default {
  name: "deepseek",
  description: "Use a inteligência artificial DeepSeek!",
  commands: ["deepseek", "deep-seek"],
  usage: `${PREFIX}deepseek Crie um resumo curto sobre inteligência artificial`,
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
      provider: "deepseek",
      text,
    });

    await sendSuccessReply(responseText);
  },
};
