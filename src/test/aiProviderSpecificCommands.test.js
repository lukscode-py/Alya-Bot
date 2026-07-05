import assert from "node:assert/strict";
import fs from "node:fs";
import { describe, it } from "node:test";

const openRouterSource = fs.readFileSync("src/commands/member/ia/openrouter.js", "utf8");
const openAiCompatibleSource = fs.readFileSync(
  "src/commands/member/ia/openai-comp.js",
  "utf8",
);

describe("Provider-specific AI commands", () => {
  it("openrouter command forces the OpenRouter provider", () => {
    assert.match(openRouterSource, /provider:\s*"openrouter"/);
    assert.match(openRouterSource, /allowProviderFallback:\s*false/);
    assert.match(openRouterSource, /commands:\s*\["openrouter",\s*"orouter",\s*"routerai"\]/);
  });

  it("openai-comp command forces the OpenAI Compatible provider", () => {
    assert.match(openAiCompatibleSource, /provider:\s*"openaiCompatible"/);
    assert.match(openAiCompatibleSource, /allowProviderFallback:\s*false/);
    assert.match(
      openAiCompatibleSource,
      /commands:\s*\["openai-comp",\s*"openai-compatible",\s*"openaicomp",\s*"ai-comp"\]/,
    );
  });

  it("both commands use the central AI command helper", () => {
    assert.match(openRouterSource, /requestAiText/);
    assert.match(openAiCompatibleSource, /requestAiText/);
  });
});
