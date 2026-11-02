# Replica summary — tariffe-v2

## Serie 2 — A-ISL react-js

> **5/5** first @ **27/27**. Named-export fix regge. Logica chiusa facile.

Dettaglio: `series-2/`.

## Baseline s1 — prompt unico react-js

> **5/5** @ **27/27** — parità con serie 2. Nessuna discrimination su JS.

Dettaglio: `baseline-s1/SUMMARY.md`.

## Serie csharp — A-ISL

> **5/5** first @ **27/27**, 0 missing_export, 0 ricompile score. Contratto `csharp-api-contract.md`.

Dettaglio: `series-csharp/SUMMARY.md`.

## Baseline csharp s1 — prompt unico (open DTO)

| run | first | final | recompiles |
|-----|------:|------:|-----------:|
| run-01 | 26/27 | 27/27 | 2 |
| run-02 | 17/27 | 27/27 | 1 |
| run-03 | 1/27 | 27/27 | 2 |
| run-04 | 4/27 | 27/27 | 1 |
| run-05 | 27/27 | 27/27 | 0 |

First full-pass: **1/5**. Final: **5/5**. Dettaglio: `baseline-csharp-s1/SUMMARY.md`.

## Baseline csharp s2 — prompt + record DTO rule

> **5/5** first @ **27/27**, 0 repairs. Stesso prompt di s1 più “prefer record DTOs”.

Dettaglio: `baseline-csharp-s2/SUMMARY.md`.

## Confronto csharp

| metrica | s1 open DTO | s2 + record rule | A-ISL series-csharp |
|---------|------------:|-----------------:|--------------------:|
| first full-pass | **1/5** | **5/5** | **5/5** |
| final full-pass | 5/5 | 5/5 | 5/5 |
| mediana first | 17 | 27 | 27 |

**Verdetto — regression check, non leaderboard.** Su JS Spec→Compile **pareggia** il prompt (5/5): esito atteso su task chiuso piccolo. Su C# il gap s1 (1/5) era **DTO guidance**; con la regola record (s2) first-pass **5/5** come A-ISL. Il vantaggio di prodotto lo cerchiamo su **progetti grandi / multi-modulo** e **change-via-Spec** — **non dimostrato** da questo bench.

Serie 1 (storica): `series-1/`.
