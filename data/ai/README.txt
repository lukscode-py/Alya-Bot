Alya AI Service

Arquivos:
- data/ai/config.example.jsonc: exemplo comentado.
- data/ai/config.json: configuração real com API keys. Não commitar.
- data/ai/provider-state.json: estado de rotação das keys. Não commitar.
- data/ai/models-registry.json: registro de modelos locais.
- data/ai/models/: modelos GGUF locais. Não commitar.

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

Esses comandos dependem de data/ai/config.json com ai.enabled=true e provider ativo.
