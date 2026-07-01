import { PREFIX } from "../../config.js";
import { InvalidParameterError } from "../../errors/index.js";
import {
  assertMinimumTextLength,
  buildFakeQuotedMessage,
  resolveMentionedLid,
} from "../../utils/member-command-utils.js";

const USAGE = `${PREFIX}fake-chat @usuário / texto citado / mensagem que será enviada`;

function parseFakeChatArgs(args) {
  if (args.length !== 3) {
    throw new InvalidParameterError(`Uso incorreto do comando. Exemplo: ${USAGE}`);
  }

  const mentionedLid = resolveMentionedLid(args[0]);
  const quotedText = args[1].trim();
  const responseText = args[2].trim();

  if (!mentionedLid) {
    throw new InvalidParameterError("Mencione um usuário válido para criar a citação falsa.");
  }

  assertMinimumTextLength(
    quotedText,
    2,
    "O texto citado deve ter pelo menos 2 caracteres.",
  );

  assertMinimumTextLength(
    responseText,
    2,
    "A mensagem de resposta deve ter pelo menos 2 caracteres.",
  );

  return { mentionedLid, quotedText, responseText };
}

export default {
  name: "fake-chat",
  description: "Cria uma citação falsa mencionando um usuário.",
  commands: ["fake-chat", "fq", "fake-quote", "f-quote", "fk"],
  usage: USAGE,
  /**
   * @param {CommandHandleProps} props
   */
  handle: async ({ remoteJid, socket, args }) => {
    const { mentionedLid, quotedText, responseText } = parseFakeChatArgs(args);
    const fakeQuoted = buildFakeQuotedMessage({
      remoteJid,
      mentionedLid,
      quotedText,
    });

    await socket.sendMessage(
      remoteJid,
      { text: responseText },
      { quoted: fakeQuoted },
    );
  },
};
