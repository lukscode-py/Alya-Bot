import { PREFIX } from "../../../config.js";
import { InvalidParameterError, WarningError } from "../../../errors/index.js";
import { searchYoutube } from "../../../services/youtube-local-service.js";

export default {
  name: "yt-search",
  description: "Pesquisa vídeos no YouTube sem usar API externa.",
  commands: ["yt-search", "youtube-search"],
  usage: `${PREFIX}yt-search MC Hariel`,
  /**
   * @param {CommandHandleProps} props
   */
  handle: async ({ fullArgs, sendSuccessReply }) => {
    if (fullArgs.length <= 1) {
      throw new InvalidParameterError(
        "Você precisa fornecer uma pesquisa para o YouTube.",
      );
    }

    const results = await searchYoutube(fullArgs, 5);

    if (!results.length) {
      throw new WarningError(
        "Não foi possível encontrar resultados para a pesquisa.",
      );
    }

    const text = results
      .map((item, index) => {
        return `*${index + 1}. ${item.title}*

╎Canal: ${item.author}
╎Duração: ${item.duration}
╎Publicado em: ${item.publishedAt}
╎Views: ${item.views}
╎URL: ${item.url}`;
      })
      .join("\n\n─────\n\n");

    await sendSuccessReply(`*Pesquisa realizada*

*Termo:* ${fullArgs}

*Resultados*
${text}`);
  },
};
