import { createRemoteCanvasCommand } from "../../../utils/canvas-command-utils.js";

export default createRemoteCanvasCommand({
  name: "cadeia",
  description: "Gera uma montagem de cadeia com a imagem enviada.",
  commands: ["cadeia", "jail"],
  canvasType: "jail",
});
