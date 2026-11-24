/**
 * Read a suite, no wallet and nothing signed.
 *
 *   node examples/read-suite.mjs <rules id>
 *
 * get_rules answers JSON text: the rules, the version, the pool, the suite colour and the counts.
 * list_cases answers every case with its result on the current rules.
 */
import { CONTRACT, readClient, retried } from '../lib/genlayer-core.mjs';

const [id] = process.argv.slice(2);
if (!id) {
  console.error('usage: node examples/read-suite.mjs <rules id>');
  process.exit(2);
}
const client = readClient();
const read = async (functionName) => JSON.parse(String(await retried(() => client.readContract({ address: CONTRACT, functionName, args: [Number(id)] }))));
const rules = await read('get_rules');
const list = await read('list_cases');
console.log(
  JSON.stringify({
    found: rules.found,
    name: rules.name,
    version: rules.version,
    suite: rules.suite,
    counts: rules.counts,
    cases: (list.cases ?? []).map((c) => ({ id: c.id, expected: c.expected, label: c.label, result: c.result })),
  }),
);
