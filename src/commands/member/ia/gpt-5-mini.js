import { PREFIX } from "../../../config.js";
import { InvalidParameterError } from "../../../errors/index.js";
import { requestAiText } from "../../../services/ai/command-utils.js";

export default {
  name: "gpt-5-mini",
  description: "Use a inteligência artificial GPT configurada no serviço central.",
  commands: ["gpt-5-mini", "gpt-5", "gpt"],
  usage: `${PREFIX}gpt-5-mini qual o sentido da vida?`,
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
      provider: "openai",
      text,
    });

    await sendSuccessReply(responseText);
  },
};
