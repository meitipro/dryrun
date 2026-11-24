'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { toWei } from '@/lib/format';
import { refreshReads, send, type TxState } from '@/lib/write';

import { Tx } from './Terminal';
import { WalletGate, useWallet } from './Wallet';

const MAX_NAME = 80;
const MAX_RULES = 2000;

function Status({ tx, running }: { tx: TxState; running?: string }) {
  const busy = tx.phase === 'signing' || tx.phase === 'deciding';
  return (
    <div className="mono mt-2 text-[13px]">
      {busy && (
        <p className="warn flex items-center gap-2">
          <span className="c-spin" /> {tx.phase === 'signing' ? 'waiting for the wallet ...' : running ?? 'validators reading ...'}
        </p>
      )}
      {tx.hash && (
        <p>
          <Tx hash={tx.hash} />
        </p>
      )}
      {(tx.phase === 'refused' || tx.phase === 'error') && <p className="bad">{tx.message}</p>}
    </div>
  );
}

function useDone(tags: string[]) {
  const w = useWallet();
  const router = useRouter();
  return async () => {
    await refreshReads(tags);
    w.refreshBalance();
    router.refresh();
  };
}

/** Anyone may call run on a case; the caller is recorded, and the stake and the bounty go to the case's author. */
export function RunButton({ caseId, rulesId, label = 'run' }: { caseId: number; rulesId: number; label?: string }) {
  const w = useWallet();
  const [tx, setTx] = useState<TxState>({ phase: 'idle' });
  const done = useDone(['rules', `rules:${rulesId}`, `cases:${rulesId}`, `case:${caseId}`]);
  const busy = tx.phase === 'signing' || tx.phase === 'deciding';
  if (w.step !== 'ready') {
    return (
      <span className="dim text-[12px]" title="connect a wallet to run a case">
        [{label}]
      </span>
    );
  }
  return (
    <span className="inline-flex flex-col">
      <button
        className="c-btn small"
        disabled={busy}
        onClick={async () => {
          const out = await send(w.account, 'run', [caseId], 0n, setTx);
          if (out.phase === 'done') await done();
        }}
      >
        {busy ? 'validators reading ...' : `$ dryrun ${label} --case ${caseId}`}
      </button>
      {(tx.phase !== 'idle') && <Status tx={tx} />}
    </span>
  );
}

export function RetireButton({ caseId, rulesId }: { caseId: number; rulesId: number }) {
  const w = useWallet();
  const [tx, setTx] = useState<TxState>({ phase: 'idle' });
  const done = useDone(['rules', `rules:${rulesId}`, `cases:${rulesId}`, `case:${caseId}`]);
  const busy = tx.phase === 'signing' || tx.phase === 'deciding';
  if (w.step !== 'ready') return null;
  return (
    <span className="inline-flex flex-col">
      <button
        className="c-btn small ghost"
        disabled={busy}
        onClick={async () => {
          const out = await send(w.account, 'retire_case', [caseId], 0n, setTx);
          if (out.phase === 'done') await done();
        }}
      >
        retire
      </button>
      {(tx.phase === 'refused' || tx.phase === 'error') && <Status tx={tx} />}
    </span>
  );
}

/** The owner funds the bounty pool. The pool leaves the contract only as bounties. */
export function FundForm({ rulesId }: { rulesId: number }) {
  const w = useWallet();
  const [amount, setAmount] = useState('10');
  const [tx, setTx] = useState<TxState>({ phase: 'idle' });
  const done = useDone(['rules', `rules:${rulesId}`]);
  const wei = toWei(amount);
  const busy = tx.phase === 'signing' || tx.phase === 'deciding';
  return (
    <WalletGate action="fund the pool">
      <div className="flex flex-wrap items-end gap-3">
        <div style={{ width: 130 }}>
          <label className="c-label" htmlFor="fund">GEN</label>
          <input id="fund" className="c-input" inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} />
        </div>
        <button
          className="c-btn"
          disabled={busy || !wei || wei <= 0n}
          onClick={async () => {
            if (!wei) return;
            const out = await send(w.account, 'fund_pool', [rulesId], wei, setTx);
            if (out.phase === 'done') await done();
          }}
        >
          $ dryrun fund
        </button>
      </div>
      <Status tx={tx} />
    </WalletGate>
  );
}

/** The owner writes a new version of the rules. Every live case turns STALE until it runs again. */
export function UpdateForm({ rulesId, current }: { rulesId: number; current: string }) {
  const w = useWallet();
  const [text, setText] = useState(current);
  const [tx, setTx] = useState<TxState>({ phase: 'idle' });
  const done = useDone(['rules', `rules:${rulesId}`, `cases:${rulesId}`]);
  const busy = tx.phase === 'signing' || tx.phase === 'deciding';
  const changed = text.trim() !== current.trim() && text.trim().length > 0;
  return (
    <WalletGate action="update the rules">
      <label className="c-label" htmlFor="rules-text">new version of the rules</label>
      <textarea id="rules-text" className="c-textarea" style={{ minHeight: 170 }} maxLength={MAX_RULES} value={text} onChange={(e) => setText(e.target.value)} />
      <p className="mono mt-1 text-right text-[11.5px] dim">{text.length} of {MAX_RULES} characters</p>
      <p className="c-muted mt-2 text-[13px]">Updating bumps the version. Every live case turns STALE and has to run again, so a result is never read against the wrong text.</p>
      <button
        className="c-btn mt-3"
        disabled={busy || !changed}
        onClick={async () => {
          const out = await send(w.account, 'update_rules', [rulesId, text.trim()], 0n, setTx);
          if (out.phase === 'done') await done();
        }}
      >
        $ dryrun update-rules
      </button>
      <Status tx={tx} />
    </WalletGate>
  );
}

/** Register a rule set as version 1. The sender is its owner. */
export function RegisterForm() {
  const w = useWallet();
  const router = useRouter();
  const [name, setName] = useState('');
  const [rules, setRules] = useState('');
  const [tx, setTx] = useState<TxState>({ phase: 'idle' });
  const busy = tx.phase === 'signing' || tx.phase === 'deciding';
  const ready = name.trim().length > 0 && rules.trim().length > 0;
  return (
    <WalletGate action="register a rule set">
      <div className="grid gap-4">
        <div>
          <label className="c-label" htmlFor="rs-name">name</label>
          <input id="rs-name" className="c-input" maxLength={MAX_NAME} value={name} onChange={(e) => setName(e.target.value)} placeholder="community-rules" />
        </div>
        <div>
          <label className="c-label" htmlFor="rs-rules">the rules, in plain English</label>
          <textarea
            id="rs-rules"
            className="c-textarea"
            style={{ minHeight: 170 }}
            maxLength={MAX_RULES}
            value={rules}
            onChange={(e) => setRules(e.target.value)}
            placeholder={'1. Be respectful, no harassment.\n2. Members must be 18 or older.\n3. No spam.'}
          />
          <p className="mono mt-1 text-right text-[11.5px] dim">{rules.length} of {MAX_RULES} characters</p>
        </div>
        <p className="c-muted text-[13px]">Rule sets and scenarios are public and permanent. Write only what can be public.</p>
        <div>
          <button
            className="c-btn solid"
            disabled={busy || !ready}
            onClick={async () => {
              const out = await send(w.account, 'register_rules', [name.trim(), rules.trim()], 0n, setTx);
              if (out.phase === 'done') {
                await refreshReads(['rules']);
                const id = Number(out.returned);
                router.push(Number.isInteger(id) && id > 0 ? `/r/${id}` : '/r');
                router.refresh();
              }
            }}
          >
            $ dryrun register
          </button>
          <Status tx={tx} />
        </div>
      </div>
    </WalletGate>
  );
}
