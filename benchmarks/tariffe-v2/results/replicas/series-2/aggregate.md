# Replica aggregate (5 run archiviate)

Serie model (unico): `composer` — Operator/orchestrator declares the model used for compile subagents. Not verified by the runtime. If a subagent uses a different model, this field is wrong without detection.

Freeze: vectors `c227b35761cc…` oracle `0d5c4ec993ff…` specs `74cb0f19038d…`

| run | status | first | final | recompiles | turns | tokens | deps |
|-----|--------|------:|------:|-----------:|------:|-------:|:----:|
| run-01 | ok | 27/27 | 27/27 | 0 | non misurato | non misurato | pass |
| run-02 | ok | 27/27 | 27/27 | 0 | non misurato | non misurato | pass |
| run-03 | ok | 27/27 | 27/27 | 0 | non misurato | non misurato | pass |
| run-04 | ok | 27/27 | 27/27 | 1 | non misurato | non misurato | pass |
| run-05 | ok | 27/27 | 27/27 | 0 | non misurato | non misurato | pass |

First-compile full pass (score+deps; invalidate = non-pass): **5/5**
Final full pass: **5/5**
First passed — median 27, min 27, max 27
Final passed — median 27, min 27, max 27

Nessun vettore fallito su run non invalidate.

## Mutazioni × replica (hand sample)

| mutation | run-01 | run-02 | run-03 | run-04 | run-05 |
|----------|-----|-----|-----|-----|-----|
| applyBps floor (no half-up) | non_applicabile | non_applicabile | non_applicabile | non_applicabile | non_applicabile |
| ignore holidays | non_applicabile | non_applicabile | non_applicabile | non_applicabile | non_applicabile |
| grace exclusive (charge at lateDays==grace) | killed | killed | killed | killed | killed |
| floor before discounts | non_applicabile | non_applicabile | non_applicabile | non_applicabile | non_applicabile |
| void from issued | killed | killed | killed | killed | killed |

## dependencyUsage by unit × run

| unit | run-01 | run-02 | run-03 | run-04 | run-05 |
|------|-----|-----|-----|-----|-----|
| logic-invoice.js | pass | pass | pass | pass | pass |
| logic-penalty.js | pass | pass | pass | pass | pass |
| logic-quote.js | pass | pass | pass | pass | pass |
