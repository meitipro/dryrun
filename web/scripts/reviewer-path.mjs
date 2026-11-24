/**
 * Walk the reviewer's path from fresh accounts, through the site's own code, to finality.
 *
 *   node scripts/reviewer-path.mjs https://<the site> [run-name]
 *
 * Three accounts made for this run, which have never touched the contract:
 *   1. faucet    the site's /api/faucet funds all three, sent the address in lower case
 *   2. register  the owner registers a rule set and funds the bounty pool
 *   3. add       an author adds two cases: a clear one, and the spec's own example of a gap
 *   4. run       a third account runs both; the contract computes the results and the suite colour
 *   5. fix       the owner updates the rules, every case turns STALE, and the cases run again
 *   6. money     after finality the author withdraws; the wallet must have moved by exactly
 *                what the contract owed minus the fee the transaction's own accounting reports
 *   7. read      the site's suite and history pages show what the chain holds
 *
 * Every write goes through lib/genlayer-core.mjs with the stand-in wallet, the
 * code the browser runs. Each step is written to
 * ../docs/reviewer-path.studio-next.json before anything is printed about it.
 * Keys stay in ~/.dryrun/accounts.json and are never printed. The labels are
 * whatever the validators said: the script follows them and invents none.
 */

import fs from 'node:fs';
import path from 'node:path';

import { CONTRACT, outcomeOf, readClient, retried, submit, waitDecided, waitFinal, walletClient } from '../lib/genlayer-core.mjs';
import { balanceOf, ensureAccount, rpc, standinWallet } from './standin-wallet.mjs';

const site = (process.argv[2] ?? '').replace(/\/$/, '');
const run = process.argv[3] ?? 'rp1';
if (!site) {
  console.error('usage: node scripts/reviewer-path.mjs https://<site> [run-name]');
  process.exit(2);
}
const here = path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1'));
const root = path.join(here, '..', '..');
const RECORD = path.join(root, 'docs', 'reviewer-path.studio-next.json');
const record = fs.existsSync(RECORD) ? JSON.parse(fs.readFileSync(RECORD, 'utf8')) : { runs: {} };
const log = (record.runs[run] ??= { site, contract: CONTRACT, started: new Date().toISOString(), steps: [] });
const save = () => fs.writeFileSync(RECORD, JSON.stringify(record, (k, v) => (typeof v === 'bigint' ? v.toString() : v), 2) + '\n');
const GEN = 10n ** 18n;
const fmt = (wei) => `${Number(wei) / 1e18} GEN`;

const RULES = `Reviewer path ${run}: community-rules\n1. Be respectful, no harassment.\n2. Members must be 18 or older.\n3. No spam.\n4. Members may not promote other projects in the main channel.\n5. Moderators must give a reason for removing a post.`;
const RULES_V2 = `${RULES}\n6. Sharing a podcast, article or talk that a member appeared in counts as promoting it.`;
const CLEAR = ['Someone aged 17 asks to join', 'BLOCK'];
const GAP = ['A member shares a podcast they appeared on in the main channel', 'BLOCK'];

const stepDone = (key) => log.steps.find((s) => s.key === key && s.ok);
const recorded = (key) => log.steps.some((s) => s.key === key);
function note(entry) {
  log.steps.push({ at: new Date().toISOString(), ...entry });
  save();
}

const reader = readClient();
async function view(functionName, args) {
  return JSON.parse(String(await retried(() => reader.readContract({ address: CONTRACT, functionName, args }), 5)));
}

/** The net fee a decided transaction cost its sender, from its own fee accounting. */
async function netFee(hash) {
  const tx = await rpc('eth_getTransactionByHash', [hash]).catch(() => null);
  const gen = await rpc('gen_getTransactionByHash', [hash]).catch(() => null);
  const acct = gen?.data?.fee_accounting ?? tx?.data?.fee_accounting;
  if (!acct) return null;
  return BigInt(acct.paid_fee_value ?? 0) - BigInt(acct.total_refunded ?? 0);
}

async function write(key, account, method, args, value = 0n, { final = false } = {}) {
  const prior = stepDone(key);
  if (prior) return prior;
  const { address, provider } = standinWallet(account);
  const client = walletClient(address, provider);
  const started = Date.now();
  const hash = await submit(client, { method, args, value, sender: address });
  const decided = await waitDecided(client, hash, method);
  const outcome = outcomeOf(decided);
  const entry = {
    key,
    method,
    account,
    from: address,
    args: args.map((a) => (typeof a === 'string' && a.length > 60 ? a.slice(0, 57) + '...' : a)),
    value: value.toString(),
    hash,
    ok: outcome.ok,
    status: outcome.status,
    execution: outcome.execution,
    returned: outcome.returned ?? null,
    refusal: outcome.refusal || null,
    seconds_to_decision: Math.round((Date.now() - started) / 1000),
  };
  if (final && outcome.ok) {
    const done = await waitFinal(client, hash);
    entry.final_status = outcomeOf(done).status;
  }
  note(entry);
  console.log(`${key}: ${method} ${entry.ok ? 'ok' : 'NOT OK ' + (entry.refusal ?? entry.status)} in ${entry.seconds_to_decision} s  ${hash}`);
  if (!entry.ok) throw new Error(`${key} failed: ${entry.refusal ?? entry.status}`);
  return entry;
}

// -- accounts ---------------------------------------------------------------------------------
const names = { owner: `review_owner_${run}`, author: `review_author_${run}`, runner: `review_runner_${run}` };
const addr = Object.fromEntries(Object.entries(names).map(([k, n]) => [k, ensureAccount(n)]));
if (!log.accounts) {
  const nonces = {};
  for (const [k, a] of Object.entries(addr)) nonces[k] = Number(await rpc('eth_getTransactionCount', [a, 'latest']));
  log.accounts = { ...addr, nonces_at_start: nonces };
  save();
  console.log(`accounts: ${JSON.stringify(addr)} nonces at start ${JSON.stringify(nonces)}`);
}

// -- 1. faucet, through the site --------------------------------------------------------------
for (const [who, address] of Object.entries(addr)) {
  const key = `faucet-${who}`;
  if (stepDone(key)) continue;
  const response = await fetch(`${site}/api/faucet`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ address: address.toLowerCase() }),
  });
  const body = await response.json().catch(() => ({}));
  const after = await balanceOf(address);
  // 409 is the faucet saying the address already holds enough: what the first, timed-out call of an earlier try had paid.
  const ok = (response.ok && BigInt(body.after ?? 0) > BigInt(body.before ?? 0) && after > 0n) || (response.status === 409 && after >= 10n * GEN);
  note({ key, ok, http: response.status, sent_address: address.toLowerCase(), answered_address: body.address, before: body.before, after: body.after, read_after: after.toString(), error: body.error });
  console.log(`${key}: HTTP ${response.status} ${fmt(BigInt(body.before ?? 0))} -> ${fmt(after)} ${body.error ?? ''}`);
  if (!ok) throw new Error(`${key} did not fund ${address}`);
}

// -- 2. register and fund -----------------------------------------------------------------------
const registered = await write('register', names.owner, 'register_rules', [`Reviewer path ${run}`, RULES]);
const rid = Number(registered.returned);
await write('fund', names.owner, 'fund_pool', [rid], 5n * GEN);

// -- 3. add, 4. run --------------------------------------------------------------------------------
const clear = await write('add-clear', names.author, 'add_case', [rid, ...CLEAR], GEN);
const gap = await write('add-gap', names.author, 'add_case', [rid, ...GAP], GEN);
const clearId = Number(clear.returned);
const gapId = Number(gap.returned);
await write('run-clear', names.runner, 'run', [clearId]);
await write('run-gap', names.runner, 'run', [gapId]);

async function readSuite(key, why) {
  const rules = await view('get_rules', [rid]);
  const cases = (await view('list_cases', [rid])).cases;
  if (!recorded(key)) note({ key, ok: true, why, rules_id: rid, version: rules.version, suite: rules.suite, counts: rules.counts, pool: rules.pool, cases: cases.map((c) => ({ id: c.id, expected: c.expected, label: c.label, result: c.result, bounty: c.bounty })) });
  console.log(`  -> v${rules.version} ${rules.suite} ${JSON.stringify(rules.counts)} ${cases.map((c) => `#${c.id} ${c.label || '-'} ${c.result || 'not run'}`).join(', ')}`);
  return { rules, cases };
}
let state = await readSuite('read-v1', 'both cases have run on version 1');

// -- 5. the owner fixes the rules; every case goes stale; they run again --------------------------------
await write('update', names.owner, 'update_rules', [rid, RULES_V2]);
state = await readSuite('read-stale', 'version 2 was written: every live case is STALE until it runs again');
await write('rerun-clear', names.runner, 'run', [clearId]);
await write('rerun-gap', names.runner, 'run', [gapId]);
state = await readSuite('read-v2', 'both cases ran again on version 2');

// -- 6. the money, to the wei, after finality -------------------------------------------------------------
if (!recorded('balance-author')) {
  const author = await view('get_case', [clearId]);
  const owed = BigInt(author.author_balance);
  if (owed === 0n) {
    note({ key: 'balance-author', ok: true, owed: '0', why: 'nothing was owed, so there was nothing to withdraw' });
  } else {
    const before = await balanceOf(addr.author);
    const w = await write('author-withdraw', names.author, 'withdraw', [], 0n, { final: true });
    const after = await balanceOf(addr.author);
    const fee = await netFee(w.hash);
    const expected = fee === null ? null : before + owed - fee;
    note({ key: 'balance-author', ok: expected === after, owed: owed.toString(), before: before.toString(), after: after.toString(), net_fee: fee?.toString() ?? null, expected: expected?.toString() ?? null, difference: expected === null ? null : (after - expected).toString() });
    console.log(`  author: ${fmt(before)} -> ${fmt(after)}; owed ${fmt(owed)}, fee ${fee === null ? '?' : fmt(fee)}; ${expected === after ? 'exact to the wei' : 'difference ' + (expected === null ? '?' : (after - expected).toString()) + ' wei'}`);
  }
}

// -- 7. the site shows what the chain holds ----------------------------------------------------------------
const pages = [
  ['page-suite', `${site}/r/${rid}`, `Reviewer path ${run}`],
  ['page-history', `${site}/r/${rid}/history`, 'counts as promoting it'],
  ['page-add', `${site}/r/${rid}/add`, 'Add a case'],
];
for (const [key, url, needle] of pages) {
  if (recorded(key)) continue;
  let ok = false;
  let status = 0;
  for (let attempt = 0; attempt < 6 && !ok; attempt++) {
    if (attempt) await new Promise((r) => setTimeout(r, 10000));
    const response = await fetch(url, { cache: 'no-store' });
    status = response.status;
    const html = await response.text();
    ok = response.ok && html.includes(needle);
  }
  note({ key, ok, url, http: status });
  console.log(`${key}: HTTP ${status} ${ok ? 'shows it' : 'MISSING'}  ${url}`);
}

log.finished = new Date().toISOString();
save();
console.log(`\nrecorded in docs/reviewer-path.studio-next.json (run ${run})`);
process.exit(0);
