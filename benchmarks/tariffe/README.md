# Benchmark: tariffe (smoke)

Misura interna A-ISL: Spec → compile → test automatici.

## Cosa fare

Dalla **root del repo**:

```text
1. Compila   →  /a-isl-compile benchmarks/tariffe
2. Misura    →  npm run bench
```

## Limiti di questo smoke

Lo smoke valida la **pipeline** e il **contratto di nomi/I/O** su regole numeriche **esplicite**.  
**Non** valuta la capacità di A-ISL di tradurre requisiti ambigui o di mantenere coerenza tra unità: gli Spec contengono già l’algoritmo.

Per quello c’è il livello successivo: [`../tariffe-v2`](../tariffe-v2/README.md).

## Cosa c’è dentro

| Cartella/file | Ruolo |
|---------------|--------|
| `*.isl.md` | Spec (formule esplicite — intenzionale per smoke) |
| `bin-react-js/` | Codice dopo compile |
| `oracle/vectors.json` | Esame congelato |
| `results/reference-report.json` | Report di riferimento |

Sta in `benchmarks/`, non in `examples/`.
