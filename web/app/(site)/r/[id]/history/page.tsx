import Link from 'next/link';
import { notFound } from 'next/navigation';

import { Addr, ReadError } from '@/components/Terminal';
import { dayTime, lineDiff } from '@/lib/format';
import { getRules, readError } from '@/lib/read';
import type { RuleSet } from '@/lib/types';

export const revalidate = 20;
export const metadata = { title: 'History' };

export default async function History(props: PageProps<'/r/[id]/history'>) {
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
  const versions = [...r.versions].reverse();
  return (
    <div className="c-wrap py-8 md:py-12">
      <p className="mono text-[13px]" style={{ color: 'var(--ink-2)' }}>
        <Link href="/r" className="c-link">dryrun</Link> / <Link href={`/r/${r.id}`} className="c-link">{r.name}</Link> / history
      </p>
      <h1 className="t-head mt-4">History</h1>
      <p className="c-muted mt-3 max-w-[44em] text-[14px] leading-relaxed">
        Rules are versioned in public and cannot be edited silently. Each update marks every live case STALE until it runs again, so a result is never read against the wrong text.
      </p>
      <div className="mt-8 grid gap-8">
        {versions.map((v) => {
          const before = r.versions[v.version - 2];
          const diff = before ? lineDiff(before.text, v.text) : null;
          return (
            <section key={v.version}>
              <p className="boxed-title">v{v.version}{v.version === r.version ? ' · current' : ''}</p>
              <div className="boxed p-5" style={{ marginTop: -10 }}>
                <p className="dim mb-3 text-[12px]">
                  {dayTime(v.at)} · written by <Addr address={v.by} /> · {v.text.length} characters
                </p>
                {diff ? (
                  <div className="t-rules">
                    {diff.map((d, i) => (
                      <div key={i} className={`t-diff-${d.kind}`}>
                        {d.kind === 'new' ? '+ ' : d.kind === 'gone' ? '- ' : '  '}
                        {d.text || ' '}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="t-rules">{v.text}</div>
                )}
                {before ? <p className="dim mt-3 text-[12px]">changes against v{before.version}: lines marked + are new, lines marked - are gone.</p> : <p className="dim mt-3 text-[12px]">the first version, as registered.</p>}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
