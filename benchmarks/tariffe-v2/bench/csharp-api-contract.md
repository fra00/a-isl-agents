# C# API contract (tariffe-v2 score)

Score loads `bin-csharp/*.cs` (excludes `*.Tests.cs`) and invokes **public static** methods by name (PascalCase Call). Same JSON shapes as Spec / JS vectors (camelCase).

## Files → static class

| File | Required public static class |
|------|------------------------------|
| `domain-money.cs` | `DomainMoney` |
| `domain-calendar.cs` | `DomainCalendar` |
| `logic-quote.cs` | `LogicQuote` |
| `logic-penalty.cs` | `LogicPenalty` |
| `logic-case-status.cs` | `LogicCaseStatus` |
| `logic-invoice.cs` | `LogicInvoice` |

Namespace: `TariffeV2`.

## Methods (PascalCase)

`ApplyBps`, `RoundToCents`, `AddBusinessDays`, `BusinessDaysBetween`, `ComputeQuote`, `ComputeLatePenalty`, `TransitionCase`, `ApplyEventChain`, `BuildIssuedInvoice`, `SettlePayment`.

## Signatures

- First parameter: a public type whose properties match the Spec JSON fields (case-insensitive bind).
- Return: a public type / anonymous-shaped object whose serialized camelCase JSON matches Spec outputs (`ok`, `cents`, `code`, …).
- Prefer `record` DTOs. No `export default` equivalent — **static methods only** on the classes above.
- Logic MUST call Domain static methods (e.g. `DomainMoney.ApplyBps`); do not inline `* bps / 10000` in Logic.
