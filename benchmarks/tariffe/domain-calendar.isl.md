# Project: Bench Tariffe Smoke

Business-day calendar using `YYYY-MM-DD` strings and ordinal day arithmetic (no local Date timezone).

**Version**: 1.0.0
**ISL Version**: 1.6.2
**Created**: 2026-11-01
**Implementation**: ./domain-calendar

---

## Component: domainCalendar

### Role: Domain

**Signature**: domainCalendar()

### ⚡ Capabilities

#### addBusinessDays

- **Contract**: From `start` (`YYYY-MM-DD`), advance by `n` business days (Mon–Fri excluding `holidays` string array). `n === 0` RETURNS `start` unchanged. Positive `n` moves forward; counting skips weekends and holiday dates. I/O is pure JSON strings/numbers/arrays.
- **Signature**: addBusinessDays(input: { start: String, n: Number, holidays: String[] }): { ok: true, date: String }
- **Flow**:
  1. IF `n` is 0: RETURN `{ ok: true, date: start }`.
  2. Walk day-by-day; decrement remaining only on Mon–Fri dates not listed in `holidays`.
  3. RETURN the resulting `YYYY-MM-DD`.

### 🚨 Constraints

- MUST NOT use timezone-dependent local `Date` formatting for the contract result.
- Holiday matching MUST be exact `YYYY-MM-DD` string equality.

### ✅ Acceptance Criteria

- [ ] From Saturday +1 business day lands on Monday.
- [ ] `n=0` returns the start date.

### 🧪 Test Scenarios

1. **From Saturday** `id: cal-from-sat`
   - Call: addBusinessDays
   - Input: start 2024-01-06, n 1, holidays include 2024-01-01
   - Expected: `{ ok: true, date: "2024-01-08" }`

```json
{
  "input": {
    "start": "2024-01-06",
    "n": 1,
    "holidays": ["2024-01-01", "2024-12-25", "2024-07-04"]
  },
  "expected": { "ok": true, "date": "2024-01-08" }
}
```
