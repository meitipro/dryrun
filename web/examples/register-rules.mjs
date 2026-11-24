/**
 * Register a rule set from a script, signing with a local test account.
 *
 *   node examples/register-rules.mjs <account name> <rules.json> [--dry]
 *
 * rules.json holds { "name", "rules" }, the shape of examples/rules.json.
 * With --dry nothing is sent: it prints the call and the fee deposit the SDK estimates for it.
 * The site's own signing code (lib/genlayer-core.mjs) does the work, through a stand-in EIP-1193 wallet.
 */
import fs from 'node:fs';

import { CONTRACT, feesFor, outcomeOf, submit, waitDecided, walletClient } from '../lib/genlayer-core.mjs';
import { ensureAccount, standinWallet } from '../scripts/standin-wallet.mjs';

const [name, file, ...flags] = process.argv.slice(2);
if (!name || !file) {
  console.error('usage: node examples/register-rules.mjs <account name> <rules.json> [--dry]');
  process.exit(2);
}
const set = JSON.parse(fs.readFileSync(file, 'utf8'));
ensureAccount(name);
const { address, provider } = standinWallet(name);
const client = walletClient(address, provider);
const args = [set.name, set.rules];

if (flags.includes('--dry')) {
  const fees = await feesFor(client, 'register_rules', address);
  console.log(JSON.stringify({ contract: CONTRACT, method: 'register_rules', from: address, name: set.name, rule_chars: set.rules.length, feeValue: String(fees.feeValue) }));
  await new Promise((r) => setTimeout(r, 200));
  process.exit(0);
}
const hash = await submit(client, { method: 'register_rules', args, value: 0n, sender: address });
const outcome = outcomeOf(await waitDecided(client, hash, 'register_rules'));
console.log(JSON.stringify({ hash, ok: outcome.ok, rules_id: outcome.returned ?? null, refusal: outcome.refusal || null }));
process.exit(outcome.ok ? 0 : 1);
