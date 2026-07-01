import { PREFIX } from "../../config.js";
import { formatProcessUptime } from "../../utils/member-command-utils.js";

function resolvePingResponse(fullMessage) {
  return String(fullMessage || "").slice(1).startsWith("ping")
    ? "🏓 Pong!"
    : "🏓 Ping!";
}

export default {
  name: "ping",
  description:
    "Verifica se a Alya está online, o tempo de resposta e o tempo de atividade.",
  commands: ["ping", "pong"],
  usage: `${PREFIX}ping`,
  /**
   * @param {CommandHandleProps} props
   */
  handle: async ({ sendReply, sendReact, startProcess, fullMessage }) => {
    const response = resolvePingResponse(fullMessage);
    const latencyMs = Date.now() - startProcess;
    const uptime = formatProcessUptime(process.uptime());

    await sendReact("🏓");

    await sendReply(`${response}

📶 Velocidade de resposta: ${latencyMs}ms
⏱️ Uptime: ${uptime}`);
  },
};
