import generated from '@/lib/contract.generated.json';

import { getCases, recentRules } from './read';
import type { Case, RuleSet } from './types';

/** Rule sets made to score the judge or to test the contract. They stay readable, but they are not the examples. */
const HIDDEN = new Set<number>(generated.evalRuleSets);
export const isTest = (r: Pick<RuleSet, 'id' | 'name'>) => HIDDEN.has(r.id);

/** How much a suite shows: all three results beat two, and a suite that has run beats one that has not. */
function score(r: RuleSet): number {
  const c = r.counts;
  return (c.pass > 0 ? 3 : 0) + (c.unclear > 0 ? 3 : 0) + (c.fail > 0 ? 3 : 0) + Math.min(c.live, 8) + (c.stale > 0 ? 1 : 0);
}

export type Run = { id: number; rules: string; rulesId: number; scenario: string; result: Case['result']; label: string; by: string; at: number };

/** The suite the landing page prints, the other recent suites, and the newest runs across them: all read from the chain. */
export async function featuredSuite(): Promise<{ all: RuleSet[]; real: RuleSet[]; featured: RuleSet | null; cases: Case[]; runs: Run[] }> {
  const all = await recentRules(8);
  const real = all.filter((r) => !isTest(r));
  const featured = [...real].sort((a, b) => score(b) - score(a) || b.id - a.id)[0] ?? null;
  const runs: Run[] = [];
  let cases: Case[] = [];
  for (const r of real.slice(0, 3)) {
    const list = await getCases(r.id);
    if (!list.found) continue;
    if (featured && r.id === featured.id) cases = list.cases;
    for (const c of list.cases) {
      if (c.label && c.ran_at) runs.push({ id: c.id, rules: r.name, rulesId: r.id, scenario: c.scenario, result: c.result, label: c.label, by: c.ran_by, at: c.ran_at });
    }
  }
  runs.sort((a, b) => b.at - a.at);
  if (featured && cases.length === 0) {
    const list = await getCases(featured.id);
    if (list.found) cases = list.cases;
  }
  return { all, real, featured, cases, runs: runs.slice(0, 10) };
}
