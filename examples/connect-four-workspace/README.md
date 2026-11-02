# Connect Four workspace (A-ISL demo)

Hot-seat **Connect Four** with a pure rules engine: legal columns, gravity drops, win/draw detection. Illegal moves fail closed with `@MoveErrorCode`.

## NL brief

> 6×7 board. Players red and yellow alternate. Click a column to drop a disc to the lowest empty slot. Four in a row (horizontal/vertical/diagonal) wins; full board without four is a draw. Full columns and moves after game-over are rejected with explicit errors. Reset starts a new match.

## Modules

| File | Role |
|------|------|
| `domain-game.isl.md` | Domain |
| `board-rules.isl.md` | Business Logic |
| `game-service.isl.md` | Backend |
| `use-game.isl.md` | Business Logic |
| `board-view.isl.md` | Presentation |
| `game-hud.isl.md` | Presentation |
| `app-shell.isl.md` | Presentation |

## Why this showcases A-ISL

- `board-rules` is pure and testable without React
- Service refuses illegal moves before mutating state
- Changing win length or gravity → Spec change + recompile rules/service only

## Smoke

```bash
npm run lint -- examples/connect-four-workspace/domain-game.isl.md
npm run builder -- examples/connect-four-workspace
npm run queue -- --root examples/connect-four-workspace --json
```

Compile with skill `a-isl-compile` when Spec is accepted.

## Run demo

```bash
cd examples/connect-four-workspace
npm install
npm run dev
```

Vite serves `demo/` against `bin/` (default port **5176**).
