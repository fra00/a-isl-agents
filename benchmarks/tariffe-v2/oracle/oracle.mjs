/**
 * Reference oracle for tariffe-v2 (half-away bps; business calendar).
 * Used to freeze vectors / selfcheck — not imported by the bin.
 */

const MAX = BigInt(Number.MAX_SAFE_INTEGER);

function toSafeNumber(bi) {
  if (bi > MAX || bi < -MAX) throw new Error(`overflow: ${bi}`);
  return Number(bi);
}

function roundDivHalfAway(num, den) {
  const quot = num / den;
  const rem = num % den;
  const absRem = rem < 0n ? -rem : rem;
  if (absRem * 2n >= den) return num >= 0n ? quot + 1n : quot - 1n;
  return quot;
}

export function applyBps({ cents, bps }) {
  return {
    ok: true,
    cents: toSafeNumber(roundDivHalfAway(BigInt(cents) * BigInt(bps), 10000n)),
  };
}

export function roundToCents({ scaled, fromScale, toScale }) {
  const num = BigInt(scaled) * 10n ** BigInt(toScale);
  const den = 10n ** BigInt(fromScale);
  return { ok: true, value: toSafeNumber(roundDivHalfAway(num, den)) };
}

function parseYmd(s) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
  if (!m) throw new Error(`bad date ${s}`);
  return { y: Number(m[1]), mo: Number(m[2]), d: Number(m[3]) };
}

function toOrdinal({ y, mo, d }) {
  const y0 = mo <= 2 ? y - 1 : y;
  const era = Math.floor(y0 / 400);
  const yoe = y0 - era * 400;
  const m0 = mo <= 2 ? mo + 9 : mo - 3;
  const doy = Math.floor((153 * m0 + 2) / 5) + d - 1;
  const doe = yoe * 365 + Math.floor(yoe / 4) - Math.floor(yoe / 100) + doy;
  return era * 146097 + doe - 719468;
}

function fromOrdinal(z) {
  z = z + 719468;
  const era = Math.floor(z / 146097);
  const doe = z - era * 146097;
  const yoe = Math.floor(
    (doe - Math.floor(doe / 1460) + Math.floor(doe / 36524) - Math.floor(doe / 146096)) /
      365,
  );
  const y = yoe + era * 400;
  const doy = doe - (365 * yoe + Math.floor(yoe / 4) - Math.floor(yoe / 100));
  const mp = Math.floor((5 * doy + 2) / 153);
  const d = doy - Math.floor((153 * mp + 2) / 5) + 1;
  const mo = mp < 10 ? mp + 3 : mp - 9;
  const yy = mo <= 2 ? y + 1 : y;
  const pad = (n) => String(n).padStart(2, "0");
  return `${yy}-${pad(mo)}-${pad(d)}`;
}

function weekdayMon0(ord) {
  return (((ord % 7) + 7 + 3) % 7);
}

function isBusinessDay(ymd, holidaySet) {
  const ord = toOrdinal(parseYmd(ymd));
  if (weekdayMon0(ord) >= 5) return false;
  if (holidaySet.has(ymd)) return false;
  return true;
}

export function addBusinessDays({ start, n, holidays }) {
  const holidaySet = new Set(holidays || []);
  if (n === 0) return { ok: true, date: start };
  let ord = toOrdinal(parseYmd(start));
  const step = n > 0 ? 1 : -1;
  let left = Math.abs(n);
  while (left > 0) {
    ord += step;
    const ymd = fromOrdinal(ord);
    if (isBusinessDay(ymd, holidaySet)) left -= 1;
  }
  return { ok: true, date: fromOrdinal(ord) };
}

export function businessDaysBetween({ from, to, holidays }) {
  const holidaySet = new Set(holidays || []);
  if (to <= from) return { ok: true, days: 0 };
  let ord = toOrdinal(parseYmd(from));
  const end = toOrdinal(parseYmd(to));
  let days = 0;
  while (ord < end) {
    ord += 1;
    if (isBusinessDay(fromOrdinal(ord), holidaySet)) days += 1;
  }
  return { ok: true, days };
}

export function computeQuote({
  baseCents,
  tiers,
  discountsBps,
  invoiceFloorCents,
}) {
  let left = baseCents;
  let lo = 0;
  let priced = 0;
  for (const tier of tiers) {
    if (left <= 0) break;
    const hi = tier.upToCents == null ? lo + left : tier.upToCents;
    const width = hi - lo;
    if (width <= 0) {
      lo = hi;
      continue;
    }
    const take = left < width ? left : width;
    priced += applyBps({ cents: take, bps: tier.rateBps }).cents;
    left -= take;
    lo = hi;
  }
  let amount = priced;
  for (const discountBps of discountsBps || []) {
    amount = applyBps({ cents: amount, bps: 10000 - discountBps }).cents;
  }
  if (amount < invoiceFloorCents) amount = invoiceFloorCents;
  return { ok: true, cents: amount };
}

export function computeLatePenalty({
  principalCents,
  dueDate,
  paidDate,
  holidays,
  graceBusinessDays,
  rateBpsPerDay,
  capBps,
}) {
  const { days: lateDays } = businessDaysBetween({
    from: dueDate,
    to: paidDate,
    holidays,
  });
  if (lateDays <= graceBusinessDays) return { ok: true, cents: 0 };
  const excess = lateDays - graceBusinessDays;
  let penalty =
    applyBps({ cents: principalCents, bps: rateBpsPerDay }).cents * excess;
  const cap = applyBps({ cents: principalCents, bps: capBps }).cents;
  if (penalty > cap) penalty = cap;
  return { ok: true, cents: penalty };
}

const TRANSITIONS = {
  draft: { issue: "issued" },
  issued: { mark_overdue: "overdue", pay: "paid" },
  overdue: { pay: "paid" },
  paid: { void: "voided" },
  voided: {},
};

export function transitionCase({ state, event }) {
  const table = TRANSITIONS[state];
  if (!table) return { ok: false, code: "unknown_state" };
  const next = table[event];
  if (!next) return { ok: false, code: "invalid_transition" };
  return { ok: true, state: next };
}

export function applyEventChain({ state, events }) {
  let current = state;
  for (let i = 0; i < events.length; i++) {
    const r = transitionCase({ state: current, event: events[i] });
    if (!r.ok) return { ok: false, code: r.code, atIndex: i };
    current = r.state;
  }
  return { ok: true, state: current };
}

export function buildIssuedInvoice({
  issueDate,
  netBusinessDays,
  holidays,
  quote,
}) {
  const q = computeQuote(quote);
  const due = addBusinessDays({
    start: issueDate,
    n: netBusinessDays,
    holidays,
  });
  const st = transitionCase({ state: "draft", event: "issue" });
  if (!st.ok) return { ok: false, code: st.code };
  return {
    ok: true,
    amountCents: q.cents,
    dueDate: due.date,
    state: st.state,
  };
}

export function settlePayment(input) {
  const st = transitionCase({ state: input.state, event: "pay" });
  if (!st.ok) return { ok: false, code: st.code };
  const pen = computeLatePenalty({
    principalCents: input.amountCents,
    dueDate: input.dueDate,
    paidDate: input.paidDate,
    holidays: input.holidays,
    graceBusinessDays: input.graceBusinessDays,
    rateBpsPerDay: input.rateBpsPerDay,
    capBps: input.capBps,
  });
  return {
    ok: true,
    penaltyCents: pen.cents,
    totalDueCents: input.amountCents + pen.cents,
    state: st.state,
  };
}

export const API = {
  applyBps,
  roundToCents,
  addBusinessDays,
  businessDaysBetween,
  computeQuote,
  computeLatePenalty,
  transitionCase,
  applyEventChain,
  buildIssuedInvoice,
  settlePayment,
};
