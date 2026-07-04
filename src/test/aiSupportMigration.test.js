import assert from "node:assert/strict";
import fs from "node:fs";
import { describe, it } from "node:test";

const source = fs.readFileSync("src/commands/member/suporte.js", "utf8");

describe("Support AI migration", () => {
  it("support command uses the central ai service instead of direct OpenAI client", () => {
    assert.match(source, /aiService\.request/);
    assert.equal(source.includes("from \"openai\""), false);
    assert.equal(source.includes("new OpenAI"), false);
    assert.equal(source.includes("chat.completions.create"), false);
    assert.equal(source.includes("OPENAI_API_KEY"), false);
  });

  it("support command preserves image and model options payload", () => {
    assert.match(source, /image_url/);
    assert.match(source, /reasoning_effort/);
    assert.match(source, /max_completion_tokens/);
    assert.match(source, /allowProviderFallback: !isImage/);
  });
});
