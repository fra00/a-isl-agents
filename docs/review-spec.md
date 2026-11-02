# Review a Spec without knowing ISL

You do **not** need ISL grammar to accept a Spec. You need to decide whether the **product behavior** written there matches what you want. A-ISL will compile that intent faithfully — including mistakes. See [Who decides what](./what-is-a-isl.md#who-decides-what-responsibility).

After Spec Author finishes, skim every new or changed `.isl.md` and answer the questions below in plain language. If something is wrong or missing, stay on **`a-isl-spec-author`** and say what to change. Do **not** compile until you would bet on this behavior.

## Product checklist

Ask yourself (and ask the agent to adjust if the answer is “no” or “unclear”):

1. **Actors / users** — Who uses this? What can each do?
2. **Happy path** — What happens when everything goes right, step by step?
3. **Forbidden / edges** — What must never happen? (e.g. balance below zero, pay twice, edit after void)
4. **Errors** — When something fails, what does the user/system see? Named codes or messages?
5. **States** — Are there modes or statuses (draft / issued / paid…)? Which transitions are allowed?
6. **Data** — What is stored or shown? Units (cents, dates, ids)? What is optional?
7. **Rules that interact** — Discounts then floor? Grace then penalty? Order matters — is it stated?
8. **Out of scope** — What are you *not* building in this change? Say so if the Spec invents extras.
9. **Acceptance** — Could you check the finished app against the Spec’s acceptance / scenarios without reading code?

If you cannot answer these from the Spec text alone, the Spec is not ready.

## What to glance at in the file (no grammar required)

You can ignore most markup. Look for readable blocks:

| Look for | Why |
|----------|-----|
| Short description at the top | Is this the module you asked for? |
| **Capabilities** / named operations | Are the verbs the product needs? |
| **Constraints** / MUST / MUST NOT | Do these match your rules? |
| **Acceptance** / checklist items | Would you sign off on these? |
| **Test scenarios** (if present) | Do they cover the edges you care about? |
| Links to other units (`Reference`) | Does the split Domain / Logic / UI make sense? |

Lint (`npm run lint -- <file.isl.md>`) checks structure, not product sense.

## Ambiguity

If your NL ask omitted a detail, Spec Author may pick a default. That default appears in `.isl.md` — revise it before Compile. Guessing in Spec is cheaper than guessing only in `bin/`.

## After you accept

Explicit Compile only. Targeted updates later: [Change and fix via Spec](./change-via-spec.md).
