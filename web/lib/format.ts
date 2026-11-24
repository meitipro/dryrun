import type { Case, Counts, Result, Suite } from './types';

const GEN = 10n ** 18n;

/** Wei as GEN: 5 GEN, 0.5 GEN. Never through a float. */
export function gen(wei: string | bigint | number, unit = true): string {
  const value = BigInt(wei);
  const whole = value / GEN;
  const frac = value % GEN;
  let text = whole.toLocaleString('en-US');
  if (frac !== 0n) {
    const digits = frac.toString().padStart(18, '0').replace(/0+$/, '');
    text += '.' + digits.slice(0, 6);
  }
  return unit ? `${text} GEN` : text;
}

/** GEN typed by a person ("5", "0.5") to wei; null when it is not a number. */
export function toWei(text: string): bigint | null {
  const clean = text.trim();
  if (!/^\d+(\.\d{1,18})?$/.test(clean)) return null;
  const [whole, frac = ''] = clean.split('.');
  return BigInt(whole) * GEN + BigInt((frac + '0'.repeat(18)).slice(0, 18));
}

export function short(address: string, head = 6, tail = 4): string {
  if (!address) return '';
  return `${address.slice(0, head)}…${address.slice(-tail)}`;
}

export function shortHash(hash: string): string {
  return hash ? `${hash.slice(0, 6)}…${hash.slice(-4)}` : '';
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** Chain seconds as "Nov 17, 2026", in UTC so server and browser agree. */
export function day(seconds: number): string {
  if (!seconds) return '';
  const d = new Date(seconds * 1000);
  return `${MONTHS[d.getUTCMonth()]} ${d.getUTCDate()}, ${d.getUTCFullYear()}`;
}

export function dayTime(seconds: number): string {
  if (!seconds) return '';
  const d = new Date(seconds * 1000);
  const hh = String(d.getUTCHours()).padStart(2, '0');
  const mm = String(d.getUTCMinutes()).padStart(2, '0');
  return `${day(seconds)}, ${hh}:${mm} UTC`;
}

export function plural(n: number, one: string, many = one + 's'): string {
  return `${n.toLocaleString('en-US')} ${n === 1 ? one : many}`;
}

/** The bracketed mark a result gets on a log line. */
export const MARK: Record<Exclude<Result, ''> | 'NEW', string> = {
  PASS: 'PASS',
  FAIL: 'FAIL',
  UNCLEAR: 'UNCL',
  STALE: 'STALE',
  NEW: 'NEW',
};

export const markOf = (result: Result): string => MARK[result === '' ? 'NEW' : result];

/** The class a result takes: green for a pass, red for a fail, amber for a gap, dim for the rest. */
export const resultClass = (result: Result): string =>
  result === 'PASS' ? 'ok' : result === 'FAIL' ? 'bad' : result === 'UNCLEAR' ? 'warn' : 'dim';

export const suiteClass = (suite: Suite): string => (suite === 'GREEN' ? 'ok' : suite === 'RED' ? 'bad' : 'warn');

/** Shares of a suite bar, in percent of the live cases. Rounded only for the bar's width, never shown as a number. */
export function shares(counts: Counts): { pass: number; unclear: number; fail: number; rest: number } {
  const live = counts.live || 1;
  const pct = (n: number) => (n * 100) / live;
  return { pass: pct(counts.pass), unclear: pct(counts.unclear), fail: pct(counts.fail), rest: pct(counts.stale + counts.not_run) };
}

/** A line-by-line diff of two rule texts: what stayed, what went, what is new. */
export function lineDiff(before: string, after: string): { kind: 'same' | 'gone' | 'new'; text: string }[] {
  const a = before.split('\n');
  const b = after.split('\n');
  const n = a.length;
  const m = b.length;
  const table: number[][] = Array.from({ length: n + 1 }, () => new Array<number>(m + 1).fill(0));
  for (let i = n - 1; i >= 0; i--) for (let j = m - 1; j >= 0; j--) table[i][j] = a[i] === b[j] ? table[i + 1][j + 1] + 1 : Math.max(table[i + 1][j], table[i][j + 1]);
  const out: { kind: 'same' | 'gone' | 'new'; text: string }[] = [];
  let i = 0;
  let j = 0;
  while (i < n && j < m) {
    if (a[i] === b[j]) {
      out.push({ kind: 'same', text: a[i] });
      i++;
      j++;
    } else if (table[i + 1][j] >= table[i][j + 1]) {
      out.push({ kind: 'gone', text: a[i++] });
    } else {
      out.push({ kind: 'new', text: b[j++] });
    }
  }
  while (i < n) out.push({ kind: 'gone', text: a[i++] });
  while (j < m) out.push({ kind: 'new', text: b[j++] });
  return out;
}

/** The result a case would have if it ran against the current rules, for a hint beside the case. */
export const needsRun = (c: Pick<Case, 'status' | 'result'>): boolean => c.status === 'LIVE' && (c.result === '' || c.result === 'STALE');
