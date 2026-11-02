# Project: Bench Tariffe Smoke

Late penalty: principal × days × rateBpsPerDay / 10000, half-away, optional cap.

**Version**: 1.0.0
**ISL Version**: 1.6.2
**Created**: 2026-11-01
**Implementation**: ./logic-penalty

---

> **Reference**: half-away and bps semantics in `./domain-money.isl.md`.

## Component: logicPenalty

### Role: Business Logic

**Signature**: logicPenalty()

### ⚡ Capabilities

#### computePenalty

- **Contract**: IF `daysLate <= 0` RETURN `{ ok: true, cents: 0 }`. ELSE compute `principalCents * daysLate * rateBpsPerDay / 10000` with half-away-from-zero to integer cents; IF `capCents` is non-null, clamp result to `capCents`. Rates are integer bps per day. JSON only; no throws.
- **Signature**: computePenalty(input: { principalCents: Number, daysLate: Number, rateBpsPerDay: Number, capCents: Number | null }): { ok: true, cents: Number }
- **Flow**:
  1. IF daysLate ≤ 0: RETURN zero cents.
  2. Multiply and round half-away.
  3. Apply optional cap; RETURN.

### 🚨 Constraints

- MUST use integer bps (no float 0.0125).
- Wire values MUST stay within MAX_SAFE_INTEGER.

### ✅ Acceptance Criteria

- [ ] Zero days → 0.
- [ ] Cap clamps large penalties.

### 🧪 Test Scenarios

1. **Zero days** `id: pen-zero-days`
   - Call: computePenalty
   - Input: principal 100000, daysLate 0, rate 10 bps/day, cap 5000
   - Expected: `{ ok: true, cents: 0 }`

```json
{
  "input": {
    "principalCents": 100000,
    "daysLate": 0,
    "rateBpsPerDay": 10,
    "capCents": 5000
  },
  "expected": { "ok": true, "cents": 0 }
}
```
