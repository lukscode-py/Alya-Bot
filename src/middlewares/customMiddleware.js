/**
 * Ponto de extensão local da Alya.
 *
 * É chamado antes do processamento comum de mensagens e antes dos eventos de
 * entrada/saída de participantes. Use este arquivo para personalizações do
 * projeto sem alterar o fluxo principal do bot.
 *
 * @param {CustomMiddlewareProps} params
 */
export async function customMiddleware({
  socket,
  webMessage,
  type,
  commonFunctions,
  action,
  data,
}) {
  void socket;
  void webMessage;
  void type;
  void commonFunctions;
  void action;
  void data;

  // Adicione personalizações locais aqui.
}
