import Link from 'next/link';
import { notFound } from 'next/navigation';

import { AddCase } from '@/components/AddCase';
import { ReadError } from '@/components/Terminal';
import { getRules, readError } from '@/lib/read';
import type { RuleSet } from '@/lib/types';

export const revalidate = 20;
export const metadata = { title: 'Add a case' };

const STAKE = '1000000000000000000';
const BOUNTY = '2000000000000000000';

export default async function Add(props: PageProps<'/r/[id]/add'>) {
  const { id } = await props.params;
  const n = Number(id);
  if (!Number.isInteger(n) || n < 1) notFound();
  let r: RuleSet;
  try {
    const got = await getRules(n);
    if (!got.found) notFound();
    r = got;
  } catch (e) {
    if ((e as { digest?: string })?.digest?.startsWith('NEXT_')) throw e;
    return (
      <div className="c-wrap py-12">
        <ReadError message={readError(e)} />
      </div>
    );
  }
  return (
    <div className="c-wrap py-8 md:py-12">
      <p className="mono text-[13px]" style={{ color: 'var(--ink-2)' }}>
        <Link href="/r" className="c-link">dryrun</Link> / <Link href={`/r/${r.id}`} className="c-link">{r.name}</Link> / add
      </p>
      <h1 className="t-head mt-4">Add a case</h1>
      <p className="c-muted mt-3 max-w-[44em] text-[14px] leading-relaxed">
        Type a situation, say what you expect the rules to do with it, and run it. The validators read the rules as written, and the contract compares their label with your expectation.
      </p>
      <div className="mt-8 max-w-[760px]">
        <AddCase rulesId={r.id} version={r.version} slots={40 - r.counts.live} stake={STAKE} bounty={BOUNTY} />
      </div>
    </div>
  );
}
