# Serie 2 — tariffe-v2 (post named-export + pen-grace-plus-cap)

> Cinque compile `react-js` da zero: **5/5** al primo tentativo sullo score (**27/27**), **5/5** al finale. Nessun fallimento di logica né di export named. Una ricompile (run-04) solo per import `vitest` nei test EXT-001 (verify), non per lo score. Stesso agente Spec/oracolo/vettori; modello `composer` dichiarato non verificabile (`subagentModelExplicit: false`); isolamento oracle prompt-only; `dependencyUsage` sintattico.

## Tabella

| run | first (score) | final | recompiles | note |
|-----|-------------:|------:|-----------:|------|
| run-01 | 27/27 | 27/27 | 0 | |
| run-02 | 27/27 | 27/27 | 0 | |
| run-03 | 27/27 | 27/27 | 0 | |
| run-04 | 27/27 | 27/27 | 1 | verify: missing vitest import → riparati i test |
| run-05 | 27/27 | 27/27 | 0 | |

First full-pass score+deps: **5/5**. Forma export: **0** missing_export.

## Mutazioni (hand, solo applied)

- applied killed: **10/10**
- `grace exclusive` / `void from issued`: killed 5/5
- `applyBps floor`, `ignore holidays`, `floor before discounts`: **non_applicabile** 5/5 (patch testuali non portabili)

## Lettura (vs EXPECTATIONS)

Correzione named-export **regge** (niente factory default). Sulla logica regole chiuse: ancora **facili** (5/5 a 27/27). Prossimo valore: baseline prompt unico e/o `csharp`, non rifinire la v2.

Serie 1 (storica, freeze diverso): `series-1/`.
