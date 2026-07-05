import assert from "node:assert/strict";
import fs from "node:fs";
import { describe, it } from "node:test";

const commandSource = fs.readFileSync("src/commands/member/ia/gpt-local.js", "utf8");
const providerSource = fs.readFileSync("src/services/ai/providers/local-ollama.js", "utf8");

describe("Local GPT streaming command", () => {
  it("requests Ollama streaming for gptlocal", () => {
    assert.match(commandSource, /stream:\s*true/);
    assert.match(commandSource, /onToken:\s*async/);
    assert.match(commandSource, /partialText/);
  });

  it("edits the same WhatsApp message every 10 words", () => {
    assert.match(commandSource, /WORDS_PER_EDIT\s*=\s*10/);
    assert.match(commandSource, /countWords/);
    assert.match(commandSource, /wordCount - lastEditedWordCount < WORDS_PER_EDIT/);
    assert.match(commandSource, /edit:\s*progressMessage\.key/);
  });

  it("keeps final fallback when message editing is not available", () => {
    assert.match(commandSource, /sendSuccessReply\(responseText\)/);
  });

  it("provider consumes Ollama chat streaming chunks", () => {
    assert.match(providerSource, /responseType:\s*"stream"/);
    assert.match(providerSource, /consumeChatStream/);
    assert.match(providerSource, /event\.message\?\.content/);
    assert.match(providerSource, /await onToken\(token, text\)/);
  });
});
