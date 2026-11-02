/**
 * Second oracle: Number + MAX_SAFE_INTEGER guardrails.
 */

const MAX = Number.MAX_SAFE_INTEGER;

function assertSafe(...nums) {
  for (const n of nums) {
    if (typeof n !== "number" || !Number.isFinite(n) || Math.abs(n) > MAX) {
      throw new Error(`number oracle unsafe: ${n}`);
    }
  }
}

function roundDivHalfAwayNumber(num, den) {
  assertSafe(num, den);
  const quot = Math.trunc(num / den);
  const rem = num - quot * den;
  if (Math.abs(rem) * 2 >= den) {
    return num >= 0 ? quot + 1 : quot - 1;
  }
  return quot;
}

export function roundHalfAwayFromZero({ scaled, fromScale, toScale }) {
  assertSafe(scaled, fromScale, toScale);
  const num = scaled * 10 ** toScale;
  const den = 10 ** fromScale;
  assertSafe(num, den);
  const value = roundDivHalfAwayNumber(num, den);
  assertSafe(value);
  return { ok: true, value };
}

export function applyBps({ cents, bps }) {
  assertSafe(cents, bps);
  const num = cents * bps;
  assertSafe(num);
  const out = roundDivHalfAwayNumber(num, 10000);
  assertSafe(out);
  return { ok: true, cents: out };
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
  assertSafe(n);
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

export function computeQuote({ baseCents, tiers, discountsBps }) {
  assertSafe(baseCents);
  let left = baseCents;
  let lo = 0;
  let pricedNum = 0;
  for (const tier of tiers) {
    if (left <= 0) break;
    const hi = tier.upToCents == null ? lo + left : tier.upToCents;
    assertSafe(hi, tier.rateBps);
    const width = hi - lo;
    if (width <= 0) {
      lo = hi;
      continue;
    }
    const take = left < width ? left : width;
    const prod = take * tier.rateBps;
    assertSafe(prod);
    pricedNum += prod;
    assertSafe(pricedNum);
    left -= take;
    lo = hi;
  }
  let num = pricedNum;
  let den = 10000;
  for (const bps of discountsBps || []) {
    assertSafe(bps);
    num = num * (10000 - bps);
    den = den * 10000;
    assertSafe(num, den);
  }
  const cents = roundDivHalfAwayNumber(num, den);
  assertSafe(cents);
  return { ok: true, cents };
}

export function computePenalty({
  principalCents,
  daysLate,
  rateBpsPerDay,
  capCents,
}) {
  assertSafe(principalCents, daysLate, rateBpsPerDay);
  if (daysLate <= 0) return { ok: true, cents: 0 };
  const num = principalCents * daysLate * rateBpsPerDay;
  assertSafe(num);
  let out = roundDivHalfAwayNumber(num, 10000);
  if (capCents != null) {
    assertSafe(capCents);
    if (out > capCents) out = capCents;
  }
  assertSafe(out);
  return { ok: true, cents: out };
}

const TRANSITIONS = {
  draft: { issue: "issued" },
  issued: { pay: "paid", mark_overdue: "overdue" },
  overdue: { pay: "paid" },
  paid: {},
};

export function transitionCase({ state, event }) {
  const table = TRANSITIONS[state];
  if (!table) return { ok: false, code: "unknown_state" };
  const next = table[event];
  if (!next) return { ok: false, code: "invalid_transition" };
  return { ok: true, state: next };
}

export const API = {
  roundHalfAwayFromZero,
  applyBps,
  addBusinessDays,
  computeQuote,
  computePenalty,
  transitionCase,
};
