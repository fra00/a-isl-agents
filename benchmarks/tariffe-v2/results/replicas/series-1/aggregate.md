# Replica aggregate (5 run archiviate)

Serie model (unico): `composer` — Operator/orchestrator declares the model used for compile subagents. Not verified by the runtime. If a subagent uses a different model, this field is wrong without detection.

Freeze: vectors `99070c345bbd…` oracle `0d5c4ec993ff…` specs `d8e0d37cc8a3…`

| run | status | first | final | recompiles | turns | tokens | deps |
|-----|--------|------:|------:|-----------:|------:|-------:|:----:|
| run-01 | ok | 26/26 | 26/26 | 0 | non misurato | non misurato | pass |
| run-02 | ok | 26/26 | 26/26 | 0 | non misurato | non misurato | pass |
| run-03 | ok | 26/26 | 26/26 | 0 | non misurato | non misurato | pass |
| run-04 | ok | 26/26 | 26/26 | 0 | non misurato | non misurato | pass |
| run-05 | ok | 0/26 | 26/26 | 1 | non misurato | non misurato | pass |

First-compile full pass (score+deps; invalidate = non-pass): **4/5**
Final full pass: **5/5**
First passed — median 26, min 0, max 26
Final passed — median 26, min 26, max 26

Nessun vettore fallito su run non invalidate.

## Mutazioni × replica (hand sample)

| mutation | run-01 | run-02 | run-03 | run-04 | run-05 |
|----------|-----|-----|-----|-----|-----|
| applyBps floor (no half-up) | killed | error | error | error | error |
| ignore holidays | killed | killed | killed | error | error |
| grace exclusive (charge at lateDays==grace) | survived | survived | survived | survived | survived |
| floor before discounts | error | error | error | error | error |
| void from issued | killed | killed | killed | error | error |

## dependencyUsage by unit × run

| unit | run-01 | run-02 | run-03 | run-04 | run-05 |
|------|-----|-----|-----|-----|-----|
| logic-invoice.js | pass | pass | pass | pass | pass |
| logic-penalty.js | pass | pass | pass | pass | pass |
| logic-quote.js | pass | pass | pass | pass | pass |
