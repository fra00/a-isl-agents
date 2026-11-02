# Baseline csharp s2 — prompt + record DTO rule

> Cinque implementazioni da `baseline/PROMPT-csharp.md` **con** “prefer `record` DTOs / no JsonObject·Dictionary as API” (allineato a `bench/csharp-api-contract.md`). Nessuna Spec / a-isl-compile. Stesso score 27 vettori. Modello `composer` dichiarato. Ablazione vs [baseline-csharp-s1](../baseline-csharp-s1/SUMMARY.md) (API surface senza regola DTO).

## Tabella

| run | first | final | recompiles | first-fail note |
|-----|------:|------:|-----------:|-----------------|
| run-01 | 27/27 | 27/27 | 0 | — (records) |
| run-02 | 27/27 | 27/27 | 0 | — (records) |
| run-03 | 27/27 | 27/27 | 0 | — (records) |
| run-04 | 27/27 | 27/27 | 0 | — (records) |
| run-05 | 27/27 | 27/27 | 0 | — (records) |

First full-pass (27/27 + deps): **5/5**. Final full-pass: **5/5**. missing_export: **0**.

## Confronto

| metrica | baseline-csharp-s1 (open DTO) | baseline-csharp-s2 (record rule) | series-csharp (A-ISL) |
|---------|-----------------------------:|---------------------------------:|----------------------:|
| first full-pass | **1/5** | **5/5** | **5/5** |
| final full-pass | 5/5 | 5/5 | 5/5 |
| mediana first passed | 17 | 27 | 27 |
| recompiles tipiche | 1–2 | 0 | 0 |

## Lettura

**Regression check, non leaderboard.** Incollare la regola record-DTO nel prompt singolo porta il first-pass al livello di A-ISL (**5/5**): il gap vs s1 era **guida DTO**, non Spec→Compile sulla logica chiusa. Il vantaggio di prodotto lo cerchiamo su **progetti grandi** e **change-via-Spec** — **non dimostrato** da questo oracle. A-ISL resta distinto per Spec reviewabile / multi-stack / evolution.
