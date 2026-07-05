import { PREFIX } from "../../../config.js";
import { InvalidParameterError } from "../../../errors/index.js";
import { requestAiText } from "../../../services/ai/command-utils.js";

export default {
  name: "openrouter",
  description: "Use a inteligência artificial configurada no provedor OpenRouter.",
  commands: ["openrouter", "orouter", "routerai"],
  usage: `${PREFIX}openrouter explique closures em JavaScript`,
  /**
   * @param {CommandHandleProps} props
   */
  handle: async ({ sendSuccessReply, sendWaitReply, args, fullArgs }) => {
    const text = fullArgs || args.join(" ");

    if (!text) {
      throw new InvalidParameterError(
        "Você precisa me dizer o que o OpenRouter deve responder!",
      );
    }

    await sendWaitReply("Pensando com OpenRouter...");

    const responseText = await requestAiText({
      provider: "openrouter",
      text,
      allowProviderFallback: false,
    });

    await sendSuccessReply(responseText);
  },
};
