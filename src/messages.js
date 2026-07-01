const CLEAR_CHAT_LINES = 1800;

export const welcomeMessage = "Bem-vindo(a) ao grupo, @member!";
export const exitMessage = "@member saiu do grupo. Até a próxima!";

export function clearChat() {
  return `🗑️${"\n".repeat(CLEAR_CHAT_LINES)}`;
}
