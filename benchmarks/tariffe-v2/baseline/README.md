# Baseline (prompt unico)

Stesso oracolo/vettori/call-map della v2 A-ISL, **senza** Spec `.isl.md` e senza `/a-isl-compile`.

## Protocollo (react-js)

1. Prompt frozen: `PROMPT.md` (regole + export obbligatori).
2. L’agente scrive solo `baseline/bin-react-js/`.
3. Misura: `node ../bench/score.mjs --bin <abs>/baseline/bin-react-js` + `check-deps.mjs --bin …`.
4. N run da zero (wipe `bin-react-js` ogni volta); archivio in `../results/replicas/baseline-s1/`.

Confronto legittimo solo vs **serie 2** A-ISL (stesso freeze vettori 27).

## C# ablations

| Series | Prompt | Archive |
|--------|--------|---------|
| `baseline-csharp-s1` | `PROMPT-csharp.md` **without** forced record DTOs (historical; API surface only) | `../results/replicas/baseline-csharp-s1/` |
| `baseline-csharp-s2` | same prompt **plus** “prefer `record` DTOs / no JsonObject·Dictionary as API” (same rule as `bench/csharp-api-contract.md`) | `../results/replicas/baseline-csharp-s2/` |

```bash
node wipe-bin-csharp.mjs --run-id run-0K --series-dir baseline-csharp-s2
# agent implements under baseline/bin-csharp from PROMPT-csharp.md
node ../bench/score.mjs --stack csharp --bin <abs>/baseline/bin-csharp
node archive-run-csharp.mjs --run-id run-0K --series-dir baseline-csharp-s2 \
  --pass-first N --pass-final N --total 27 --recompile-count K
```
