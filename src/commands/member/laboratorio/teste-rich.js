import { delay } from "baileys";
import axios from "axios";
import { PREFIX } from "../../../config.js";
import {
  buildTableRows,
  makeCodeSubmessage,
  makeImageSubmessage,
  makeImagineSubmessage,
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
    tipos: ["markdown", "codigo", "tabela", "latex", "image"],
  };
}`;

const TABLE_ROWS = [
  ["Tipo", "Primitive", "Status"],
  ["Markdown", "GenAIMarkdownTextUXPrimitive", "testando"],
  ["Código", "GenAICodeUXPrimitive", "testando"],
  ["Tabela", "GenATableUXPrimitive", "testando"],
  ["LaTeX", "GenAILatexUXPrimitive", "testando"],
  ["Imagem URL", "GenAIImageUXPrimitive", "container vazio"],
  ["Imagem injetada", "GenAIImageUXPrimitive + data URI", "testando"],
  ["Imagine", "GenAIImaginePrimitive", "testando"],
];

async function fetchImageAsDataUri(url) {
  const response = await axios.get(url, {
    responseType: "arraybuffer",
    timeout: 15000,
    headers: {
      "user-agent":
        "Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36 Chrome/120 Mobile Safari/537.36",
    },
  });

  const contentType = response.headers?.["content-type"] || "image/jpeg";
  const buffer = Buffer.from(response.data);
  const base64 = buffer.toString("base64");

  return {
    base64,
    dataUri: `data:${contentType};base64,${base64}`,
    mimeType: contentType,
    bytes: buffer.length,
  };
}

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
- imagem

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

    await sendRichSubmessagesMessage(
      socket,
      remoteJid,
      [
        makeTextSubmessage(`# Teste Rich Image URL

Esta mensagem tenta enviar imagem dentro do \`unifiedResponse.data\` usando URL simples.

Tipo testado:
\`GenAIImageUXPrimitive\``),
        makeImageSubmessage({
          url: TEST_IMAGE_URL,
          mimeType: "image/jpeg",
          width: 512,
          height: 512,
          title: "Gato",
          caption: "### Gato\n\nLegenda dentro do rich image primitive.",
          altText: "Imagem de teste usada pelo comando teste-rich.",
        }),
        makeTextSubmessage(
          "Se o container aparecer vazio, o WhatsApp reconheceu o primitive mas não carregou a imagem por URL.",
        ),
      ],
      {
        quoted: webMessage,
        prefix: "alya-rich-image-url",
        capabilities: [
          "RICH_RESPONSE_IMAGE",
          "RICH_RESPONSE_MEDIA",
          "RICH_RESPONSE_UNIFIED_RESPONSE",
        ],
      },
    );

    await delay(1500);

    const injectedImage = await fetchImageAsDataUri(TEST_IMAGE_URL);

    await sendRichSubmessagesMessage(
      socket,
      remoteJid,
      [
        makeTextSubmessage(`# Teste Rich Image Injected Data URI

Esta mensagem tenta injetar a imagem diretamente no payload rich.

Imagem baixada:
\`${injectedImage.bytes} bytes\`

MIME:
\`${injectedImage.mimeType}\`

Tipo testado:
\`GenAIImageUXPrimitive\`

Estratégia:
\`data:image/...;base64,...\``),
        makeImageSubmessage({
          url: TEST_IMAGE_URL,
          dataUri: injectedImage.dataUri,
          base64: injectedImage.base64,
          mimeType: injectedImage.mimeType,
          width: 512,
          height: 512,
          title: "Gato injetado",
          caption:
            "### Gato\n\nLegenda dentro do rich image primitive com imagem em base64.",
          altText: "Imagem injetada em base64 no rich response.",
        }),
        makeTextSubmessage(
          "Se aparecer o container mas a imagem continuar vazia, o WhatsApp provavelmente não aceita data URI nesse primitive.",
        ),
      ],
      {
        quoted: webMessage,
        prefix: "alya-rich-image-data-uri",
        capabilities: [
          "RICH_RESPONSE_IMAGE",
          "RICH_RESPONSE_MEDIA",
          "RICH_RESPONSE_UNIFIED_RESPONSE",
          "RICH_RESPONSE_INLINE_MEDIA",
          "RICH_RESPONSE_EMBEDDED_MEDIA",
        ],
      },
    );

    await delay(1500);

    await sendRichSubmessagesMessage(
      socket,
      remoteJid,
      [
        makeTextSubmessage(`# Teste Rich Imagine Primitive

Esta mensagem tenta usar o formato parecido com geração de imagem da Meta AI.

Tipo testado:
\`GenAIImaginePrimitive\``),
        makeImagineSubmessage({
          url: TEST_IMAGE_URL,
          mimeType: "image/jpeg",
          prompt: "Gato",
          imagineType: "IMAGE",
          status: "FINISHED",
        }),
        makeTextSubmessage(
          "Se ficar vazio ou aparecer só texto, esse primitive depende de campos internos/servidor Meta ou de outro formato.",
        ),
      ],
      {
        quoted: webMessage,
        prefix: "alya-rich-imagine",
        capabilities: [
          "RICH_RESPONSE_IMAGE",
          "RICH_RESPONSE_MEDIA",
          "RICH_RESPONSE_IMAGINE",
          "RICH_RESPONSE_IMAGE_GENERATION",
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
        caption: `# Teste imagem comum + legenda

Esta é a tentativa de imagem com legenda fora do rich response.

*Markdown comum de legenda*
\`inline code\`
https://github.com/lukscode-py

Observação:
Legenda de imagem usa \`imageMessage.caption\`, então ela não é o mesmo tipo de \`richResponseMessage\`. Esse envio serve para comparar com os testes rich.`,
      },
      {
        quoted: webMessage,
      },
    );

    await delay(1000);

    await sendReply(
      "Teste enviado. Compare: rich por URL, rich com data URI/base64, imagine primitive e imagem comum.",
    );
  },
};
