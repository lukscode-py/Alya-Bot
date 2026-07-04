import path from "node:path";

export function buildAiPaths(rootDir) {
  const baseDir = path.join(rootDir, "database", "ai");
  const modelsDir = path.join(rootDir, "assets", "ai", "models");

  return {
    baseDir,
    configPath: path.join(baseDir, "config.json"),
    configExamplePath: path.join(baseDir, "config.example.jsonc"),
    statePath: path.join(baseDir, "provider-state.json"),
    modelsRegistryPath: path.join(baseDir, "models-registry.json"),
    modelsDir,
    llamaModelsDir: path.join(modelsDir, "llama.cpp"),
  };
}
