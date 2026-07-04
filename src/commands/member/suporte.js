import fs from "node:fs";
import path from "node:path";
import { BOT_EMOJI, PREFIX, ROOT_DIR } from "../../config.js";
import { DangerError, WarningError } from "../../errors/index.js";
import { aiService } from "../../services/ai/index.js";
import { getRandomName } from "../../utils/index.js";

function buildAiFailureMessage(result) {
  if (!result?.attempts?.length) {
    return result?.message || "Serviço de IA indisponível.";
  }

  return result.attempts
    .map((attempt) => {
      const error = attempt.error?.error || "erro";
      const message = attempt.error?.message || "sem mensagem";
      return `${attempt.provider}: ${error} - ${message}`;
    })
    .join("\n");
}

function readSupportFile(...fileParts) {
  return fs.readFileSync(path.resolve(ROOT_DIR, ...fileParts), "utf-8");
}

export default {
  name: "suporte",
  description: "Suporte inteligente da Alya usando IA treinada",
  commands: ["suporte", "help", "ajuda"],
  usage: `${PREFIX}suporte como instalar a Alya no Termux?

Você também pode enviar uma imagem com o comando ${PREFIX}suporte

Você também pode escrever o texto e responder a mensagem com o comando ${PREFIX}suporte`,
  /**
   * @param {CommandHandleProps} props
   */
  handle: async ({
    fullArgs,
    args,
    sendReply,
    sendWaitReply,
    sendReact,
    replyText,
    isImage,
    isVideo,
    isAudio,
    downloadImage,
    webMessage,
  }) => {
    if (isVideo) {
      throw new WarningError(
        "Não consigo interpretar vídeos ainda! Envie uma imagem ou texto!",
      );
    }

    if (isAudio) {
      throw new WarningError(
        "Não consigo interpretar áudios ainda! Envie uma imagem ou texto!",
      );
    }

    const doubleContext = args.length && replyText;
    const text = args.length ? fullArgs : replyText;

    if (!text && !isImage) {
      await sendReact(BOT_EMOJI);

      await sendReply(
        `*Alya Suporte*
        
Faça sua pergunta sobre mim que eu te ajudarei!
  
📝 *Exemplos*

- ${PREFIX}suporte bot desliga sozinho
- ${PREFIX}suporte como instalar no Termux?
- ${PREFIX}suporte erro 401 API externa
- Envie uma imagem com ${PREFIX}suporte para análise visual`,
      );

      return;
    }

    await sendWaitReply("Analisando sua pergunta...");

    const finalText = doubleContext
      ? `Contexto anterior: ${replyText}\n\nNova questão: ${text}`
      : text;

    if (finalText) {
      const minLength = 5;
      const maxLength = 2048;

      if (finalText.length < minLength) {
        throw new DangerError(
          `O texto deve ter no mínimo ${minLength} caracteres.`,
        );
      }

      if (finalText.length > maxLength) {
        throw new DangerError(
          `O texto deve ter no máximo ${maxLength} caracteres.`,
        );
      }
    }

    let imagePath = null;

    if (isImage) {
      imagePath = await downloadImage(webMessage, getRandomName());
    }

    const messages = [
      {
        role: "system",
        content: `Você é um assistente especializado em suporte técnico da Alya Bot.

Responda apenas assuntos relacionados a: tecnologia, programação, desenvolvimento de bots, inteligência artificial, 
machine learning ou assuntos relacionados à Alya Bot.

Responda apenas em português do Brasil.
Seja direto e objetivo nas respostas, salvo se o usuário solicitar explicações mais aprofundadas.

REGRA DE TAMANHO (obrigatória): a parte em PROSA da resposta deve ter no máximo 3 parágrafos curtos ou 150 palavras, salvo se o usuário pedir explicação aprofundada. Blocos de código NÃO contam nesse limite: inclua sempre o código completo e funcional necessário, mesmo que longo, sem truncar imports, fechamentos ou partes essenciais. Respostas objetivas não precisam de introdução nem de conclusão. Vá direto à solução.

Escreva como alguém que realmente sabe do que está falando e vai direto ao ponto, logo, não escreva demais, apenas o suficiente para ser objetivo. 
Sem frases de abertura do tipo "Claro!", "Ótima pergunta!", "Com certeza!" ou similares. 
Sem encerramento do tipo "Espero ter ajudado!" ou "Qualquer dúvida é só perguntar!". 
Sem travessão (—) para estruturar listas ou ideias. Sem bullet points a menos que seja absolutamente necessário para clareza. 
Evite palavras de enchimento: "importante", "crucial", "fundamental", "robusto", "abrangente". 
Nunca responda de forma genérica quando uma resposta específica é possível. Se a pergunta for vaga, interprete da forma mais útil e responda com substância, não peça esclarecimentos desnecessários. 
Use exemplos concretos quando ajudar a explicar algo. Se tiver uma opinião sobre o assunto, diga, não fique em cima do muro.

Quando receber imagens, analise o conteúdo visual primeiro e interprete-o considerando o contexto técnico da Alya Bot.

Se alguém te pedir o link de alguma Host, envie as que você já conhece, 
sem mencionar Pterodactyl, pois os iniciantes não sabem o que é (exceto se perguntarem sobre)!`,
      },
    ];

    messages.push({
      role: "system",
      content: readSupportFile("AGENTS.md"),
    });

    messages.push({
      role: "system",
      content: readSupportFile("README.md"),
    });

    messages.push({
      role: "system",
      content: readSupportFile("CONTRIBUTING.md"),
    });

    messages.push({
      role: "system",
      content: readSupportFile("package.json"),
    });

    messages.push({
      role: "system",
      content: readSupportFile("src", "menu.js"),
    });

    messages.push({
      role: "system",
      content: readSupportFile("src", "connection.js"),
    });

    messages.push({
      role: "system",
      content: readSupportFile("src", "loader.js"),
    });

    messages.push({
      role: "system",
      content: readSupportFile("src", "@types", "index.d.ts"),
    });

    const userMessage = {
      role: "user",
      content: [],
    };

    if (finalText) {
      userMessage.content.push({
        type: "text",
        text: finalText,
      });
    }

    if (imagePath && fs.existsSync(imagePath)) {
      const buffer = fs.readFileSync(imagePath);
      const base64 = buffer.toString("base64");
      const ext = path.extname(imagePath).toLowerCase();

      let mimeType = "image/jpeg";
      switch (ext) {
        case ".png":
          mimeType = "image/png";
          break;
        case ".jpg":
        case ".jpeg":
          mimeType = "image/jpeg";
          break;
        case ".webp":
          mimeType = "image/webp";
          break;
        case ".gif":
          mimeType = "image/gif";
          break;
      }

      userMessage.content.push({
        type: "image_url",
        image_url: {
          url: `data:${mimeType};base64,${base64}`,
          detail: "low",
        },
      });
    }

    if (!finalText && isImage) {
      userMessage.content.unshift({
        type: "text",
        text: "O que você vê nesta imagem?",
      });
    }

    messages.push(userMessage);

    const result = await aiService.request({
      provider: "openai",
      messages: messages,
      allowProviderFallback: !isImage,
      options: {
        body: {
          reasoning_effort: "low",
          max_completion_tokens: 2048,
        },
      },
    });

    if (!result.ok) {
      throw new WarningError(
        [
          "O suporte inteligente não está disponível no momento.",
          "",
          buildAiFailureMessage(result),
        ].join("\n"),
      );
    }

    const answer = result.text?.trim();

    if (!answer) {
      throw new DangerError(
        `Não consegui encontrar uma resposta para sua pergunta. Tente reformular ou ser mais específico!

Não respondo assuntos fora do meu escopo de tecnologia!`,
      );
    }

    await sendReact(BOT_EMOJI);
    await sendReply(answer);

    if (imagePath && fs.existsSync(imagePath)) {
      fs.unlinkSync(imagePath);
    }
  },
};
