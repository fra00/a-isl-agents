# Two-agent workflow

Start here if you are new: [What is A-ISL](./what-is-a-isl.md) · [Why A-ISL](./why-a-isl.md).  
Hands-on: [Tutorial: first project](./tutorial-first-project.md).  
Technical flow: [How it works](./how-it-works.md).  
Day-to-day: [Guide: working with the skills](./guide-using-skills.md).

```text
Human  ↔  a-isl-spec-author  →  *.isl.md
Human  →  (switches agent when ready)
Human  ↔  a-isl-compile      →  builder / queue / bin-<stack>/ (+ tests) / lock
Human  →  (optional) npm run verify
```

## Spec Agent (`a-isl-spec-author`)

- Input: natural language intent
- Output: valid `.isl.md` only
- Context: `docs/isl-agent-profile.md`, optionally `vendor/isl-spec/`
- Gate: lint (`npm run lint -- <file>`)
- Decide verify-eligible Test Scenarios (`id` + `Call`) when a surface should be tested — see [EXT-001](./isl-extensions.md#ext-001-spec--compile-tests--verify)

## Human gate

The human reviews ISL and **switches** the active skill/agent. A-ISL does not auto-orchestrate Spec → Compile.

**La modifica alla bin viene fatta solo tramite compile e solo ovviamente su richiesta dell'utente.**

- Spec Agent / Spec phase: `*.isl.md` only — never write `bin-*`.
- Compile Agent: write `bin-<stack>/` only after an **explicit** human compile request (`compila`, `/a-isl-compile`, regenerate bin, etc.).
- Do not auto-compile after Spec or UX edits “to finish the loop”.

## Compile Agent (`a-isl-compile`)

Low-token default:

1. `npm run preflight -- --root <project>` (structure/graph/lint — not bin correctness)
2. `npm run builder -- <project>` (once)
3. Loop: `npm run queue -- --root <project> --next` → `npm run packet -- --root <project> --build-file …` → if eligible scenarios: write **test file then** impl under `bin-<stack>/`
4. Batch `npm run lock -- --root <project> --build-file …` (multiple flags OK)
5. Optional: `npm run verify -- --root <project> --stack <id>` → `build/verify-status.json` (does not change lock)

Escalate to full `.build.md` / dep bins only per the skill table. If requirements are unclear, stop and send the human back to Spec Author. On verify fail: fix impl via Compile, or return to Spec if scenarios are wrong — do not rewrite tests to match a bad bin.

## What A-ISL is not

- Not a language fork (ISL remains upstream)
- Not the paid VS Code / API Generator pipeline
- Not an MCP multi-agent orchestrator (human still switches)
