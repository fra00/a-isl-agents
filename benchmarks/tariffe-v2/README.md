# Benchmark: tariffe v2 (intento + dipendenze)

Livello **valutazione generazione**, non solo pipeline.

> **Serie 2** (freeze post named-export): 5/5 first score **27/27**, 0 missing_export; 1 ricompile solo per import vitest nei test (run-04). Logica chiusa ancora facile. Modello `composer` dichiarato non verificabile.  
> **Serie 1** (`series-1/`): 4/5 first mescolando forma+logica; fallimento = export default (verify verde / score rosso).

## Riapertura freeze (post serie 1)

Dopo la serie 1 il freeze è **riaperto** di proposito:

1. **Export named obbligatori** per Domain/Logic in `stacks.config.ts` + skill compile (test EXT-001 importano `{ Call }`, allineati a `call-map` quando presente).
2. Hold-out **`pen-grace-plus-cap`** (grace+1 con cap).
3. Mutazioni: stati `killed` / `survived` / `non_applicabile` (solo *applied* nel kill rate).

Serie 1 **non è confrontabile** numericamente con le serie successive (vettori e regole stack cambiati). Motivo: correggere difetti di misura emersi dalla serie 1, non “migliorare il punteggio”.

## Cosa misura (e cosa no)

| Misura | Sì / no |
|--------|---------|
| Aderenza a **regole chiuse** (A1–A3) | sì |
| Convenzione export named (post-riapertura) | sì (stack + score) |
| Hold-out frozen vs bin | sì |
| Import + forbid bps inline | sì (`dependencyUsage`, sintattico) |
| Call-site Domain corretto | no |
| Ambiguità aperta | no |
| Hold-out senza Spec | no |

Isolamento oracle nelle repliche: **prompt-only** (non sandbox FS). Integrity su workspace tranne `bin-react-js/`, `build/`, `results/`.

## Flusso

```text
1. Compila   →  /a-isl-compile benchmarks/tariffe-v2
2. Misura    →  npm run bench:v2
3. Serie N   →  /a-isl-bench
```

## Unità (DAG)

```text
domain-money → logic-quote ─┐
domain-calendar → logic-penalty ─┼→ logic-invoice
logic-case-status ──────────────┘
```

## Regole locked (estratto)

Money half-away; quote scaglioni cumulativi + floor dopo sconti; penale grace inclusiva + dayFee×excess + cap post-round; calendario `(from, to]`; invoice: transizione prima della penale.

## Script

| Script | Ruolo |
|--------|--------|
| `npm run bench:v2` | selfcheck → verify → deps → score |
| `npm run bench:v2:freeze` | reference-report |
| `npm run bench:v2:mutations -- --run-id …` | hand sample (`applied` only) |
| `npm run bench:v2:aggregate` | matrice frazioni |

Fatto: serie 2, baseline JS (parità), serie csharp A-ISL **5/5**, baseline csharp **1/5** first (discrimination su interop). Prossimi: doc evaluation; eventuale v3 underspec.

