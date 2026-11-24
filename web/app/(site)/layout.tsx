import Link from 'next/link';

import { RailLinks } from '@/components/Rail';
import { WalletButton, WalletProvider } from '@/components/Wallet';
import { gen } from '@/lib/format';
import { getTotals } from '@/lib/read';

export const revalidate = 20;

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  let totals = { rule_sets: 0, cases: 0, pool: '0', live: 0, bounties: '0' };
  let connected = true;
  try {
    totals = await getTotals();
  } catch {
    connected = false;
  }
  return (
    <WalletProvider>
      <div className="t-shell">
        <aside className="rl" aria-label="dryrun">
          <div className="rl-top">
            <Link href="/" className="rl-brand" aria-label="dryrun home">
              dryrun<span className="cr" style={{ width: 9, height: 17, marginLeft: 2 }} aria-hidden />
            </Link>
            <p className="rl-ver">v1 · studio next</p>
          </div>
          <RailLinks last={totals.rule_sets} />
          <div className="rl-foot">
            <span>
              pool <b>{gen(totals.pool)}</b>
            </span>
            <span>
              live cases <b>{totals.live}</b>
            </span>
            <span>
              <span className="rl-dot" style={connected ? undefined : { background: 'var(--red)' }} aria-hidden />
              {connected ? 'connected' : 'not answering'}
            </span>
            <div style={{ marginTop: 8 }}>
              <WalletButton />
            </div>
          </div>
        </aside>
        <div className="t-main">
          <div className="sc" aria-hidden />
          <div className="flex min-h-screen flex-col">
            <div className="flex-1">{children}</div>
            <footer className="c-wrap mono py-8 text-[12px]" style={{ color: 'var(--ink-3)', borderTop: '1px solid var(--line-soft)', marginTop: 48 }}>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <span>dryrun · genlayer studio next · chain 61997</span>
                <span className="flex flex-wrap gap-4">
                  <Link href="/docs" className="c-link">docs</Link>
                  <Link href="/docs/more/evaluation" className="c-link">evaluation</Link>
                  <Link href="/llms.txt" className="c-link">llms.txt</Link>
                </span>
              </div>
            </footer>
          </div>
        </div>
      </div>
    </WalletProvider>
  );
}
