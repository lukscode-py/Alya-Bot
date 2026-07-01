import { delay } from "baileys";
import { PREFIX } from "../../../config.js";
import { sendRichCodeMessage } from "../../../utils/codeMessage.js";
import { LAB_MEDIA_URLS } from "../../../utils/lab-media.js";

export default {
  name: "enviar-carrossel",
  description: "Exemplo de como enviar mensagens em formato carrossel (cards)",
  commands: ["enviar-carrossel"],
  usage: `${PREFIX}enviar-carrossel`,
  /**
   * @param {CommandHandleProps} props
   */
  handle: async ({ socket, remoteJid, webMessage, sendReply, sendReact }) => {
    await sendReact("🎠");

    await delay(2000);

    await sendReply("Vou enviar um exemplo de mensagem em carrossel (cards)");

    await delay(3000);

    await socket.sendMessage(remoteJid, {
      text: "🎨 Galeria de Exemplos",
      footer: "Deslize para ver todos os cards →",
      cards: [
        {
          title: "🖼️ Card 1: Imagem de Exemplo",
          image: {
            url: LAB_MEDIA_URLS.image,
          },
          caption: "Esta é a primeira imagem do carrossel",
        },
        {
          title: "📸 Card 2: Outra Imagem",
          image: {
            url: LAB_MEDIA_URLS.logo,
          },
          caption: "Segunda imagem com descrição diferente",
        },
        {
          title: "🎭 Card 3: Terceira Opção",
          image: {
            url: LAB_MEDIA_URLS.image,
          },
          caption: "Outro exemplo de card no carrossel",
        },
      ],
      viewOnce: true,
    });

    await delay(3000);

    await sendRichCodeMessage(socket, remoteJid, {
      title: "📋 *Como usar mensagens carrossel:*",
      language: "javascript",
      code: `await socket.sendMessage(remoteJid, {
  text: 'Título principal',
  footer: 'Rodapé da mensagem',
  cards: [
    {
      title: 'Título do card',
      image: { url: 'URL da imagem' },
      caption: 'Descrição do card'
    }
  ],
  viewOnce: true
});`,
      footer:
        "\n💡 *Dicas:*\n" +
        "• Você pode adicionar quantos cards quiser\n" +
        "• `viewOnce: true` é obrigatório\n" +
        "• Cada card precisa de `title`, `image` e `caption`\n" +
        "⚠️ Importante: a Baileys usada pela Alya foi ajustada para suportar mensagens em carrossel!",
      quoted: webMessage,
    });
  },
};
