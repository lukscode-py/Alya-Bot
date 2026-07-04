import assert from "node:assert/strict";
import fs from "node:fs";
import { describe, it } from "node:test";

const source = fs.readFileSync("src/commands/member/ia/gpt-local.js", "utf8");

describe("Local AI command", () => {
  it("gptlocal command uses the local provider through the central helper", () => {
    assert.match(source, /requestAiText/);
    assert.match(source, /provider:\s*"local"/);
    assert.match(source, /allowProviderFallback:\s*false/);
  });

  it("gptlocal exposes expected command aliases", () => {
    assert.match(source, /"gptlocal"/);
    assert.match(source, /"gpt-local"/);
    assert.match(source, /"localgpt"/);
  });
});
