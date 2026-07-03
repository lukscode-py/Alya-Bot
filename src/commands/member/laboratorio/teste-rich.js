import { delay } from "baileys";
import { PREFIX } from "../../../config.js";
import {
  buildTableRows,
  makeCodeSubmessage,
  makeLatexSubmessage,
  makeTableSubmessage,
  makeTextSubmessage,
  sendRichSubmessagesMessage,
} from "../../../utils/richMessage.js";

const LATEX_EXPRESSION = "$$E = mc^2$$";
const LATEX_IMAGE_URL =
  "https://latex.codecogs.com/png.image?%5Cdpi%7B180%7DE%20%3D%20mc%5E2";

const CODE_SAMPLE = `const bot = "Alya Bot";

async function testeRich({ socket, remoteJid }) {
  await socket.sendMessage(remoteJid, {
    text: "Rich response funcionando",
  });

  return {
    ok: true,
    tipos: ["markdown", "codigo", "tabela", "latex"],
  };
}`;

const TABLE_ROWS = [
  ["Tipo", "Primitive", "Status"],
  ["Markdown", "GenAIMarkdownTextUXPrimitive", "funciona"],
  ["Código", "GenAICodeUXPrimitive", "funciona"],
  ["Tabela", "GenATableUXPrimitive", "funciona"],
  ["LaTeX", "GenAILatexUXPrimitive", "testando"],
];

export default {
  name: "teste-rich",
  description: "Testa formatos Rich Response estilo Meta AI.",
  commands: ["teste-rich", "testrich", "rich-test"],
  usage: `${PREFIX}teste-rich`,
  /**
   * @param {CommandHandleProps} props
   */
  handle: async ({ socket, remoteJid, webMessage, sendReact, sendReply }) => {
    await sendReact("🧪");

    await sendRichSubmessagesMessage(
      socket,
      remoteJid,
      [
        makeTextSubmessage(`# Teste Rich Response da Alya

## Subtítulo
Mensagem experimental usando \`botForwardedMessage.message.richResponseMessage\`.

**Negrito**
_Itálico_
~Riscado~
\`código inline\`

> Citação rich response

Lista:
- markdown
- tabela
- código
- latex
- link

Link:
https://github.com/lukscode-py`),
        makeTableSubmessage(buildTableRows(TABLE_ROWS)),
        makeCodeSubmessage("javascript", CODE_SAMPLE),
        makeLatexSubmessage({
          text: LATEX_EXPRESSION,
          expressions: [
            {
              latexExpression: LATEX_EXPRESSION,
              url: LATEX_IMAGE_URL,
              width: 328,
              height: 111,
              fontHeight: 83.33,
              imageTopPadding: 15,
              imageLeadingPadding: 15,
              imageBottomPadding: 15,
              imageTrailingPadding: 15,
            },
          ],
        }),
        makeTextSubmessage(`## Resultado esperado

Este comando mantém apenas os testes rich que funcionaram ou que são úteis para comparação:

- texto markdown
- tabela
- bloco de código
- fórmula LaTeX

Os testes de imagem rich foram removidos porque o WhatsApp reconheceu o container, mas não renderizou a imagem interna.`),
      ],
      {
        quoted: webMessage,
        prefix: "alya-teste-rich",
        capabilities: [
          "RICH_RESPONSE_TEXT",
          "RICH_RESPONSE_CODE",
          "RICH_RESPONSE_TABLE",
          "RICH_RESPONSE_LATEX",
          "RICH_RESPONSE_LATEX_INLINE",
        ],
      },
    );

    await delay(1000);

    await sendReply(
      "Teste rich enviado sem os experimentos de imagem. Imagem rich foi removida porque o primitive aparecia vazio.",
    );
  },
};
