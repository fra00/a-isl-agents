# Baseline prompt (NO Spec files)

Implement a small JS (ESM) library for invoicing / quotes / late penalties.

## Output layout (mandatory)

Write only under this directory’s `bin-react-js/` (create it):

| File | Named exports (exact names) |
|------|-----------------------------|
| `domain-money.js` | `applyBps`, `roundToCents` |
| `domain-calendar.js` | `addBusinessDays`, `businessDaysBetween` |
| `logic-quote.js` | `computeQuote` |
| `logic-penalty.js` | `computeLatePenalty` |
| `logic-case-status.js` | `transitionCase`, `applyEventChain` |
| `logic-invoice.js` | `buildIssuedInvoice`, `settlePayment` |

- Use **named exports** only for these APIs (no `export default` factory wrapping them).
- Logic modules MUST import Domain helpers; do not reimplement `cents * bps / 10000` outside `domain-money.js`.
- No tests required for this baseline.
- Do **not** read any `*.isl.md`, `oracle/`, `vectors.json`, or `results/`.

## Money

- Amounts in integer cents; rates in integer basis points (`125` = 1.25%).
- `applyBps({ cents, bps })` → `{ ok: true, cents }` = `cents * bps / 10000` rounded **half-away-from-zero**.
- `roundToCents({ scaled, fromScale, toScale })` → `{ ok: true, value }` with the same half-away rule.

## Calendar

- Civil dates as `YYYY-MM-DD` strings; ignore local TZ.
- Business days = Mon–Fri excluding exact string matches in `holidays[]`.
- `addBusinessDays({ start, n, holidays })` → `{ ok: true, date }` (n=0 → start).
- `businessDaysBetween({ from, to, holidays })` → `{ ok: true, days }` counts business days in **`(from, to]`** (exclude `from`, include `to` if business). If `to <= from` → 0.

## Quote

- `computeQuote({ baseCents, tiers, discountsBps, invoiceFloorCents })` → `{ ok: true, cents }`.
- Tiers progressive; each tier `{ upToCents: number|null, rateBps }`; `upToCents` is **cumulative** upper bound; `null` = remainder. Band `(prevUpTo, upToCents]`.
- Each band slice via `applyBps`. Then each discount in array order as `applyBps({ cents: amount, bps: 10000 - discountBps })`.
- **After** all discounts, if `amount < invoiceFloorCents` then `amount = invoiceFloorCents`.

## Penalty

- `computeLatePenalty({ principalCents, dueDate, paidDate, holidays, graceBusinessDays, rateBpsPerDay, capBps })` → `{ ok: true, cents }`.
- `lateDays = businessDaysBetween({ from: dueDate, to: paidDate, holidays }).days`.
- If `lateDays <= graceBusinessDays` → 0 (inclusive grace).
- Else `excess = lateDays - grace`; `dayFee = applyBps({ cents: principalCents, bps: rateBpsPerDay }).cents`; `penalty = dayFee * excess`; `cap = applyBps({ cents: principalCents, bps: capBps }).cents`; return `min(penalty, cap)`.

## Case status

- States: `draft|issued|overdue|paid|voided`. Events: `issue|mark_overdue|pay|void`.
- Table: draft+issue→issued; issued+mark_overdue→overdue; issued|overdue+pay→paid; paid+void→voided. `voided` terminal → `invalid_transition`. Unknown state → `unknown_state`. Unknown event / bad pair → `invalid_transition`.
- `transitionCase({ state, event })` → `{ ok:true, state }` or `{ ok:false, code }`.
- `applyEventChain({ state, events })`: empty events → `{ ok:true, state }` without validating; else fold `transitionCase`; on error `{ ok:false, code, atIndex }` (0-based).

## Invoice

- `buildIssuedInvoice({ issueDate, netBusinessDays, holidays, quote })`: amount via `computeQuote(quote)`; due via `addBusinessDays({ start: issueDate, n: netBusinessDays, holidays })`; state via `transitionCase({ state:"draft", event:"issue" })`. Return `{ ok:true, amountCents, dueDate, state }` or `{ ok:false, code }`.
- `settlePayment({ state, amountCents, dueDate, paidDate, holidays, graceBusinessDays, rateBpsPerDay, capBps })`: **first** `transitionCase({ state, event:"pay" })`; if fail return that error **without** computing penalty; else penalty via `computeLatePenalty` with `principalCents: amountCents`; return `{ ok:true, penaltyCents, totalDueCents: amountCents+penalty, state }`.

## Done when

All listed files exist with the listed named exports. Print the file list and stop.
