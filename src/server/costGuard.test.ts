import test from "node:test";
import assert from "node:assert/strict";
import { costGuard } from "./costGuard";

test("CostGuard allows requests within daily limits", () => {
  const check = costGuard.checkLimit("cnpj_lookup");
  assert.equal(check.allowed, true);
});

test("CostGuard blocks requests when service is set to block in strict free mode", () => {
  const check = costGuard.checkLimit("google_places");
  assert.equal(check.allowed, false);
  assert.match(check.reason || "", /bloqueado pelo Modo 100% Gratuito Estrito/);
});

test("CostGuard records calls and increments daily counter", () => {
  const before = costGuard.getMetrics().usage["gemini_text"]?.dailyCount || 0;
  costGuard.recordCall("gemini_text");
  const after = costGuard.getMetrics().usage["gemini_text"]?.dailyCount || 0;
  assert.equal(after, before + 1);
});

test("CostGuard caches CNPJ lookups and returns cached hit", () => {
  const mockCnpj = "12345678000199";
  costGuard.setCachedCnpj(mockCnpj, { razaoSocial: "Empresa Teste Ltda" }, "BrasilAPI");

  const cached = costGuard.getCachedCnpj(mockCnpj);
  assert.ok(cached);
  assert.equal(cached.razaoSocial, "Empresa Teste Ltda");
  assert.equal(cached._fromCache, true);
});

test("CostGuard deduplicates identical in-flight promises", async () => {
  let executionCount = 0;
  const slowFn = async () => {
    executionCount += 1;
    await new Promise((r) => setTimeout(r, 20));
    return "result_ok";
  };

  const [res1, res2] = await Promise.all([
    costGuard.deduplicateRequest("test_request_key", slowFn),
    costGuard.deduplicateRequest("test_request_key", slowFn),
  ]);

  assert.equal(res1, "result_ok");
  assert.equal(res2, "result_ok");
  assert.equal(executionCount, 1, "Expected only 1 execution due to in-flight deduplication");
});
