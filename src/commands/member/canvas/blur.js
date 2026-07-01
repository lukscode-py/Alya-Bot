import { createFfmpegImageCommand } from "../../../utils/canvas-command-utils.js";

export default createFfmpegImageCommand({
  name: "blur",
  description: "Aplica desfoque na imagem enviada.",
  commands: ["blur", "embaça", "embaçar"],
  effectMethod: "applyBlur",
  effectErrorMessage: "Erro ao aplicar efeito de blur",
});
