/**
 * Reference oracle (BigInt internally → JSON-safe number out).
 */

const MAX = BigInt(Number.MAX_SAFE_INTEGER);

function toSafeNumber(bi) {
  if (bi > MAX || bi < -MAX) {
    throw new Error(`oracle overflow: ${bi}`);
  }
  return Number(bi);
}

function roundDivHalfAway(num, den) {
  const quot = num / den;
  const rem = num % den;
  const absRem = rem < 0n ? -rem : rem;
  if (absRem * 2n >= den) {
    return num >= 0n ? quot + 1n : quot - 1n;
  }
  return quot;
}

/** Round half away from zero: value = scaled / 10^fromScale → integer at toScale. */
export function roundHalfAwayFromZero({ scaled, fromScale, toScale }) {
  const num = BigInt(scaled) * 10n ** BigInt(toScale);
  const den = 10n ** BigInt(fromScale);
  return { ok: true, value: toSafeNumber(roundDivHalfAway(num, den)) };
}

/** cents * bps / 10000, round half away from zero. */
export function applyBps({ cents, bps }) {
  const num = BigInt(cents) * BigInt(bps);
  return { ok: true, cents: toSafeNumber(roundDivHalfAway(num, 10000n)) };
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

/**
 * Tiers: bands (0, upTo0], (upTo0, upTo1], … last upToCents null = rest.
 * rateBps on each band; then discountsBps in order on the rational total;
 * round half-away once at the end.
 */
export function computeQuote({ baseCents, tiers, discountsBps }) {
  let left = BigInt(baseCents);
  let lo = 0n;
  let pricedNum = 0n;
  for (const tier of tiers) {
    if (left <= 0n) break;
    const hi =
      tier.upToCents == null ? lo + left : BigInt(tier.upToCents);
    const width = hi - lo;
    if (width <= 0n) {
      lo = hi;
      continue;
    }
    const take = left < width ? left : width;
    pricedNum += take * BigInt(tier.rateBps);
    left -= take;
    lo = hi;
  }
  let num = pricedNum;
  let den = 10000n;
  for (const bps of discountsBps || []) {
    num = num * (10000n - BigInt(bps));
    den = den * 10000n;
  }
  return { ok: true, cents: toSafeNumber(roundDivHalfAway(num, den)) };
}

export function computePenalty({
  principalCents,
  daysLate,
  rateBpsPerDay,
  capCents,
}) {
  if (daysLate <= 0) return { ok: true, cents: 0 };
  const num =
    BigInt(principalCents) * BigInt(daysLate) * BigInt(rateBpsPerDay);
  let out = roundDivHalfAway(num, 10000n);
  if (capCents != null && out > BigInt(capCents)) out = BigInt(capCents);
  return { ok: true, cents: toSafeNumber(out) };
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
