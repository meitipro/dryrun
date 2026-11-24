import Link from 'next/link';

import { RegisterForm } from '@/components/Actions';
import { Counts, Empty, ReadError, SuiteBar, SuiteWord } from '@/components/Terminal';
import { gen } from '@/lib/format';
import { readError, recentRules } from '@/lib/read';
import type { RuleSet } from '@/lib/types';

export const revalidate = 20;
export const metadata = { title: 'Rule sets' };

export default async function RuleSets() {
  let rules: RuleSet[] = [];
  let error = '';
  try {
    rules = await recentRules(30);
  } catch (e) {
    error = readError(e);
  }
  return (
    <div className="c-wrap py-8 md:py-12">
      <p className="t-prompt">dryrun ls</p>
      <h1 className="t-head mt-3">Rule sets</h1>
      <p className="c-muted mt-3 max-w-[44em] text-[14px] leading-relaxed">Every rule set on chain, newest first, each with the colour of its suite. A case is only a prediction until it has run on the current rules.</p>

      <div className="boxed mt-8">
        {error ? (
          <div className="p-4"><ReadError message={error} /></div>
        ) : rules.length === 0 ? (
          <div className="p-4"><Empty>No rule set yet. Register the first one below.</Empty></div>
        ) : (
          rules.map((r) => (
            <Link key={r.id} href={`/r/${r.id}`} className="t-row" style={{ borderBottom: '1px dashed var(--line-soft)' }}>
              <div className="flex flex-wrap items-center gap-x-5 gap-y-2 px-4 py-3">
                <span className="dim w-10 text-[12px]">/r/{r.id}</span>
                <span className="min-w-0 flex-1 basis-[200px] font-medium" style={{ color: '#b9f0cb' }}>{r.name} <span className="dim">v{r.version}</span></span>
                <div style={{ width: 160 }}><SuiteBar counts={r.counts} /></div>
                <span className="w-16 text-[15px] font-semibold"><SuiteWord suite={r.suite} /></span>
                <span className="hidden md:inline"><Counts counts={r.counts} /></span>
                <span className="dim text-[12px]">pool {gen(r.pool)}</span>
              </div>
            </Link>
          ))
        )}
      </div>

      <section id="register" className="mt-14 scroll-mt-8">
        <p className="t-prompt">dryrun register</p>
        <h2 className="t-h2 mt-3">Register a rule set</h2>
        <p className="c-muted mt-2 max-w-[44em] text-[13.5px]">At most 2,000 characters, owned by your address, version 1. Fund the bounty pool on its suite page afterwards.</p>
        <div className="mt-5 max-w-[760px]">
          <RegisterForm />
        </div>
      </section>
    </div>
  );
}
