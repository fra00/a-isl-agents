# Change and fix via Spec

Greenfield flow: [Tutorial: first project](./tutorial-first-project.md).  
This page is the **evolution** path: change product behavior or repair a bad compile **without** hand-editing `bin-*`.

## Principle

| Do | Do not |
|----|--------|
| Change intent in `.isl.md` (Spec Author) | Patch `bin-<stack>/` as the main fix |
| Review Spec again ([Review without knowing ISL](./review-spec.md)) | Auto-chain Spec → Compile |
| Explicit Compile, preferably **`--only`** on affected units | Regenerate the whole tree “just in case” every time |

Wrong Spec that already compiled → fix Spec, then recompile. Wrong `bin` with good Spec → Compile repair on those units. Bad test scenarios → Spec Author (do not weaken tests to match a bad impl).

## 1. Describe the change (Spec)

```text
/a-isl-spec-author

In projects/<name>-workspace (or an examples/ demo), change: <product rule in plain language>.
Update only the Spec units that own this behavior.
Spec only — do not compile.
```

Examples:

- “Late penalty grace must be exclusive (charge when lateDays equals grace).”
- “Decrement must not go below zero; show error code `below_zero`.”
- “Void is only allowed from `paid`, not from `issued`.”

## 2. Review

Use the [product checklist](./review-spec.md). Lint if useful:

```bash
npm run lint -- <workspace>/<file>.isl.md
```

## 3. Compile only what changed

Lock skips unchanged units. To force the units that own the change:

```text
/a-isl-compile

Recompile only <unit> [, <unit2>] in <workspace> (--stack <id>).
Use --only on queue/packet. Do not hand-edit bin.
```

CLI shape (what the Compile agent should run):

```bash
npm run preflight -- --root <workspace>
npm run builder -- <workspace>
npm run queue  -- --root <workspace> --next --only <unit> --stack <id>
npm run packet -- --root <workspace> --next --only <unit> --stack <id>
# … write bin, then lock …
```

Details: [Targeted recompile (`--only`)](./guide-using-skills.md#targeted-recompile---only).

If dependents must pick up a new Domain API, include them in `--only` or let build-hash churn pull them after builder.

## 4. Optional verify

```bash
npm run verify -- --root <workspace> --stack <id> --only <unit>
```

Verify is not proof the product is right — only that eligible Spec scenarios pass. Series-1 lesson: verify can be green while score fails on **shape** (exports). Prefer fixing Spec/stack contract over patching tests to match a bad bin.

## Bugfix (symptoms in the running app)

1. Reproduce in product terms (“when I pay twice…”).
2. Ask: is the Spec wrong, or is `bin` not following Spec?
3. Spec wrong → Spec Author → review → `--only` Compile.  
   Spec OK → Compile repair with `--only` on failing units (fresh agent for heavy units).
4. Still wrong after two repair rounds → stop and re-open Spec; do not spiral in `bin/`.

## Anti-patterns

- Editing generated files under `bin-*` and never updating `.isl.md`
- Full-workspace recompile for a one-line rule change
- Softening EXT-001 tests so a broken impl “passes”
