import path from "node:path";

export function buildAiPaths(rootDir) {
  const baseDir = path.join(rootDir, "data", "ai");

  return {
    baseDir,
    configPath: path.join(baseDir, "config.json"),
    configExamplePath: path.join(baseDir, "config.example.jsonc"),
    statePath: path.join(baseDir, "provider-state.json"),
    modelsRegistryPath: path.join(baseDir, "models-registry.json"),
    modelsDir: path.join(baseDir, "models"),
    llamaModelsDir: path.join(baseDir, "models", "llama.cpp"),
  };
}
