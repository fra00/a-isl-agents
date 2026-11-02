# Project: Bench Tariffe Smoke

Tiered quote with cascading bps discounts; round half-away **once at the end**.

**Version**: 1.0.0
**ISL Version**: 1.6.2
**Created**: 2026-11-01
**Implementation**: ./logic-quote

---

> **Reference**: roundHalfAwayFromZero semantics in `./domain-money.isl.md`.

## Component: logicQuote

### Role: Business Logic

**Signature**: logicQuote()

### ⚡ Capabilities

#### computeQuote

- **Contract**: Split `baseCents` into progressive tiers: each tier has `upToCents` (null = remainder) and `rateBps`. Price each band as `bandCents * rateBps / 10000` as an exact rational. Then apply `discountsBps` in listed order as successive factors `(10000 - bps) / 10000`. **Round half-away-from-zero only once at the end** to integer cents. Under this rule, discount order `[1000,500]` and `[500,1000]` MUST yield the same cents. Rates are integer bps only. JSON I/O only.
- **Signature**: computeQuote(input: { baseCents: Number, tiers: { upToCents: Number | null, rateBps: Number }[], discountsBps: Number[] }): { ok: true, cents: Number }
- **Flow**:
  1. Allocate baseCents across tier bands in order.
  2. Accumulate unrounded priced amount as a rational.
  3. Apply each discount factor in order without intermediate rounding.
  4. Round half-away-from-zero to integer cents; RETURN `{ ok: true, cents }`.

### ⚙ Logic & Execution Rules

- MUST round only at the end of the discount chain.
- MUST keep intermediates exact (rational / integer scaled math), not IEEE float rates.

### 🚨 Constraints

- MUST NOT reimplement Domain calendar.
- All money fields MUST remain within MAX_SAFE_INTEGER on the wire.

### ✅ Acceptance Criteria

- [ ] Exact tier threshold base equals first-tier full price.
- [ ] Discount orders AB and BA match when rounding only at end.

### 🧪 Test Scenarios

1. **Discount order AB** `id: quote-order-ab`
   - Call: computeQuote
   - Input: baseCents 1500, tiers 1000@10000bps then rest@5000bps, discounts [1000,500]
   - Expected: `{ ok: true, cents: 1069 }`

```json
{
  "input": {
    "baseCents": 1500,
    "tiers": [
      { "upToCents": 1000, "rateBps": 10000 },
      { "upToCents": null, "rateBps": 5000 }
    ],
    "discountsBps": [1000, 500]
  },
  "expected": { "ok": true, "cents": 1069 }
}
```

2. **Tier threshold** `id: quote-threshold`
   - Call: computeQuote
   - Input: baseCents 1000, same tiers, no discounts
   - Expected: `{ ok: true, cents: 1000 }`

```json
{
  "input": {
    "baseCents": 1000,
    "tiers": [
      { "upToCents": 1000, "rateBps": 10000 },
      { "upToCents": null, "rateBps": 5000 }
    ],
    "discountsBps": []
  },
  "expected": { "ok": true, "cents": 1000 }
}
```
