# Dryrun

**A test suite for the rules your community writes in plain English.** On GenLayer.

An owner registers a rule set of at most 2,000 characters and funds a bounty pool. Anyone adds scenarios with the answer they expect, `ALLOW` or `BLOCK`, and a stake of 1 GEN. GenLayer validators read the rules and one scenario and answer one label: `ALLOW`, `BLOCK` or `UNCLEAR`. The contract computes the rest: each case is `PASS`, `FAIL`, `UNCLEAR` or `STALE`, the suite is `GREEN`, `AMBER` or `RED`, and a scenario that exposes a gap in the rules earns its author a bounty. A rule is tested before it is enforced, the way code has tests.

- **Network:** GenLayer Studio Next, chain 61997 (`0xF22D`)
- **Contract:** [`0x7e18514fF9D907b48d7e9588B02F188320E48DFa`](https://explorer-studio-dev.genlayer.com/address/0x7e18514fF9D907b48d7e9588B02F188320E48DFa), deployed in [`0xdf68ab84…4ba9`](https://explorer-studio-dev.genlayer.com/tx/0xdf68ab84185438a442531f42008f22f5ad01d543d8b937caa34b446ebedb4ba9)
- **Source:** `contracts/dryrun.py`, sha256 in `contracts/FROZEN.json`, held to the deployed bytes by `scripts/verify.py`

## How it works

| Result | Meaning | Money |
|---|---|---|
| `PASS` | the label is the expectation | the stake comes back |
| `FAIL` | the label is the opposite | the stake comes back, the case is flagged for the owner |
| `UNCLEAR` | the rules do not settle it | the stake comes back, the author earns 2 GEN from the pool |
| `STALE` | the rules changed after the last run | run it again |

| Suite | When |
|---|---|
| `GREEN` | at least one live case, and every live case passes on the current rules |
| `RED` | any live case fails on the current rules |
| `AMBER` | everything else: a gap, a stale case, a case that has not run, or an empty suite |

- A rule set is at most 2,000 characters, versioned on every update, owned by one address. Updating the rules marks every live case `STALE`.
- A case is at most 240 characters with an expected `ALLOW` or `BLOCK` and a stake of exactly 1 GEN, up to 40 live cases per rule set. The owner or the author can retire a case.
- Validators compare the one label and nothing else. The result and the colour are computed in code, so GREEN always means the same thing.
- `run` is open to anyone, on purpose, and the caller is recorded. The stake and the bounty go to the case's author.
- Money moves in one place: `add_case` and `fund_pool` take value in, everything else moves balances, `withdraw` is the only payout.

One contract, ten methods: `register_rules`, `update_rules`, `fund_pool`, `add_case`, `run`, `retire_case`, `withdraw` and the views `get_rules`, `get_case`, `list_cases`.

## What was measured

Every number below was read from a file in this repository or from the chain.

| | |
|---|---|
| Offline tests | 165 passed (116 direct, 49 static), 5 live read-only tests skipped without `DRYRUN_INTEGRATION=1` (`pytest`) |
| Mutation testing | 60 of 60 defences broken one at a time and caught, each naming its test (`docs/MUTATIONS.md`) |
| Golden scenarios | **8 of 10** matched through real consensus (`eval/results.md`) |
| Held-out scenarios | H1 `UNCLEAR`, H2 `UNCLEAR`, H3 `BLOCK`, run once, reported as they came out, no expected label |
| Deployed source vs repository | identical (`python scripts/verify.py`) |

The golden set missed two scenarios, and both are published as they came out. Case 1 (`A member posts an ad for their token`, rules: no promotion in the main channel, expected `BLOCK`) came back `UNCLEAR`: the scenario names no channel and the rule names only the main one. Case 7 (`A podcast shared in the off topic channel`, same rules, expected `UNCLEAR`) came back `ALLOW`. Both readings are defensible, which is exactly what a suite is for. Nothing was tuned: the prompt is the spec's, word for word, and `eval/golden.json` was hashed before the first run (`eval/golden.lock.json`). One earlier smoke run is recorded in `eval/results.md` and is not scored.

## Where the spec is loose

- A case that has not run has no result, so it keeps the suite `AMBER`; an empty suite is `AMBER`, never `GREEN`.
- The bounty is paid whole or not at all (2 GEN, only while the pool holds 2 GEN), once per case, so re-running after an update cannot farm it. The stake comes back once.
- Retiring a case that never ran returns its stake.
- The spec has no method to take a pool back out, so the pool leaves the contract only as bounties. See `/docs/more/limitations`.

## A note about the runtime

The spec's `py-genlayer:5jycge4q…` header is rejected by the live network (`invalid_contract runner malformed`). This contract uses the GenVM v0.4 runner header `py-genlayer:kzybg95x…`, and payouts use `gl.chain.Account(address).emit_transfer(value)`, the v0.4 form. The local linter does not know the new runner yet, so it reads a copy of the file with an old header swapped in; only the header differs. The authority on the real header is `gen_getContractSchemaForCode`, which `scripts/deploy.py` calls before every deploy.

## Layout

```text
contracts/dryrun.py         one contract, the judge prompt pinned inside
contracts/FROZEN.json       address, deploy transaction, sha256 of the deployed bytes
tests/                      direct tests, static tests over the parsed source, live read-only tests
eval/                       golden.json (locked), run_golden.py, results.md
scripts/                    deploy, verify, mutate, seed, gen_docs, chain
web/                        Next.js site and /docs (Fumadocs), writes signed in the visitor's wallet
docs/                       mutation table, seed record, reviewer-path record
submission/                 portal text, form fields, evidence links, X post, demo script, 512 px icon
```

## Run it

```bash
python -m venv .venv && .venv/Scripts/pip install -r requirements.txt     # Windows; use bin/ elsewhere
.venv/Scripts/python -m pytest                                            # offline, a few seconds
.venv/Scripts/python scripts/mutate.py --table docs/MUTATIONS.md          # break every defence, name its test
DRYRUN_INTEGRATION=1 .venv/Scripts/python -m pytest tests/test_integration.py   # read the live network
cd web && npm ci && npm run dev                                           # the site on http://localhost:3210
```

## Keys

No private key is on any server or in this repository. Test accounts live in `~/.dryrun/accounts.json` on the build machine, and the scripts print only addresses. The site signs in the visitor's wallet and has no server secret.

## Honest limits

Dryrun predicts what a rule text says about a scenario. It does not enforce a rule, decide what is fair, or replace a human ruling, and a PASS means the text and the expectation agree, not that the rule is wise. A GREEN suite is only as good as its scenarios. See `/docs/more/limitations`.
