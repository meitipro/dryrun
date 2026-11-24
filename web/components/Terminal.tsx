import Link from 'next/link';

import { DEPLOYMENT } from '@/lib/genlayer-core.mjs';
import { gen, markOf, resultClass, shares, short, suiteClass } from '@/lib/format';
import type { Case, Counts, Result, Suite } from '@/lib/types';

export const EXPLORER = DEPLOYMENT.explorer as string;
export const CONTRACT = DEPLOYMENT.dryrun as string;

export const txUrl = (hash: string) => `${EXPLORER}/tx/${hash}`;
export const addressUrl = (address: string) => `${EXPLORER}/address/${address}`;

/** A bracketed result: [PASS] in green, [FAIL] in red, [UNCL] in amber, [STALE] and [NEW] dim. */
export function ResultMark({ result }: { result: Result }) {
  return <span className={`mk ${resultClass(result)}`}>[{markOf(result)}]</span>;
}

export function SuiteWord({ suite }: { suite: Suite }) {
  return <span className={suiteClass(suite)}>{suite}</span>;
}

/** One bar, one proportion of the live cases: green for passes, amber for gaps, red for fails, dim for what has not run on these rules. */
export function SuiteBar({ counts }: { counts: Counts }) {
  const s = shares(counts);
  const label = `${counts.pass} pass, ${counts.unclear} unclear, ${counts.fail} fail, ${counts.stale + counts.not_run} not run on these rules`;
  return (
    <div className="t-bar" role="img" aria-label={label}>
      {counts.live === 0 ? null : (
        <>
          <span style={{ width: `${s.pass}%`, background: 'var(--green)' }} />
          <span style={{ width: `${s.unclear}%`, background: 'var(--amber)' }} />
          <span style={{ width: `${s.fail}%`, background: 'var(--red)' }} />
          <span style={{ width: `${s.rest}%`, background: '#1f4a30' }} />
        </>
      )}
    </div>
  );
}

export function Counts({ counts }: { counts: Counts }) {
  return (
    <span className="mono text-[13px]">
      <span className="ok">{counts.pass} pass</span> · <span className="warn">{counts.unclear} unclear</span> · <span className="bad">{counts.fail} fail</span>
      {counts.stale + counts.not_run > 0 ? <span className="dim"> · {counts.stale + counts.not_run} to run</span> : null}
    </span>
  );
}

/** A case as one log line: scenario, what the author expected, what the validators said, and the bracketed result. */
export function CaseLine({ c, action }: { c: Case; action?: React.ReactNode }) {
  const retired = c.status === 'RETIRED';
  return (
    <div className="t-line" style={retired ? { opacity: 0.55 } : undefined}>
      <span className="id">#{c.id}</span>
      <span className="what" style={retired ? { textDecoration: 'line-through' } : undefined}>{c.scenario}</span>
      <span className="col" title="expected">{c.expected}</span>
      <span className="col" title="the validators' label on the rules they last read">{c.label || '-'}</span>
      {retired ? <span className="mk dim">[RETIRED]</span> : <ResultMark result={c.result} />}
      {action}
    </div>
  );
}

/** The log of runs, scrolling upward: the lines are written twice so the loop has no seam. */
export function Ticker({ lines }: { lines: { id: number; rules: string; scenario: string; result: Result; label: string; by: string }[] }) {
  if (lines.length === 0) return <p className="dim text-[13px]">no runs yet. the first run on chain will scroll past here.</p>;
  const rows = [...lines, ...lines];
  return (
    <div className="tk-box" style={{ height: 190, overflow: 'hidden' }} aria-label="live runs">
      <div className="tk">
        {rows.map((l, i) => (
          <div key={i} className="t-line" style={{ padding: '4px 0' }} aria-hidden={i >= lines.length ? true : undefined}>
            <span className="dim">{l.rules}</span>
            <span className="what" style={{ flexBasis: 200 }}>#{l.id} {l.scenario}</span>
            <span className="col">{l.label || '-'}</span>
            <ResultMark result={l.result} />
          </div>
        ))}
      </div>
    </div>
  );
}

export function Addr({ address }: { address: string }) {
  if (!address) return null;
  return (
    <a className="c-link text-[12.5px]" href={addressUrl(address)} target="_blank" rel="noreferrer" title={address}>
      {short(address)}
    </a>
  );
}

export function Tx({ hash, label }: { hash: string; label?: string }) {
  if (!hash) return null;
  return (
    <a className="c-link text-[12.5px]" href={txUrl(hash)} target="_blank" rel="noreferrer">
      {label ? `${label} ` : ''}
      {hash.slice(0, 6)}…{hash.slice(-4)} ↗
    </a>
  );
}

export function Cmd({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="t-cmd">
      {children}
    </Link>
  );
}

export function ReadError({ message }: { message: string }) {
  return (
    <div className="c-note" role="alert">
      <span className="bad">error</span> {message}
    </div>
  );
}

export function Empty({ children }: { children: React.ReactNode }) {
  return <div className="c-note">{children}</div>;
}

export const poolText = (wei: string) => gen(wei);
