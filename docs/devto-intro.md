# Spec → Compile for coding agents: A-ISL (experimental)

Draft for [DEV](https://dev.to). Repo: [fra00/a-isl-agents](https://github.com/fra00/a-isl-agents).

**Tags:** `ai`, `agents`, `specdriven`, `cursor`, `opensource`

---

I got tired of two extremes: **one-shot prompts** that disappear into the chat, and **hand-written specs** nobody maintains.

**A-ISL** is an experiment in the middle: you describe the product in natural language; a coding agent writes a **reviewable Spec** in classic [ISL](https://github.com/fra00/isl-specification) (`.isl.md`); you accept it; then you **explicitly** ask another skill to **compile** that Spec into `bin-<stack>/` (React, Blazor, WinForms, C# library, …).

### The agentic part (easy to miss)

You do **not** hand-author ISL or the app.

1. Skill **`a-isl-spec-author`** → agent writes `*.isl.md` only  
2. You review (product sense first — you don’t need to know the grammar)  
3. Skill **`a-isl-compile`** → agent regenerates `bin-<stack>/` via a small runtime (builder → queue → packet → lock)

Spec never auto-chains into `bin/`. That’s the whole point: **human gate**, not autopilot.

Same Spec can compile to more than one stack without rewriting intent (see the sheet demo).

### Who decides what

A-ISL does **not** invent the product. You decide behavior and accept the Spec. Wrong Spec that compiles is still “faithful.” That boundary is intentional.

### What we measured

Internal bench (`tariffe-v2`, closed Domain/Logic rules, N=5):

| Campaign | Stack | First full-pass | Final |
|----------|-------|----------------:|------:|
| A-ISL | react-js | 5/5 | 5/5 |
| Single prompt | react-js | 5/5 | 5/5 |
| A-ISL | csharp | 5/5 | 5/5 |
| Prompt (open DTO style) | csharp | **1/5** | 5/5 |
| Prompt + same “prefer records” rule | csharp | **5/5** | 5/5 |

**Regression check, not a leaderboard.** On a small closed-rules task, Spec → Compile matches a single prompt (5/5 vs 5/5 on JS). On C#, a prompt that left DTO style open dropped to 1/5 on first pass; adding the same “prefer records” rule closed the gap. That is why we look for product advantage on **large / multi-module projects** and **change-via-Spec** — the intended payoff of the workflow. **This bench does not demonstrate that**; it only supports non-regression on a small closed oracle.

Full honesty: [evaluation.md](https://github.com/fra00/a-isl-agents/blob/main/docs/evaluation.md).

### Hosts

Runtime is agent-agnostic. Skills ship for Cursor, Claude Code, and GitHub Copilot (same text, synced). Day-to-day use and the bench were on **Cursor**; other hosts are not separately tested yet.

### When it might pay off

Modules, evolution via Spec, multi-stack. For a one-shot script, a normal prompt is enough — Spec→Compile costs more turns on purpose.

### Try it

```bash
git clone https://github.com/fra00/a-isl-agents.git
cd a-isl-agents && npm install && npm --prefix runtime/lint install
# open in your agent → /a-isl-spec-author → review → /a-isl-compile
```

Tutorial: [docs/tutorial-first-project.md](https://github.com/fra00/a-isl-agents/blob/main/docs/tutorial-first-project.md)
