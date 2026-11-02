# Baseline csharp s1 — prompt unico vs A-ISL series-csharp

> Cinque implementazioni da `baseline/PROMPT-csharp.md` solo. Stesso score 27 vettori. Modello `composer` dichiarato.

## Tabella

| run | first | final | recompiles | first-fail note |
|-----|------:|------:|-----------:|-----------------|
| run-01 | 26/27 | 27/27 | 2 | JsonObject Int32→Int64 |
| run-02 | 17/27 | 27/27 | 1 | JsonObject Int32→Int64 |
| run-03 | 1/27 | 27/27 | 2 | Dictionary+JsonElement cast |
| run-04 | 4/27 | 27/27 | 1 | Dictionary+JsonElement cast |
| run-05 | 27/27 | 27/27 | 0 | — |

First full-pass (27/27 + deps): **1/5**. Final full-pass: **5/5**. missing_export: **0**.

## Confronto vs series-csharp (A-ISL)

| metrica | baseline-csharp-s1 | series-csharp |
|---------|-------------------:|--------------:|
| first full-pass | **1/5** | **5/5** |
| final full-pass | 5/5 | 5/5 |
| mediana first passed | 17 | 27 |
| recompiles tipiche | 1–2 | 0 |

## Lettura

Su C# **c’è discrimination a first-compile**: A-ISL (typed records + contract) 5/5 @ 27/27; baseline spesso fallisce su **interop JSON** (JsonElement/int64), non sulle regole di business. Dopo ≤2 repair il finale converge a 27/27 — A-ISL guadagna su *forma/stack*, non su logica chiusa (come già visto in JS).
