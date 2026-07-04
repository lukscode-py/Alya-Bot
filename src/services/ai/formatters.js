function yesNo(value) {
  return value ? "sim" : "não";
}

function code(value) {
  return value === undefined || value === null || value === "" ? "não definido" : String(value);
}

function formatKeyStates(state) {
  const keys = Array.isArray(state?.keys) ? state.keys : [];

  if (!keys.length) {
    return "nenhum estado salvo";
  }

  return keys
    .map((keyState) => {
      const cooldown = keyState.cooldownUntil
        ? ` cooldown até ${keyState.cooldownUntil}`
        : "";

      return `  - ${keyState.hash}: ${keyState.status} erros=${keyState.errorCount || 0}${cooldown}`;
    })
    .join("\n");
}

export function formatAiStatus(status) {
  const lines = [
    "*Status do Serviço de IA*",
    "",
    `Ativado: ${yesNo(status.aiEnabled)}`,
    `Provedor padrão: ${code(status.defaultProvider)}`,
    `Provedores ativos: ${status.activeProviders?.join(", ") || "nenhum"}`,
    "",
    "*Provedores*",
  ];

  for (const [providerName, provider] of Object.entries(status.providers || {})) {
    if (providerName === "local") {
      continue;
    }

    lines.push(
      "",
      `*${providerName}*`,
      `- ativado: ${yesNo(provider.enabled)}`,
      `- tipo: ${code(provider.kind)}`,
      `- modelo padrão: ${code(provider.defaultModel)}`,
      `- keys configuradas: ${provider.configuredKeyCount || 0}`,
      `- hashes das keys: ${provider.keyHashes?.join(", ") || "nenhum"}`,
      "- estado:",
      formatKeyStates(provider.state),
    );
  }

  return lines.join("\n");
}

export function formatLocalStatus(status) {
  return [
    "*Status da IA Local*",
    "",
    `Ativado: ${yesNo(status.enabled)}`,
    `Provedor: ${code(status.provider)}`,
    `Modelo selecionado: ${code(status.selectedModel)}`,
    `Modelo existe no registro: ${yesNo(status.modelFoundInRegistry)}`,
    `Modelo instalado: ${yesNo(status.modelInstalled)}`,
    `Caminho do modelo: ${code(status.modelPath)}`,
    "",
    "*Ambiente*",
    `Tipo: ${code(status.environment?.type)}`,
    `Gerenciador: ${code(status.environment?.packageManager)}`,
    `Instalação sugerida: ${code(status.environment?.installHint)}`,
  ].join("\n");
}

export function formatModelsRegistry(result) {
  const models = Array.isArray(result.models) ? result.models : [];

  if (!models.length) {
    return "Nenhum modelo local cadastrado em data/ai/models-registry.json.";
  }

  return [
    "*Modelos locais cadastrados*",
    "",
    ...models.map((model) =>
      [
        `*${model.id}*`,
        `Nome: ${code(model.name)}`,
        `Família: ${code(model.family)}`,
        `Arquivo: ${code(model.file)}`,
        `RAM mínima: ${code(model.estimatedRamMin)}`,
        `RAM recomendada: ${code(model.estimatedRamRecommended)}`,
        `Uso recomendado: ${code(model.recommendedFor)}`,
        `Qualidade: ${code(model.quality)}`,
        `Velocidade: ${code(model.speed)}`,
        `Download direto: ${yesNo(model.hasDownloadUrl)}`,
      ].join("\n"),
    ),
  ].join("\n\n");
}

export function formatProviderTestResult(providerName, result) {
  if (result.ok) {
    return [
      `*Teste do provedor ${providerName}*`,
      "",
      "Status: OK",
      `Provider usado: ${code(result.provider)}`,
      `Modelo: ${code(result.model)}`,
      `Fallback: ${yesNo(result.fallback)}`,
      `Tempo: ${code(result.elapsedMs)}ms`,
      "",
      "*Resposta*",
      code(result.text),
    ].join("\n");
  }

  return [
    `*Teste do provedor ${providerName}*`,
    "",
    "Status: ERRO",
    `Erro: ${code(result.error)}`,
    `Mensagem: ${code(result.message)}`,
    result.attempts
      ? [
          "",
          "*Tentativas*",
          ...result.attempts.map(
            (attempt) =>
              `- ${attempt.provider}: ${attempt.error?.error || "erro"} | ${attempt.error?.message || "sem mensagem"}`,
          ),
        ].join("\n")
      : "",
  ]
    .filter(Boolean)
    .join("\n");
}

export function formatAllProviderTests(result) {
  const entries = Object.entries(result.results || {});

  if (!entries.length) {
    return "Nenhum provedor ativo para testar.";
  }

  return [
    "*Teste de todos os provedores ativos*",
    "",
    ...entries.map(([providerName, providerResult]) => {
      if (providerResult.ok) {
        return `✅ ${providerName}: OK | modelo=${code(providerResult.model)} | tempo=${code(providerResult.elapsedMs)}ms`;
      }

      return `❌ ${providerName}: ${providerResult.error || "erro"} | ${providerResult.message || "sem mensagem"}`;
    }),
  ].join("\n");
}

export function formatReloadResult(runtimeData) {
  const ai = runtimeData.config?.ai || {};
  const providerNames = Object.keys(runtimeData.config?.providers || {});

  return [
    "*Configuração de IA recarregada*",
    "",
    `Ativado: ${yesNo(ai.enabled)}`,
    `Provedor padrão: ${code(ai.defaultProvider)}`,
    `Fallbacks: ${ai.fallbackProviders?.join(", ") || "nenhum"}`,
    `Providers carregados: ${providerNames.join(", ") || "nenhum"}`,
    `Modelos locais no registro: ${runtimeData.registry?.length || 0}`,
  ].join("\n");
}
