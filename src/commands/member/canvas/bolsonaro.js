import { createRemoteCanvasCommand } from "../../../utils/canvas-command-utils.js";

export default createRemoteCanvasCommand({
  name: "bolsonaro",
  description: "Gera uma montagem do Bolsonaro com a imagem enviada.",
  commands: ["bolsonaro"],
  canvasType: "bolsonaro",
});
