import { createRemoteCanvasCommand } from "../../../utils/canvas-command-utils.js";

export default createRemoteCanvasCommand({
  name: "inverter",
  description: "Gera uma montagem com as cores da imagem invertidas.",
  commands: ["invert", "inverter"],
  canvasType: "invert",
});
