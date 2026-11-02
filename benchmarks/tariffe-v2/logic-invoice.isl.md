# Project: Bench Tariffe v2

Orchestrazione fattura: preventivo, scadenza lavorativa, penale a pagamento, aggiornamento stato.

**Version**: 1.1.0
**ISL Version**: 1.6.2
**Created**: 2026-11-01
**Implementation**: ./logic-invoice

---

> **Reference**: addBusinessDays in `./domain-calendar.isl.md`.
> **Reference**: computeQuote in `./logic-quote.isl.md`.
> **Reference**: computeLatePenalty in `./logic-penalty.isl.md`.
> **Reference**: transitionCase in `./logic-case-status.isl.md`.

## Component: logicInvoice

### Role: Business Logic

**Signature**: logicInvoice()

### ⚡ Capabilities

#### buildIssuedInvoice

- **Contract**: Calcola `amountCents` con `computeQuote`, `dueDate` con `addBusinessDays(issueDate, netBusinessDays, holidays)`, stato con `transitionCase({ state: "draft", event: "issue" })`. MUST delegare; MUST NOT ricalcolare scaglioni/festivi in locale. Il chiamante di `settlePayment` MUST riusare lo **stesso** array `holidays` usato qui per la `dueDate`.
- **Signature**: buildIssuedInvoice(input: { issueDate: String, netBusinessDays: Number, holidays: String[], quote: { baseCents: Number, tiers: { upToCents: Number | null, rateBps: Number }[], discountsBps: Number[], invoiceFloorCents: Number } }): { ok: true, amountCents: Number, dueDate: String, state: String } | { ok: false, code: String }
- **Flow**:
  1. computeQuote → amount.
  2. addBusinessDays → dueDate.
  3. transitionCase draft→issue.
  4. RETURN aggregato o codice errore.

#### settlePayment

- **Contract**: Prima tenta `transitionCase({ state, event: "pay" })` (ammesso solo da `issued` o `overdue`; altrimenti RETURN subito `{ ok:false, code }` **senza** calcolare la penale). Se la transizione riesce, calcola `penaltyCents = computeLatePenalty({ principalCents: amountCents, dueDate, paidDate, holidays, graceBusinessDays, rateBpsPerDay, capBps }).cents` e `totalDueCents = amountCents + penaltyCents`. `holidays` MUST essere lo stesso set usato per costruire la `dueDate`.
- **Signature**: settlePayment(input: { state: String, amountCents: Number, dueDate: String, paidDate: String, holidays: String[], graceBusinessDays: Number, rateBpsPerDay: Number, capBps: Number }): { ok: true, penaltyCents: Number, totalDueCents: Number, state: String } | { ok: false, code: String }
- **Flow**:
  1. transition pay.
  2. IF fail: RETURN code.
  3. computeLatePenalty con principal = amountCents.
  4. RETURN totale e stato.

### ⚙ Logic & Execution Rules

- Facade: composizione, non nuove formule.
- Ordine settle: **transizione prima**, penale dopo (niente penale su stati non pagabili).

### 🚨 Constraints

- MUST importare calendar, quote, penalty, case-status.
- MUST NOT reimplementare le loro formule.

### ✅ Acceptance Criteria

- [ ] settlePayment on due date → penalty 0, state paid.
- [ ] settlePayment da paid → invalid_transition senza totale inventato.

### 🧪 Test Scenarios

1. **Pay on due date** `id: inv-pay-on-due`
   - Call: settlePayment
   - Input: issued, amount 10000, due=paid same day, grace 3
   - Expected: penalty 0, total 10000, state paid

```json
{
  "input": {
    "state": "issued",
    "amountCents": 10000,
    "dueDate": "2024-01-15",
    "paidDate": "2024-01-15",
    "holidays": [],
    "graceBusinessDays": 3,
    "rateBpsPerDay": 10,
    "capBps": 1000
  },
  "expected": {
    "ok": true,
    "penaltyCents": 0,
    "totalDueCents": 10000,
    "state": "paid"
  }
}
```
