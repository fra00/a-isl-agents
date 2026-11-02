# Agent skills (canonical)

Host-agnostic A-ISL skills. **Edit here**, then sync into IDE/agent discovery folders:

```bash
npm run sync-skills
```

| Skill | Role |
|-------|------|
| `a-isl-spec-author` | NL → `*.isl.md` only |
| `a-isl-compile` | Explicit compile → `bin-<stack>/` |
| `a-isl-bench` | Internal evaluation (tariffe-v2) |

Synced copies (do not edit by hand):

| Host | Path |
|------|------|
| Cursor | `.cursor/skills/` |
| Claude Code | `.claude/skills/` |
| GitHub Copilot | `.github/skills/` |

Runtime (`npm run builder|queue|packet|…`) is the same for every agent.

**Disclaimer:** exercised primarily with **Cursor**. `.claude/skills/` and `.github/skills/` are synced copies of the same text — **not** separately validated on Claude Code / Copilot yet.
