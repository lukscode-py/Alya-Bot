Alya AI Service

Organização no projeto:
- src/config.js: configuração principal da IA em JS, com comentários e exemplos.
- src/services/ai/: código do serviço central de IA.
- src/commands/owner/ai-*.js: comandos de gerenciamento da IA.
- database/ai/: registry e estado persistente da IA.
- Ollama gerencia os modelos locais fora do repositório pelo próprio runtime.

Arquivos:
- src/config.js: contém AI_CONFIG.
- database/ai/provider-state.json: estado de rotação das keys. Não commitar.
- database/ai/models-registry.json: registro de modelos locais.
- Não commitar modelos locais, caches ou arquivos grandes de runtime.

Uso interno:
import { aiService } from "./services/ai/index.js";

const result = await aiService.request({
  provider: "gemini",
  model: "gemini-1.5-flash",
  messages: [
    { role: "user", content: "Olá" }
  ]
});

if (result.ok) {
  console.log(result.text);
}

Sem provider:
await aiService.request({
  messages: [{ role: "user", content: "Explique isso" }]
});

API keys:
Configure em src/config.js usando readEnv("NOME_DA_ENV") ou uma lista de strings.

Exemplo recomendado:
apiKeys: [readEnv("GEMINI_API_KEY")]

Exemplo com rotação direta:
apiKeys: ["key_1", "key_2", "key_3"]

Segurança:
O provider-state.json salva apenas hash das API keys, nunca a key pura.

Comandos migrados para aiService:
- $gemini / $alya -> provider gemini
- $deepseek / $deep-seek -> provider deepseek
- $gpt / $gpt-5 / $gpt-5-mini -> provider openai
- $suporte / $help / $ajuda -> provider openai

Esses comandos dependem de AI_CONFIG em src/config.js com ai.enabled=true e provider ativo.
