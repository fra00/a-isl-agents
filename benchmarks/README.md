# Benchmarks

Cartelle di **misura** A-ISL (non demo prodotto).

Risultati e lettura (method quality vs prompt unico): **[docs/evaluation.md](../docs/evaluation.md)**.  
Archivi replica: [tariffe-v2/results/replicas/SUMMARY.md](./tariffe-v2/results/replicas/SUMMARY.md).

| Benchmark | Ruolo | Comando |
|-----------|--------|---------|
| [tariffe](./tariffe/README.md) | Smoke pipeline / I/O (Spec con formule) | `npm run bench` dopo compile |
| [tariffe-v2](./tariffe-v2/README.md) | Valutazione intento + dipendenze (+ baseline / csharp) | `npm run bench:v2` dopo compile |
| [Evaluation write-up](../docs/evaluation.md) | Lettura risultati / claim onesti | — |
