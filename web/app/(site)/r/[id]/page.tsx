import Link from 'next/link';
import { notFound } from 'next/navigation';

import { FundForm, RetireButton, RunButton, UpdateForm } from '@/components/Actions';
import { Addr, CaseLine, Cmd, Counts, ReadError, SuiteBar, SuiteWord } from '@/components/Terminal';
import { dayTime, gen, needsRun } from '@/lib/format';
import { getCases, getRules, readError } from '@/lib/read';
import type { Case, RuleSet } from '@/lib/types';

export const revalidate = 20;

export async function generateMetadata(props: PageProps<'/r/[id]'>) {
  const { id } = await props.params;
  const r = await getRules(Number(id)).catch(() => null);
  return { title: r && r.found ? `${r.name} · v${r.version}` : `Rule set ${id}` };
}

export default async function Suite(props: PageProps<'/r/[id]'>) {
  const { id } = await props.params;
  const n = Number(id);
  if (!Number.isInteger(n) || n < 1) notFound();
  let r: RuleSet;
  let cases: Case[] = [];
  try {
    const got = await getRules(n);
    if (!got.found) notFound();
    r = got;
    const list = await getCases(n);
    if (list.found) cases = list.cases;
  } catch (e) {
    if ((e as { digest?: string })?.digest?.startsWith('NEXT_')) throw e;
    return (
      <div className="c-wrap py-12">
        <ReadError message={readError(e)} />
      </div>
    );
  }
  const live = cases.filter((c) => c.status === 'LIVE');
  const retired = cases.filter((c) => c.status === 'RETIRED');
  const todo = live.filter(needsRun).length;
  const fails = live.filter((c) => c.result === 'FAIL');
  const lines = r.text.split('\n');
  return (
    <div className="c-wrap py-8 md:py-12">
      <p className="mono text-[13px]" style={{ color: 'var(--ink-2)' }}>
        <Link href="/r" className="c-link">dryrun</Link> / {r.name} / v{r.version} · rule set {r.id} · <Addr address={r.owner} />
      </p>
      <div className="mt-6 grid gap-8 lg:grid-cols-[1.25fr_1fr]">
        <section aria-label="rules">
          <p className="boxed-title">rules v{r.version}</p>
          <div className="boxed p-5" style={{ marginTop: -10 }}>
            <ol className="t-rules" style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              {lines.map((line, i) => (
                <li key={i}>{line}</li>
              ))}
            </ol>
          </div>
          <p className="dim mt-2 text-[12px]">
            written {dayTime(r.created_at)}{r.version > 1 ? ` · version ${r.version} ${dayTime(r.updated_at)}` : ''} · <Link href={`/r/${r.id}/history`} className="c-link">history</Link>
          </p>
        </section>

        <section aria-label="the suite">
          <p className="c-eyebrow">suite</p>
          <p className="t-suite mt-2"><SuiteWord suite={r.suite} /></p>
          <div className="mt-4"><SuiteBar counts={r.counts} /></div>
          <p className="mt-3"><Counts counts={r.counts} /></p>
          <p className="dim mt-1 text-[12px]">{r.counts.live} live{r.counts.retired ? ` · ${r.counts.retired} retired` : ''}{todo ? ` · ${todo} not run on these rules` : ''}</p>
          <div className="c-card pad mt-5">
            <p className="c-eyebrow">pool</p>
            <p className="mt-1 text-[26px] font-semibold ok">{gen(r.pool)}</p>
            <p className="dim text-[12px]">bounty 2 GEN per unclear case · {gen(r.bounties_paid)} paid so far</p>
          </div>
        </section>
      </div>

      {fails.length > 0 && (
        <p className="bad mt-6 text-[13.5px]">
          [FAIL] {fails.length} {fails.length === 1 ? 'case contradicts its expectation' : 'cases contradict their expectation'}. The owner should read {fails.length === 1 ? 'it' : 'them'}: either the rules or the prediction is wrong.
        </p>
      )}

      <section className="mt-10" aria-label="cases">
        <p className="boxed-title">cases {live.length} live</p>
        <div className="boxed px-5 py-4" style={{ marginTop: -10 }}>
          {cases.length === 0 ? (
            <p className="c-muted text-[13.5px]">No cases yet. Add one: <Link href={`/r/${r.id}/add`} className="c-link">dryrun add --rules {r.id}</Link>.</p>
          ) : (
            [...live, ...retired].map((c) => (
              <CaseLine
                key={c.id}
                c={c}
                action={
                  c.status === 'LIVE' ? (
                    <span className="flex flex-wrap items-start gap-2">
                      {needsRun(c) ? <RunButton caseId={c.id} rulesId={r.id} label={c.result === 'STALE' ? 'run --stale' : 'run'} /> : null}
                      <RetireButton caseId={c.id} rulesId={r.id} />
                    </span>
                  ) : null
                }
              />
            ))
          )}
        </div>
        {retired.length > 0 && <p className="dim mt-2 text-[12px]">retired cases stay visible, with who retired them: {retired.map((c) => `#${c.id}`).join(' ')}.</p>}
      </section>

      <section className="mt-10" aria-label="next">
        <p className="c-eyebrow">next</p>
        <div className="mt-3 flex flex-wrap gap-3">
          <Cmd href={`/r/${r.id}/add`}>dryrun add --rules {r.id}</Cmd>
          <Cmd href={`/r/${r.id}/history`}>dryrun history</Cmd>
          {todo > 0 ? <span className="t-cmd">dryrun run --stale ({todo})</span> : null}
        </div>
      </section>

      <section className="mt-12 grid gap-10 lg:grid-cols-2" aria-label="owner tools">
        <div>
          <p className="t-prompt">dryrun fund</p>
          <p className="c-muted mb-3 mt-2 text-[13px]">The owner funds the bounty pool. It leaves the pool only as bounties.</p>
          <FundForm rulesId={r.id} />
        </div>
        <div>
          <p className="t-prompt">dryrun update-rules</p>
          <p className="c-muted mb-3 mt-2 text-[13px]">The owner writes a new version. Only the owner can; anyone else is refused by the contract.</p>
          <UpdateForm rulesId={r.id} current={r.text} />
        </div>
      </section>
    </div>
  );
}
