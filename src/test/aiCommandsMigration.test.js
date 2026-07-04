import assert from "node:assert/strict";
import fs from "node:fs";
import { describe, it } from "node:test";

const MIGRATED_COMMANDS = [
  "src/commands/member/ia/gemini.js",
  "src/commands/member/ia/deepseek.js",
  "src/commands/member/ia/gpt-5-mini.js",
];

describe("AI command migration", () => {
  it("simple text AI commands use the central ai service helper", () => {
    for (const file of MIGRATED_COMMANDS) {
      const source = fs.readFileSync(file, "utf8");

      assert.match(source, /requestAiText/);
      assert.equal(
        source.includes("services/alya-external-api.js"),
        false,
        `${file} should not call alya-external-api directly`,
      );
      assert.equal(
        source.includes("from \"openai\""),
        false,
        `${file} should not instantiate OpenAI directly`,
      );
    }
  });

  it("ai command helper does not expose raw api keys", () => {
    const source = fs.readFileSync("src/services/ai/command-utils.js", "utf8");

    assert.equal(source.includes("apiKey"), false);
    assert.equal(source.includes("Authorization"), false);
  });
});
