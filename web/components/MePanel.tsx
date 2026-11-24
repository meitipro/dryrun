'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';

import { gen, markOf, resultClass } from '@/lib/format';
import type { Case, RuleSet } from '@/lib/types';
import { refreshReads, send, type TxState } from '@/lib/write';

import { SuiteWord, Tx } from './Terminal';
import { WalletGate, useWallet } from './Wallet';

type Mine = { owned: RuleSet[]; cases: (Case & { rules_name: string })[]; balance: string; scanned: number; total: number };

/** Cases by state, bounties earned, the balance and the one payout. */
export function MePanel() {
  const w = useWallet();
  const [data, setData] = useState<Mine | null>(null);
  const [error, setError] = useState('');
  const [tx, setTx] = useState<TxState>({ phase: 'idle' });
  const busy = tx.phase === 'signing' || tx.phase === 'deciding';

  const load = useCallback(async () => {
    if (!w.account) return;
    setError('');
    try {
      const response = await fetch(`/api/me?address=${w.account}`);
      const body = await response.json();
      if (!response.ok) throw new Error(body.error ?? 'the read failed');
      setData(body as Mine);
    } catch (e) {
      setError(String((e as Error).message ?? e));
    }
  }, [w.account]);

  useEffect(() => {
    setData(null);
    load();
  }, [load]);

  async function withdraw() {
    const out = await send(w.account, 'withdraw', [], 0n, setTx);
    if (out.phase === 'done') {
      await refreshReads(['rules']);
      w.refreshBalance();
      load();
    }
  }

  const owed = data ? BigInt(data.balance) : 0n;
  const earned = data ? data.cases.reduce((sum, c) => sum + BigInt(c.bounty), 0n) : 0n;
  const states = data
    ? (['PASS', 'FAIL', 'UNCLEAR', 'STALE', ''] as const).map((s) => [s, data.cases.filter((c) => c.status === 'LIVE' && c.result === s).length] as const)
    : [];
  const retired = data ? data.cases.filter((c) => c.status === 'RETIRED').length : 0;

  return (
    <WalletGate action="see your rules and cases">
      <div className="grid gap-8">
        <section className="c-card pad flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="c-eyebrow">balance</p>
            <p className="mt-1 text-[26px] font-semibold ok">{data ? gen(owed) : '...'}</p>
            <p className="dim mt-1 max-w-[40em] text-[12.5px]">Stakes that came back and bounties you earned. Withdraw sends them to your wallet in one top-level transfer.</p>
          </div>
          <div>
            <button className="c-btn solid" disabled={busy || owed === 0n} onClick={withdraw}>
              $ dryrun withdraw
            </button>
            {tx.hash && <p className="mt-2"><Tx hash={tx.hash} /></p>}
            {(tx.phase === 'refused' || tx.phase === 'error') && <p className="bad mt-2 text-[13px]">{tx.message}</p>}
          </div>
        </section>

        <section>
          <p className="c-eyebrow">bounties earned</p>
          <p className="mt-1 text-[22px] font-semibold warn">{data ? gen(earned) : '...'}</p>
          <p className="dim text-[12.5px]">2 GEN for each of your scenarios the validators found the rules do not settle, once per case.</p>
        </section>

        {error && <p className="bad text-[13.5px]">{error}</p>}

        <section>
          <p className="c-eyebrow">my cases</p>
          {data && data.cases.length === 0 && (
            <p className="c-muted mt-3 text-[13.5px]">
              You have not added a case yet (the newest {data.scanned} rule sets were checked). <Link href="/r" className="c-link">Pick a suite</Link>.
            </p>
          )}
          {data && data.cases.length > 0 && (
            <>
              <p className="mono mt-2 text-[13px]">
                {states.map(([s, n]) => (
                  <span key={s || 'new'} className={`mr-4 ${resultClass(s)}`}>
                    {n} {markOf(s).toLowerCase()}
                  </span>
                ))}
                <span className="dim">{retired} retired</span>
              </p>
              <div className="boxed mt-3 px-4 py-2">
                {data.cases.map((c) => (
                  <Link key={c.id} href={`/r/${c.rules_id}`} className="t-line t-row">
                    <span className="id">#{c.id}</span>
                    <span className="what">{c.scenario}</span>
                    <span className="dim text-[12px]">{c.rules_name}</span>
                    <span className="col">{c.expected}</span>
                    {c.status === 'RETIRED' ? <span className="mk dim">[RETIRED]</span> : <span className={`mk ${resultClass(c.result)}`}>[{markOf(c.result)}]</span>}
                  </Link>
                ))}
              </div>
            </>
          )}
        </section>

        <section>
          <p className="c-eyebrow">my rule sets</p>
          {data && data.owned.length === 0 && (
            <p className="c-muted mt-3 text-[13.5px]">
              You own none. <Link href="/r#register" className="c-link">Register one</Link>.
            </p>
          )}
          {data && data.owned.length > 0 && (
            <div className="boxed mt-3 px-4 py-2">
              {data.owned.map((r) => (
                <Link key={r.id} href={`/r/${r.id}`} className="t-line t-row">
                  <span className="id">/r/{r.id}</span>
                  <span className="what">{r.name} <span className="dim">v{r.version}</span></span>
                  <span className="dim text-[12px]">pool {gen(r.pool)}</span>
                  <span className="mk"><SuiteWord suite={r.suite} /></span>
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>
    </WalletGate>
  );
}
