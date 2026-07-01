import { PREFIX } from "../../../config.js";

export default {
  name: "laboratorio-mensagens",
  description:
    "Lista as demonstrações disponíveis no laboratório de mensagens da Alya",
  commands: [
    "laboratorio-mensagens",
    "lab-mensagens",
    "laboratorio",
    "lab",
  ],
  usage: `${PREFIX}laboratorio-mensagens`,
  /**
   * @param {CommandHandleProps} props
   */
  handle: async ({ sendReply, sendReact, prefix }) => {
    await sendReact("📚");

    await sendReply(
      "*📚 LABORATÓRIO DE MENSAGENS*\n\n" +
        "Use os comandos abaixo para ver demonstrações práticas dos recursos de mensagem da Alya:\n\n" +

        "*🔊 ÁUDIO*\n" +
        `• \`${prefix}enviar-audio-de-arquivo\` - Enviar áudio de arquivo local\n` +
        `• \`${prefix}enviar-audio-de-url\` - Enviar áudio de URL\n` +
        `• \`${prefix}enviar-audio-de-buffer\` - Enviar áudio de buffer\n\n` +

        "*🖼️ IMAGEM*\n" +
        `• \`${prefix}enviar-imagem-de-arquivo\` - Enviar imagem de arquivo local\n` +
        `• \`${prefix}enviar-imagem-de-url\` - Enviar imagem de URL\n` +
        `• \`${prefix}enviar-imagem-de-buffer\` - Enviar imagem de buffer\n\n` +

        "*🎬 VÍDEO*\n" +
        `• \`${prefix}enviar-video-de-arquivo\` - Enviar vídeo de arquivo local\n` +
        `• \`${prefix}enviar-video-de-url\` - Enviar vídeo de URL\n` +
        `• \`${prefix}enviar-video-de-buffer\` - Enviar vídeo de buffer\n\n` +

        "*🎞️ GIF*\n" +
        `• \`${prefix}enviar-gif-de-arquivo\` - Enviar GIF de arquivo local\n` +
        `• \`${prefix}enviar-gif-de-url\` - Enviar GIF de URL\n` +
        `• \`${prefix}enviar-gif-de-buffer\` - Enviar GIF de buffer\n\n` +

        "*🏷️ STICKER*\n" +
        `• \`${prefix}enviar-sticker-de-arquivo\` - Enviar sticker de arquivo local\n` +
        `• \`${prefix}enviar-sticker-de-url\` - Enviar sticker de URL\n` +
        `• \`${prefix}enviar-sticker-de-buffer\` - Enviar sticker de buffer\n\n` +

        "*📊 ENQUETE*\n" +
        `• \`${prefix}enviar-enquete\` - Enviar enquetes/votações (escolha única ou múltipla)\n\n` +

        "*📍 LOCALIZAÇÃO*\n" +
        `• \`${prefix}enviar-localizacao\` - Enviar localização\n\n` +

        "*📲 CONTATO*\n" +
        `• \`${prefix}enviar-contato\` - Enviar contato\n\n` +

        "*📄 DOCUMENTO*\n" +
        `• \`${prefix}enviar-documento-de-arquivo\` - Enviar documento de arquivo local\n` +
        `• \`${prefix}enviar-documento-de-url\` - Enviar documento de URL\n` +
        `• \`${prefix}enviar-documento-de-buffer\` - Enviar documento de buffer\n\n` +

        "*💬 TEXTO E RESPOSTAS*\n" +
        `• \`${prefix}enviar-texto\` - Enviar texto (com/sem menção)\n` +
        `• \`${prefix}enviar-resposta\` - Responder mensagens (com/sem menção)\n` +
        `• \`${prefix}enviar-reacoes\` - Enviar reações (emojis)\n` +
        `• \`${prefix}enviar-mensagem-editada\` - Enviar mensagens editadas\n\n` +

        "*📊 DADOS E METADADOS*\n" +
        `• \`${prefix}obter-dados-grupo\` - Obter dados do grupo (nome, dono, participantes)\n` +
        `• \`${prefix}obter-metadados-mensagem\` - Obter metadados da mensagem\n` +
        `• \`${prefix}funcoes-grupo\` - Funções utilitárias de grupo (demonstração)\n` +
        `• \`${prefix}raw-message\` - Obter dados brutos da mensagem\n\n` +

        "*🎠 CARROSSEL (CARDS)*\n" +
        `• \`${prefix}enviar-carrossel\` - Enviar mensagem em formato carrossel (cards)\n\n` +

        "*🔘 BOTÕES E LISTAS*\n" +
        `• \`${prefix}enviar-botoes\` - Enviar mensagens com botões simples, templates e interativos\n` +
        `• \`${prefix}enviar-lista\` - Enviar mensagem em formato de lista\n` +
        `• \`${prefix}laboratorio-gatilho <parâmetro>\` - Receber o clique de botões e listas\n\n` +

        "*🧩 RICH RESPONSE*\n" +
        `• \`${prefix}enviar-texto-colorido\` - Enviar texto destacado/colorido em rich response\n` +
        `• \`${prefix}enviar-codigo\` - Enviar bloco de código em rich response\n` +
        `• \`${prefix}enviar-tabela\` - Enviar tabela em rich response\n` +
        `• \`${prefix}enviar-reels\` - Enviar reels em rich response\n` +
        `• \`${prefix}enviar-latex\` - Enviar fórmula LaTeX em rich response\n\n` +

        "*🎯 COMO USAR*\n\n" +
        "1️⃣ Execute qualquer comando da lista acima\n" +
        "2️⃣ Observe o comportamento prático\n" +
        "3️⃣ Veja o código fonte em `/src/commands/member/laboratorio/`\n" +
        "4️⃣ Use como referência para seus próprios comandos\n\n" +
        "*💡 Dica:* O laboratório inclui explicações detalhadas e casos de uso!\n\n" +

        "*📝 FUNÇÕES DISPONÍVEIS*\n\n" +
        "Veja o arquivo `@types/index.d.ts` para documentação completa de todas as funções disponíveis com exemplos de código!",
    );
  },
};
