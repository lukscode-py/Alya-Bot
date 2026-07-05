import { PREFIX } from "../../../config.js";
import { InvalidParameterError } from "../../../errors/index.js";
import { requestAiText } from "../../../services/ai/command-utils.js";

const WORDS_PER_EDIT = 10;

function countWords(text = "") {
  return String(text).trim().split(/\s+/).filter(Boolean).length;
}

function buildProgressText(text = "") {
  const cleanText = String(text || "").trim();

  if (!cleanText) {
    return "Pensando com a IA local...";
  }

  return cleanText;
}

export default {
  name: "gpt-local",
  description: "Use a inteligência artificial local configurada com Ollama.",
  commands: ["gptlocal", "gpt-local", "localgpt"],
  usage: `${PREFIX}gptlocal explique promises em JavaScript`,
  /**
   * @param {CommandHandleProps} props
   */
  handle: async ({
    socket,
    remoteJid,
    webMessage,
    sendSuccessReply,
    sendWaitReply,
    args,
    fullArgs,
  }) => {
    const text = fullArgs || args.join(" ");

    if (!text) {
      throw new InvalidParameterError(
        "Você precisa me dizer o que a IA local deve responder!",
      );
    }

    let progressMessage = await sendWaitReply("Pensando com a IA local...");
    let lastEditedWordCount = 0;
    let lastEditedText = "";

    if (!progressMessage?.key && socket?.sendMessage && remoteJid) {
      progressMessage = await socket.sendMessage(
        remoteJid,
        {
          text: "Pensando com a IA local...",
        },
        {
          quoted: webMessage,
        },
      );
    }

    const editProgress = async (nextText, { force = false } = {}) => {
      const progressText = buildProgressText(nextText);
      const wordCount = countWords(progressText);

      if (!force && wordCount - lastEditedWordCount < WORDS_PER_EDIT) {
        return;
      }

      if (progressText === lastEditedText) {
        return;
      }

      lastEditedText = progressText;
      lastEditedWordCount = wordCount;

      if (!socket?.sendMessage || !remoteJid || !progressMessage?.key) {
        return;
      }

      await socket.sendMessage(remoteJid, {
        text: progressText,
        edit: progressMessage.key,
      });
    };

    const responseText = await requestAiText({
      provider: "local",
      text,
      allowProviderFallback: false,
      options: {
        stream: true,
        onToken: async (_token, partialText) => {
          await editProgress(partialText);
        },
      },
    });

    if (progressMessage?.key) {
      await editProgress(responseText, { force: true });
      return;
    }

    await sendSuccessReply(responseText);
  },
};
