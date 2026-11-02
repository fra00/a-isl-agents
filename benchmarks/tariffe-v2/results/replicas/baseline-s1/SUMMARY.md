# Baseline s1 — prompt unico vs A-ISL serie 2

> Cinque implementazioni da zero con **solo** `baseline/PROMPT.md` (niente `.isl.md`, niente `a-isl-compile`, niente oracle/vectors in lettura all’agente). Stesso score 27 vettori + `check-deps` sintattico della serie 2.

## Tabella

| run | first (score) | final | recompiles | note |
|-----|-------------:|------:|-----------:|------|
| run-01 | 27/27 | 27/27 | 0 | |
| run-02 | 27/27 | 27/27 | 0 | |
| run-03 | 27/27 | 27/27 | 0 | |
| run-04 | 27/27 | 27/27 | 0 | formula `roundToCents` diversa (`* to/from`) ma vettori passano |
| run-05 | 27/27 | 27/27 | 0 | |

First full-pass: **5/5**. Forma export: **0** missing_export.

## Confronto vs serie 2 (A-ISL)

| metrica | baseline-s1 | series-2 (A-ISL) |
|---------|------------:|-----------------:|
| first full-pass | 5/5 | 5/5 |
| final full-pass | 5/5 | 5/5 |
| mediana first passed | 27 | 27 |
| missing_export | 0/5 | 0/5 |
| recompiles tipiche | 0 | 0 (1 verify-only su run-04) |

## Lettura (vs EXPECTATIONS)

Baseline ≈ A-ISL su questo compito chiuso: **nessuna discrimination**. Il prompt unico con contratto export/file già forza la forma; la logica regole chiuse resta facile anche senza Spec. A-ISL non perde, ma **non guadagna** score qui.

Prossimo valore: compito più duro (ambiguità / hold-out più cattivi / stack `csharp`), non rifinire v2 o baseline sullo stesso oracle.
