import { unstable_cache } from 'next/cache';

import { CONTRACT, readClient, retried } from './genlayer-core.mjs';
import type { Case, CaseList, NotFound, RuleSet, Totals } from './types';

/**
 * Reads happen on the server, cached for a short while under tags.
 *
 * Studio Next rate-limits each IP, and every visitor's page view would
 * otherwise spend the server's budget. Shared reads are cached for 20 seconds;
 * after a decided write the page POSTs /api/refresh, which expires the tags it
 * touched, so the person who wrote sees their own result at once.
 */

const client = readClient();
const REVALIDATE = 20;

async function view<T>(method: string, args: (number | string)[]): Promise<T> {
  const raw = await retried(() => client.readContract({ address: CONTRACT, functionName: method, args }), 3);
  return JSON.parse(String(raw)) as T;
}

export const tags = {
  rules: 'rules',
  rule: (id: number) => `rules:${id}`,
  cases: (id: number) => `cases:${id}`,
};

export function getRules(id: number): Promise<RuleSet | NotFound> {
  return unstable_cache(() => view<RuleSet | NotFound>('get_rules', [id]), ['get_rules', String(id)], {
    revalidate: REVALIDATE,
    tags: [tags.rules, tags.rule(id)],
  })();
}

export function getCases(id: number): Promise<CaseList | NotFound> {
  return unstable_cache(() => view<CaseList | NotFound>('list_cases', [id]), ['list_cases', String(id)], {
    revalidate: REVALIDATE,
    tags: [tags.rules, tags.cases(id)],
  })();
}

export function getCase(id: number): Promise<Case | NotFound> {
  return unstable_cache(() => view<Case | NotFound>('get_case', [id]), ['get_case', String(id)], {
    revalidate: REVALIDATE,
    tags: [tags.rules, `case:${id}`],
  })();
}

/** The contract's own totals: rule set 0 is not a rule set, it answers the counts. */
export async function getTotals(): Promise<Totals> {
  const out = await getRules(0);
  return out.totals ?? { rule_sets: 0, cases: 0, pool: '0', live: 0, bounties: '0' };
}

/** Rule sets newest first. The contract has no list view, so this reads rule set by rule set; the cache keeps it to one pass per 20 seconds. */
export async function recentRules(count = 12): Promise<RuleSet[]> {
  const { rule_sets } = await getTotals();
  const out: RuleSet[] = [];
  for (let id = rule_sets; id >= 1 && out.length < count; id--) {
    const r = await getRules(id);
    if (r.found) out.push(r);
  }
  return out;
}

/** A read failed: say so in one sentence rather than failing the page. */
export function readError(error: unknown): string {
  const text = String((error as Error)?.message ?? error);
  if (/-32029|rate limit/i.test(text)) return 'studio next is rate limiting reads right now. wait a minute and reload.';
  return 'studio next did not answer this read. reload in a moment.';
}
