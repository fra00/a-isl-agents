# Aspettative serie tariffe-v2 (scritte PRIMA delle 5 compile)

Modello serie: dichiarato in `series.json` (unica fonte).  
Isolamento oracle: **prompt-only** (non FS-enforced). Integrity cattura scritture fuori bin/build/results.

## Come leggerò il risultato

| Esito | Lettura |
|-------|---------|
| 5/5 a 26/26, zero ricompilazioni | La v2 non discrimina → passare alla v3 |
| Fallimenti sugli stessi vettori | Spec ancora ambiguo lì **o** punto debole reale → ispezionare quel vettore |
| Fallimenti sparsi tra run | Non determinismo → misura di fiducia in una singola compile |
| Differenze first vs final | Il fix-loop fa il lavoro → costo = `recompileCount` (+ turns/tokens se misurati) |
| Run `invalidata, motivo X` | Conta nel denominatore 5 come non-pass; non riscrivere la storia come 4/4 |

## Cosa non concluderò da questa serie sola

- Che A-ISL batta un prompt unico (manca baseline).
- Parità cross-stack (manca csharp).
- Mutation score oltre il campione a mano.
