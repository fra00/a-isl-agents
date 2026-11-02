# Tutorial: first project

Prerequisites: [Getting started](./getting-started.md).  
More detail: [How it works](./how-it-works.md) · [Guide: skills](./guide-using-skills.md) · [Workflow](./workflow.md).

## 1. Spec

Invoke **`a-isl-spec-author`** and say what you want in plain language, for example:

```text
/a-isl-spec-author

Create a simple counter under projects/counter-workspace.
Value starts at 0. Increment, Decrement (not below 0), Reset.
Spec only — do not compile.
```

New work lives in [`projects/`](../projects/README.md). Official demos stay under `examples/`.

Wait until the agent finishes the `.isl.md` files.

## 2. Review

Use the product checklist in [Review a Spec without knowing ISL](./review-spec.md). If something is wrong, stay on Spec Author and say what to change. Do not compile until you accept the intent.

## 3. Compile

Invoke **`a-isl-compile`** and ask explicitly:

```text
/a-isl-compile

Compile projects/counter-workspace
```

When it finishes, you have `projects/counter-workspace/bin-react-js/` (default stack). Other stacks use `bin-<stackId>/`.

## 4. (Optional) Run a UI

Mirror `examples/connect-four-workspace/demo/` into your project to mount `bin-react-js/app-shell`, then `npm install` && `npm run dev` there. See [Guide: working with the skills](./guide-using-skills.md#optional-demo-ui).

## 5. Change later

Do not hand-edit `bin-*`. Prefer Spec → review → targeted Compile:

→ Full guide: [Change and fix via Spec](./change-via-spec.md) (`--only`, bugfix, anti-patterns).
