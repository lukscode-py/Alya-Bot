import { PREFIX } from "../../../config.js";
import { InvalidParameterError } from "../../../errors/index.js";
import { renderMusicCardBuffer } from "../../../services/music-card-service.js";
import {
  buildAlyaPlayAudioMessage,
  cleanupYoutubeTempFile,
  downloadYoutubeAudio,
  getYoutubeRuntimeInfo,
  resolveYoutubeInput,
} from "../../../services/youtube-local-service.js";
import { errorLog } from "../../../utils/logger.js";

function resolveThumbnail(video) {
  if (video.thumbnail) {
    return video.thumbnail;
  }

  if (video.id) {
    return `https://i.ytimg.com/vi/${video.id}/hqdefault.jpg`;
  }

  return "";
}

async function sendMusicCardOrTemplate({
  socket,
  remoteJid,
  webMessage,
  sendReply,
  video,
}) {
  const caption = buildAlyaPlayAudioMessage({
    title: video.title,
    author: video.author,
    duration: video.duration,
    url: video.url,
  });

  try {
    const musicCardBuffer = await renderMusicCardBuffer({
      title: video.title,
      author: video.author,
      duration: video.duration,
      thumbnail: resolveThumbnail(video),
    });

    await socket.sendMessage(
      remoteJid,
      {
        image: musicCardBuffer,
        caption,
      },
      { quoted: webMessage },
    );

    return;
  } catch (error) {
    errorLog(`Erro ao renderizar card de música: ${error.message}`);
  }

  await sendReply(caption);
}

export default {
  name: "yt-mp3",
  description: "Baixa áudio do YouTube por termo ou link.",
  commands: ["yt-mp3", "youtube-mp3", "yt-audio", "youtube-audio", "mp3"],
  usage: `${PREFIX}yt-mp3 MC Hariel ou ${PREFIX}yt-mp3 https://youtube.com/watch?v=...`,
  /**
   * @param {CommandHandleProps} props
   */
  handle: async ({
    fullArgs,
    socket,
    remoteJid,
    webMessage,
    sendReply,
    sendAudioFromFile,
    sendWaitReact,
    sendSuccessReact,
    sendErrorReply,
  }) => {
    if (!fullArgs.length) {
      throw new InvalidParameterError(
        "Você precisa enviar o nome ou link do vídeo do YouTube!",
      );
    }

    let audioPath = "";

    try {
      await sendWaitReact();

      const video = await resolveYoutubeInput(fullArgs);

      await sendMusicCardOrTemplate({
        socket,
        remoteJid,
        webMessage,
        sendReply,
        video,
      });

      audioPath = await downloadYoutubeAudio(video.url);

      await sendAudioFromFile(audioPath);
      await sendSuccessReact();
    } catch (error) {
      const runtimeInfo = getYoutubeRuntimeInfo();

      errorLog(error?.stack || error?.message || String(error));
      errorLog(
        `YouTube runtime: yt-dlp=${runtimeInfo.binary} cookies=${runtimeInfo.cookies}`,
      );

      await sendErrorReply(
        error?.message || "Não foi possível baixar esse áudio.",
      );
    } finally {
      cleanupYoutubeTempFile(audioPath);
    }
  },
};
