import { createRemoteCanvasCommand } from "../../../utils/canvas-command-utils.js";

export default createRemoteCanvasCommand({
  name: "rip",
  description: "Gera uma montagem estilo cemitério com a imagem enviada.",
  commands: ["rip"],
  canvasType: "rip",
});
