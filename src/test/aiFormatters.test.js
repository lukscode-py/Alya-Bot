import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  formatAiStatus,
  formatProviderTestResult,
} from "../services/ai/formatters.js";

describe("AI formatters", () => {
  it("does not expose raw api keys in status output", () => {
    const output = formatAiStatus({
      aiEnabled: true,
      defaultProvider: "gemini",
      activeProviders: ["gemini"],
      providers: {
        gemini: {
          enabled: true,
          kind: "gemini",
          defaultModel: "gemini-1.5-flash",
          configuredKeyCount: 1,
          keyHashes: ["abc123"],
          state: {
            keys: [
              {
                hash: "abc123",
                status: "working",
                errorCount: 0,
              },
            ],
          },
        },
      },
    });

    assert.equal(output.includes("REAL_SECRET_KEY"), false);
    assert.equal(output.includes("abc123"), true);
  });

  it("formats provider errors without throwing", () => {
    const output = formatProviderTestResult("gemini", {
      ok: false,
      error: "AI_SERVICE_DISABLED",
      message: "desativado",
    });

    assert.match(output, /AI_SERVICE_DISABLED/);
    assert.match(output, /desativado/);
  });
});
