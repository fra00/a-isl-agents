# Serie 1 (storica) — tariffe-v2 2026-11-01

> Cinque compile `react-js` da zero: **4/5** al primo tentativo (26/26), **5/5** dopo al più una ricompilazione. L’unico fallimento di *first* era di **forma** (export `default` factory invece di named), non di logica, ed era **invisibile al verify** generato. Sulla logica 5/5 bin a 26/26. Stesso agente Spec/oracolo/vettori; modello dichiarato `composer` con `subagentModelExplicit: false` (non verificabile); mutazioni a mano con molte **non applicabili** (patch testuali).

## First per tipo

| run | first | tipo fallimento first | final | recompiles |
|-----|------:|----------------------|------:|-----------:|
| run-01…04 | 26/26 | — | 26/26 | 0 |
| run-05 | 0/26 | **forma** (`missing_export`) | 26/26 | 1 |

First full-pass logica: **5/5**. First full-pass incl. forma: **4/5**.

## Cosa non concludere

- La serie non “discrimina” sulla correttezza delle regole chiuse (26/26 stabile sulla logica).
- Mutazioni `error`/`patch noop` ≠ survived → vedi mutazioni ricalcolate con `applied` se rieseguite.

Freeze all’epoca: vettori senza `pen-grace-plus-cap`; stack ammetteva ancora default-export factory.
