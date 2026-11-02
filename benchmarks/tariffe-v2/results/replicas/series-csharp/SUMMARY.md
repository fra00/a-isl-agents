# Serie csharp — A-ISL (tariffe-v2-csharp-s1)

> Cinque compile `csharp` da zero sullo stesso oracle di serie 2 (27 vettori). Contratto `bench/csharp-api-contract.md` + skill compile. Modello `composer` dichiarato (`subagentModelExplicit: false`). Freeze: `integrity-freeze-csharp.json` (riaperto una volta mid-serie per strip `null` nel score JSON compare).

## Tabella

| run | first (score) | final | recompiles | note |
|-----|-------------:|------:|-----------:|------|
| run-01 | 27/27 | 27/27 | 0 | primo score 18/27 era harness (`code:null`); dopo strip null → 27/27 |
| run-02 | 27/27 | 27/27 | 0 | |
| run-03 | 27/27 | 27/27 | 0 | |
| run-04 | 27/27 | 27/27 | 0 | |
| run-05 | 27/27 | 27/27 | 0 | integrity mismatch post-compile (orchestrator scrisse baseline helper); score OK |

First full-pass score+deps: **5/5**. missing_export: **0**.

## Lettura (vs EXPECTATIONS)

Cerimonia C# + regole chiuse: ancora **facili** sotto Spec+contract (**5/5**). Serve baseline csharp per vedere se A-ISL discrimina vs prompt unico.
