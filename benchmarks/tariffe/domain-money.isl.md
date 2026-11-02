# Project: Bench Tariffe Smoke

Integer money helpers: half-away rounding and basis-point application. JSON-only I/O; amounts are cents within MAX_SAFE_INTEGER.

**Version**: 1.0.0
**ISL Version**: 1.6.2
**Created**: 2026-11-01
**Implementation**: ./domain-money

---

## Domain Concepts

### MoneyOk

Successful money result wrapper.

- **Identity**: Discriminated by `ok: true`.
- **Properties**:
  - `ok`: Boolean (required; always true)
  - `value`: Number (optional; integer at target scale for rounding)
  - `cents`: Number (optional; integer cents for applyBps)

## Component: domainMoney

### Role: Domain

**Signature**: domainMoney()

### ⚡ Capabilities

#### roundHalfAwayFromZero

- **Contract**: Rounds `scaled / 10^fromScale` to an integer at `toScale` using **half away from zero** (not half-toward-+∞). Examples at fromScale=1,toScale=0: scaled `25` → value `3` (2.5→3); scaled `-25` → value `-3` (−2.5→−3). All fields are JSON numbers; `scaled` and result MUST stay within `Number.MAX_SAFE_INTEGER`.
- **Signature**: roundHalfAwayFromZero(input: { scaled: Number, fromScale: Number, toScale: Number }): { ok: true, value: Number }
- **Flow**:
  1. Interpret `scaled` as an integer numerator with scale `fromScale`.
  2. Convert to target scale `toScale` with half-away-from-zero.
  3. RETURN `{ ok: true, value }` as a safe integer.

#### applyBps

- **Contract**: Computes `cents * bps / 10000` with half-away-from-zero to integer cents. `bps` is integer basis points (`125` = 1.25%). No binary float rates.
- **Signature**: applyBps(input: { cents: Number, bps: Number }): { ok: true, cents: Number }
- **Flow**:
  1. Multiply cents by bps.
  2. Divide by 10000 with half-away-from-zero.
  3. RETURN `{ ok: true, cents }`.

### 🚨 Constraints

- MUST NOT use IEEE float rates in the public contract (bps integers only).
- MUST NOT throw for in-range inputs; wire errors use `{ ok: false, code }` only if extended later.
- Inputs and outputs MUST be JSON-serializable numbers within MAX_SAFE_INTEGER.

### ✅ Acceptance Criteria

- [ ] 2.5 rounds to 3; −2.5 rounds to −3 (half away from zero).
- [ ] applyBps(10000, 125) yields 125 cents.

### 🧪 Test Scenarios

1. **Half positive** `id: money-half-pos`
   - Call: roundHalfAwayFromZero
   - Input: scaled 25, fromScale 1, toScale 0
   - Expected: `{ ok: true, value: 3 }`

```json
{ "input": { "scaled": 25, "fromScale": 1, "toScale": 0 }, "expected": { "ok": true, "value": 3 } }
```

2. **Half negative** `id: money-half-neg`
   - Call: roundHalfAwayFromZero
   - Input: scaled -25, fromScale 1, toScale 0
   - Expected: `{ ok: true, value: -3 }`

```json
{ "input": { "scaled": -25, "fromScale": 1, "toScale": 0 }, "expected": { "ok": true, "value": -3 } }
```

3. **Apply 125 bps** `id: money-bps-125`
   - Call: applyBps
   - Input: cents 10000, bps 125
   - Expected: `{ ok: true, cents: 125 }`

```json
{ "input": { "cents": 10000, "bps": 125 }, "expected": { "ok": true, "cents": 125 } }
```
