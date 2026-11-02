# Aspettative — Serie 2 (post riapertura freeze)

Scritte **prima** delle compile. Freeze: export named obbligatori + vettore `pen-grace-plus-cap` (27 totali).

## Come leggerò il risultato

| Esito | Lettura |
|-------|---------|
| 5/5 first a 27/27, 0 ricompile | Correzione export regge; sulla logica v2 ancora troppo facile → baseline / csharp / v3 |
| First-fail solo di **forma** (missing_export) | Correzione stack/skill insufficiente |
| First-fail di **logica** (wrong_answer) | Segnale nuovo di difficoltà / ambiguità residua |
| first ≠ final | Fix-loop; riportare `recompileCount` |
| Invalidata (integrity) | Conta nel denominatore 5 come non-pass |

Serie 1 resta in `series-1/` e **non** è confrontabile numericamente (freeze diverso).
