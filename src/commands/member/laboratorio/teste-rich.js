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

const TEST_IMAGE_URL =
  "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTq2_2nkLrix3XMD-b943mfl9QK11abCq6-qnVxJ6MrhtJ0WxX8PweYYinP&s=10";

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
  ["Markdown", "GenAIMarkdownTextUXPrimitive", "testando"],
  ["Código", "GenAICodeUXPrimitive", "testando"],
  ["Tabela", "GenATableUXPrimitive", "testando"],
  ["LaTeX", "GenAILatexUXPrimitive", "testando"],
  ["Imagem + legenda", "imageMessage.caption", "fallback comum"],
];

export default {
  name: "teste-rich",
  description: "Testa vários formatos de Rich Response estilo Meta AI.",
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
        makeTextSubmessage(`## Observação

Se algum bloco não renderizar, o WhatsApp dessa versão provavelmente não reconheceu o \`__typename\` ou a capacidade rich usada.`),
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

    await delay(1500);

    await socket.sendMessage(
      remoteJid,
      {
        image: {
          url: TEST_IMAGE_URL,
        },
        caption: `# Teste imagem + legenda

Esta é a tentativa de imagem com legenda.

*Markdown comum de legenda*
\`inline code\`
https://github.com/lukscode-py

Observação:
Legenda de imagem usa \`imageMessage.caption\`, então ela não é o mesmo tipo de \`richResponseMessage\`. Esse envio serve para testar o limite entre imagem normal e rich response.`,
      },
      {
        quoted: webMessage,
      },
    );

    await delay(1000);

    await sendReply(
      "Teste enviado. A primeira mensagem é rich response. A segunda é imagem normal com legenda markdown para comparar o suporte do WhatsApp.",
    );
  },
};
