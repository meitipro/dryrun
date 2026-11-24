import { NextResponse } from 'next/server';

import { getCase, getCases, getRules, getTotals, readError } from '@/lib/read';
import type { Case, RuleSet } from '@/lib/types';

/**
 * Which rule sets an address owns, which cases it wrote, and what it can
 * withdraw. The contract has no per-address index, so this scans the newest
 * rule sets through the same 20-second cache the pages use. It only reads
 * public data.
 */
const SCAN = 25;

export async function GET(request: Request) {
  const address = new URL(request.url).searchParams.get('address') ?? '';
  if (!/^0x[0-9a-fA-F]{40}$/.test(address)) return NextResponse.json({ error: 'Send an address.' }, { status: 400 });
  const me = address.toLowerCase();
  try {
    const { rule_sets } = await getTotals();
    const owned: RuleSet[] = [];
    const mine: (Case & { rules_name: string })[] = [];
    let balance = '0';
    let scanned = 0;
    for (let id = rule_sets; id >= 1 && scanned < SCAN; id--, scanned++) {
      const r = await getRules(id);
      if (!r.found) continue;
      if (r.owner.toLowerCase() === me) {
        owned.push(r);
        balance = r.owner_balance;
      }
      const list = await getCases(id);
      if (!list.found) continue;
      for (const c of list.cases) if (c.author.toLowerCase() === me) mine.push({ ...c, rules_name: r.name });
    }
    if (owned.length === 0 && mine.length > 0) {
      const c = await getCase(mine[0].id);
      if (c.found && c.author_balance) balance = c.author_balance;
    }
    return NextResponse.json({ owned, cases: mine, balance, scanned, total: rule_sets });
  } catch (e) {
    return NextResponse.json({ error: readError(e) }, { status: 502 });
  }
}
