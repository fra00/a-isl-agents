# Baseline prompt C# (NO Spec files)

Implement a small C# 12 / .NET 8 library for invoicing / quotes / late penalties.

## Output layout (mandatory)

Write only under this directory’s `bin-csharp/` (create it). Namespace: `TariffeV2`.

| File | Public static class | Methods (exact names) |
|------|---------------------|------------------------|
| `domain-money.cs` | `DomainMoney` | `ApplyBps`, `RoundToCents` |
| `domain-calendar.cs` | `DomainCalendar` | `AddBusinessDays`, `BusinessDaysBetween` |
| `logic-quote.cs` | `LogicQuote` | `ComputeQuote` |
| `logic-penalty.cs` | `LogicPenalty` | `ComputeLatePenalty` |
| `logic-case-status.cs` | `LogicCaseStatus` | `TransitionCase`, `ApplyEventChain` |
| `logic-invoice.cs` | `LogicInvoice` | `BuildIssuedInvoice`, `SettlePayment` |

- Public **static** methods only for these APIs (no instance-factory wrapping).
- First parameter / return: types that round-trip Spec-shaped JSON (camelCase fields: `ok`, `cents`, `bps`, …).
- Prefer `record` DTOs for inputs/outputs (public properties matching those JSON fields). Do **not** use `JsonObject`, `JsonElement`, or `Dictionary<string, object?>` as the primary API types.
- Logic MUST call Domain helpers; do not reimplement `cents * bps / 10000` outside `DomainMoney`.
- No tests required for this baseline.
- Do **not** read any `*.isl.md`, `oracle/`, `vectors.json`, or `results/`.

## Money

- Amounts in integer cents; rates in integer basis points (`125` = 1.25%).
- `ApplyBps` input `{ cents, bps }` → `{ ok: true, cents }` = `cents * bps / 10000` rounded **half-away-from-zero**.
- `RoundToCents` input `{ scaled, fromScale, toScale }` → `{ ok: true, value }` with the same half-away rule (`scaled / 10^(fromScale-toScale)`).

## Calendar

- Civil dates as `YYYY-MM-DD` strings; ignore local TZ.
- Business days = Mon–Fri excluding exact string matches in `holidays[]`.
- `AddBusinessDays` `{ start, n, holidays }` → `{ ok: true, date }` (n=0 → start).
- `BusinessDaysBetween` `{ from, to, holidays }` → `{ ok: true, days }` counts business days in **`(from, to]`**. If `to <= from` → 0.

## Quote

- `ComputeQuote` `{ baseCents, tiers, discountsBps, invoiceFloorCents }` → `{ ok: true, cents }`.
- Tiers progressive; each `{ upToCents: number|null, rateBps }`; `upToCents` cumulative upper bound; `null` = remainder. Band `(prevUpTo, upToCents]`.
- Each band via `DomainMoney.ApplyBps`. Then each discount as `ApplyBps({ cents: amount, bps: 10000 - discountBps })`.
- **After** all discounts, if `amount < invoiceFloorCents` then `amount = invoiceFloorCents`.

## Penalty

- `ComputeLatePenalty` `{ principalCents, dueDate, paidDate, holidays, graceBusinessDays, rateBpsPerDay, capBps }` → `{ ok: true, cents }`.
- `lateDays = BusinessDaysBetween({ from: dueDate, to: paidDate, holidays }).days`.
- If `lateDays <= graceBusinessDays` → 0 (inclusive grace).
- Else `excess = lateDays - grace`; `dayFee = ApplyBps({ cents: principalCents, bps: rateBpsPerDay }).cents`; `penalty = dayFee * excess`; `cap = ApplyBps({ cents: principalCents, bps: capBps }).cents`; return `min(penalty, cap)`.

## Case status

- States: `draft|issued|overdue|paid|voided`. Events: `issue|mark_overdue|pay|void`.
- Table: draft+issue→issued; issued+mark_overdue→overdue; issued|overdue+pay→paid; paid+void→voided. `voided` terminal → `invalid_transition`. Unknown state → `unknown_state`. Unknown event / bad pair → `invalid_transition`.
- `TransitionCase` `{ state, event }` → `{ ok:true, state }` or `{ ok:false, code }`.
- `ApplyEventChain` `{ state, events }`: empty events → `{ ok:true, state }` without validating; else fold `TransitionCase`; on error `{ ok:false, code, atIndex }` (0-based).

## Invoice

- `BuildIssuedInvoice` `{ issueDate, netBusinessDays, holidays, quote }`: amount via `ComputeQuote(quote)`; due via `AddBusinessDays`; state via `TransitionCase({ state:"draft", event:"issue" })`. Return `{ ok:true, amountCents, dueDate, state }` or `{ ok:false, code }`.
- `SettlePayment` `{ state, amountCents, dueDate, paidDate, holidays, graceBusinessDays, rateBpsPerDay, capBps }`: **first** `TransitionCase({ state, event:"pay" })`; if fail return that error **without** computing penalty; else penalty via `ComputeLatePenalty`; return `{ ok:true, penaltyCents, totalDueCents: amountCents+penalty, state }`.

## Done when

All listed files exist with the listed static APIs. Print the file list and stop.
