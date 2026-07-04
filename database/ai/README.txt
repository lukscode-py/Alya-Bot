Alya AI Service

Organização no projeto:
- src/services/ai/: código do serviço central de IA.
- src/commands/owner/ai-*.js: comandos de gerenciamento da IA.
- database/ai/: configuração, registry e estado persistente da IA.
- assets/ai/models/: modelos locais GGUF e arquivos grandes de runtime/modelo.

Arquivos:
- database/ai/config.example.jsonc: exemplo comentado.
- database/ai/config.json: configuração real com API keys. Não commitar.
- database/ai/provider-state.json: estado de rotação das keys. Não commitar.
- database/ai/models-registry.json: registro de modelos locais.
- assets/ai/models/: modelos GGUF locais. Não commitar.

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
Use env:VARIAVEL no config.json para ler do ambiente, por exemplo:
"apiKeys": ["env:GEMINI_API_KEY"]

Segurança:
O provider-state.json salva apenas hash das API keys, nunca a key pura.

Comandos já migrados para aiService:
- $gemini / $alya -> provider gemini
- $deepseek / $deep-seek -> provider deepseek
- $gpt / $gpt-5 / $gpt-5-mini -> provider openai

Esses comandos dependem de database/ai/config.json com ai.enabled=true e provider ativo.
