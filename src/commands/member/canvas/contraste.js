import { createFfmpegImageCommand } from "../../../utils/canvas-command-utils.js";

export default createFfmpegImageCommand({
  name: "contraste",
  description: "Ajusta o contraste da imagem enviada.",
  commands: ["contraste", "contrast", "melhora", "melhorar", "hd", "to-hd"],
  effectMethod: "adjustContrast",
  effectErrorMessage: "Erro ao aplicar efeito de contraste",
});
