'use client';

import Link from 'next/link';
import { useState } from 'react';

import { gen } from '@/lib/format';
import { refreshReads, send, type TxState } from '@/lib/write';

import { Tx } from './Terminal';
import { WalletGate, useWallet } from './Wallet';

const MAX_SCENARIO = 240;

type Outcome = { id: number; label: string; result: string; bounty: string } | null;

const SAYS: Record<string, string> = {
  PASS: 'the label matches your expectation, stake returned',
  FAIL: 'the label is the opposite, stake returned, the owner is told',
  UNCLEAR: 'the rules do not settle it, stake returned and the bounty to you if the pool has it',
};

/** The command line: type a scenario, commit to ALLOW or BLOCK, run it. Two transactions: add_case with the 1 GEN stake, then run. */
export function AddCase({ rulesId, version, slots, stake, bounty }: { rulesId: number; version: number; slots: number; stake: string; bounty: string }) {
  const w = useWallet();
  const [scenario, setScenario] = useState('');
  const [expected, setExpected] = useState<'ALLOW' | 'BLOCK'>('BLOCK');
  const [addTx, setAddTx] = useState<TxState>({ phase: 'idle' });
  const [runTx, setRunTx] = useState<TxState>({ phase: 'idle' });
  const [caseId, setCaseId] = useState(0);
  const [outcome, setOutcome] = useState<Outcome>(null);
  const [loadError, setLoadError] = useState('');
  const busy = addTx.phase === 'signing' || addTx.phase === 'deciding' || runTx.phase === 'signing' || runTx.phase === 'deciding';
  const full = slots <= 0;

  async function runIt(id: number) {
    const out = await send(w.account, 'run', [id], 0n, setRunTx);
    await refreshReads(['rules', `rules:${rulesId}`, `cases:${rulesId}`, `case:${id}`]);
    w.refreshBalance();
    if (out.phase === 'done') {
      try {
        const response = await fetch(`/api/case?id=${id}`);
        const body = await response.json();
        if (!response.ok) throw new Error(body.error ?? 'read failed');
        setOutcome({ id, label: body.label, result: body.result, bounty: body.bounty });
      } catch {
        setLoadError('The run is decided; reload the suite to read the result.');
      }
    }
  }

  async function submit() {
    setOutcome(null);
    setLoadError('');
    const added = await send(w.account, 'add_case', [rulesId, scenario.trim(), expected], BigInt(stake), setAddTx);
    if (added.phase !== 'done') return;
    const id = Number(added.returned);
    setCaseId(id);
    await refreshReads(['rules', `rules:${rulesId}`, `cases:${rulesId}`]);
    await runIt(id);
  }

  return (
    <div className="grid gap-6">
      <div>
        <p className="t-prompt">dryrun add --rules {rulesId}</p>
        <p className="c-muted mt-2 text-[13px]">
          rules v{version} loaded · {40 - slots} of 40 case slots used · stake {gen(stake)}
        </p>
      </div>
      <WalletGate action="add a case">
        <div>
          <label className="c-label" htmlFor="scenario">scenario &gt;</label>
          <textarea
            id="scenario"
            className="c-textarea"
            style={{ minHeight: 96 }}
            maxLength={MAX_SCENARIO}
            value={scenario}
            onChange={(e) => setScenario(e.target.value)}
            placeholder="A member shares a podcast they appeared on in the main channel"
            disabled={full}
          />
          <p className="mono mt-1 text-right text-[11.5px] dim">{scenario.length} of {MAX_SCENARIO} characters</p>
        </div>
        <div>
          <p className="c-label">expected &gt;</p>
          <div className="flex gap-3" role="group" aria-label="expected answer">
            {(['ALLOW', 'BLOCK'] as const).map((e) => (
              <button key={e} type="button" className={`c-btn ${expected === e ? 'on' : ''}`} aria-pressed={expected === e} onClick={() => setExpected(e)}>
                {e}
              </button>
            ))}
          </div>
          <p className="c-muted mt-2 text-[12.5px]">Commit to a prediction before the run. If the rules say nothing, the validators say UNCLEAR and that finding is yours.</p>
        </div>
        {full && <p className="bad text-[13px]">this rule set already has 40 live cases. retire one first.</p>}
        <div className="flex flex-wrap items-center gap-3">
          <button className="c-btn solid" disabled={busy || full || scenario.trim().length === 0} onClick={submit}>
            run it, {gen(stake)}
          </button>
          <Link href={`/r/${rulesId}`} className="c-btn ghost">
            cancel
          </Link>
        </div>

        <div className="mono text-[13px]">
          {addTx.phase !== 'idle' && (
            <p className={addTx.phase === 'done' ? 'ok' : addTx.phase === 'refused' || addTx.phase === 'error' ? 'bad' : 'warn'}>
              {addTx.phase === 'done' ? `[ok] case ${caseId} added, stake held` : addTx.phase === 'signing' ? 'waiting for the wallet ...' : addTx.phase === 'deciding' ? 'adding the case ...' : addTx.message}
              {addTx.hash ? <> {' '}<Tx hash={addTx.hash} /></> : null}
            </p>
          )}
          {runTx.phase !== 'idle' && (
            <p className={runTx.phase === 'done' ? 'ok' : runTx.phase === 'refused' || runTx.phase === 'error' ? 'bad' : 'warn'}>
              {runTx.phase === 'done' ? `$ dryrun run --case ${caseId}` : runTx.phase === 'signing' ? 'waiting for the wallet ...' : runTx.phase === 'deciding' ? 'validators reading ...' : runTx.message}
              {runTx.hash ? <> {' '}<Tx hash={runTx.hash} /></> : null}
            </p>
          )}
          {outcome && (
            <p className={outcome.result === 'PASS' ? 'ok' : outcome.result === 'FAIL' ? 'bad' : 'warn'}>
              [{outcome.result === 'UNCLEAR' ? 'UNCL' : outcome.result}] label {outcome.label} · {SAYS[outcome.result] ?? ''}
              {outcome.result === 'UNCLEAR' && outcome.bounty !== '0' ? ` · bounty ${gen(outcome.bounty)} credited to you` : ''}
            </p>
          )}
          {loadError && <p className="warn">{loadError}</p>}
          {(addTx.phase === 'done' && (runTx.phase === 'refused' || runTx.phase === 'error')) && (
            <p className="c-muted">The case is added, its stake is held, and anyone can run it from the suite page.</p>
          )}
        </div>
      </WalletGate>
      <div className="c-note">
        <p>
          <span className="ok">[PASS]</span> the label matches your expectation, stake returned
        </p>
        <p>
          <span className="bad">[FAIL]</span> the label is the opposite, stake returned, the owner is told
        </p>
        <p>
          <span className="warn">[UNCL]</span> the rules do not settle it, stake returned and {gen(bounty)} bounty to you
        </p>
      </div>
      {outcome && (
        <Link href={`/r/${rulesId}`} className="t-cmd">
          dryrun read --rules {rulesId}
        </Link>
      )}
    </div>
  );
}
