# Dungeon workspace (A-ISL showcase)

Full **dungeon crawler** Spec ported from upstream ISL (`ISLSpecification/example/dungeon`): turn-based map, combat, fog of war, inventory, magic, campaign flow, and React-oriented Presentation units.

**Stack target: `react-js` only.** This Spec was written for a React UI. Other stacks (e.g. Blazor) are not part of this showcase.

## What it shows

- Large module DAG (domain + many Logic hooks + Presentation)
- Non-trivial game rules still expressed as reviewable `.isl.md`
- Scale beyond sheet / Connect Four — same Spec → Compile workflow

## Scope in this repo

- **Included:** `*.isl.md` (intent) + static **`public/`** assets + compiled **`bin-react-js/`** + Vite **`demo/`** host
- Demo serves `public/` via Vite `publicDir: ../public` (tiles, portraits, audio, map JSON, …)

## Run the demo

```bash
cd examples/dungeon-workspace
npm install
npm run dev
```

Opens on [http://localhost:5177](http://localhost:5177) by default.

## Compile again (if Spec changes)

```text
/a-isl-compile
Compile examples/dungeon-workspace with --stack react-js
```

```bash
npm run queue  -- --root examples/dungeon-workspace --next --stack react-js
npm run packet -- --root examples/dungeon-workspace --next --stack react-js
```

Stack flag reference: [Choosing the stack](../../docs/guide-using-skills.md#choosing-the-stack---stack).

Upstream already had a working React `bin/`; here the point is A-ISL Spec → agent compile, not copying generated JS.

## Smoke (Spec / graph)

```bash
npm run lint -- examples/dungeon-workspace/domain-core.isl.md
npm run builder -- examples/dungeon-workspace
npm run queue -- --root examples/dungeon-workspace --json
```

## Origin

ISL source: local `ISLSpecification/example/dungeon` (classic ISL example). Language: [fra00/isl-specification](https://github.com/fra00/isl-specification).
