import { delay } from "baileys";
import { PREFIX } from "../../../config.js";
import {
  makeCodeSubmessage,
  makeTextSubmessage,
  sendRichSubmessagesMessage,
} from "../../../utils/richMessage.js";

const CODE_TYPES = [
  "DEFAULT",
  "KEYWORD",
  "STR",
  "NUMBER",
  "COMMENT",
  "FUNCTION",
  "CLASS",
  "VARIABLE",
  "OPERATOR",
  "PUNCTUATION",
  "PROPERTY",
  "BUILTIN",
  "BOOLEAN",
  "NULL",
  "REGEX",
  "TAG",
  "ATTRIBUTE",
  "TYPE",
  "PARAMETER",
  "CONSTANT",
  "METHOD",
  "MODULE",
  "NAMESPACE",
  "ERROR",
  "WARNING",
  "INFO",
];

function buildColorTestBlocks() {
  const blocks = [];

  for (const type of CODE_TYPES) {
    blocks.push({
      codeContent: `${type.padEnd(12)} `,
      type,
    });

    blocks.push({
      codeContent: `// visual do tipo ${type}\n`,
      type,
    });
  }

  blocks.push({
    codeContent: "\n// Exemplo misturado real\n",
    type: "COMMENT",
  });

  blocks.push({ codeContent: "const", type: "KEYWORD" });
  blocks.push({ codeContent: " nome", type: "VARIABLE" });
  blocks.push({ codeContent: " = ", type: "OPERATOR" });
  blocks.push({ codeContent: "\"Alya\"", type: "STR" });
  blocks.push({ codeContent: ";\n", type: "PUNCTUATION" });

  blocks.push({ codeContent: "return", type: "KEYWORD" });
  blocks.push({ codeContent: " ", type: "DEFAULT" });
  blocks.push({ codeContent: "200", type: "NUMBER" });
  blocks.push({ codeContent: ";", type: "PUNCTUATION" });

  return blocks;
}

export default {
  name: "teste-cor-rich",
  description: "Testa tipos de destaque/cor em blocos de código Rich Response.",
  commands: ["teste-cor-rich", "testecorrich", "rich-colors", "rich-cores"],
  usage: `${PREFIX}teste-cor-rich`,
  /**
   * @param {CommandHandleProps} props
   */
  handle: async ({ socket, remoteJid, webMessage, sendReact, sendReply }) => {
    await sendReact("🎨");

    await sendRichSubmessagesMessage(
      socket,
      remoteJid,
      [
        makeTextSubmessage(`# Teste de cores Rich Code

Este teste envia vários valores no campo \`type\` de \`code_blocks\`.

O WhatsApp pode:
- colorir alguns tipos;
- tratar tipos desconhecidos como padrão;
- variar as cores conforme tema/versão.`),
        makeCodeSubmessage("javascript", buildColorTestBlocks()),
        makeTextSubmessage(`## Tipos testados

${CODE_TYPES.map((type) => `- \`${type}\``).join("\n")}

Se dois tipos ficarem com a mesma cor, provavelmente o WhatsApp mapeia ambos para o mesmo estilo ou ignora o tipo.`),
      ],
      {
        quoted: webMessage,
        prefix: "alya-teste-cor-rich",
        capabilities: [
          "RICH_RESPONSE_TEXT",
          "RICH_RESPONSE_CODE",
          "RICH_RESPONSE_UNIFIED_RESPONSE",
          "RICH_RESPONSE_UNIFIED_TEXT_COMPONENT",
        ],
      },
    );

    await delay(1000);

    await sendReply(
      "Teste de cores rich enviado. Compare visualmente quais tipos mudaram de cor no bloco de código.",
    );
  },
};
