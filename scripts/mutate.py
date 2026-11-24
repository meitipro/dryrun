#!/usr/bin/env python3
"""
Break every defence in the contract, one at a time, and name the test that notices.

    python scripts/mutate.py                          # run, print the table
    python scripts/mutate.py --table docs/MUTATIONS.md

A passing count is a claim; a table of mutations, each named with the test that
killed it, is evidence. Each mutant is a copy of contracts/dryrun.py with one
defence removed or weakened. The direct and static tests run against it through
DRYRUN_CONTRACT, and the first failing test is recorded as the kill.

A kill is read from pytest's own report of which test failed, never from an
exit code alone: a runner that scores exit codes reports a perfect run while
testing nothing. The generated-files test is left out, because it fails for
ANY edit and would kill every mutant without testing its defence.

If anything escapes, the table is not written and the escapes are printed. An
escape means a missing test, or a defence strict enough elsewhere that this one
can no longer fail, and either is a finding.
"""

from __future__ import annotations

import os
import pathlib
import re
import subprocess
import sys
import tempfile

sys.stdout.reconfigure(encoding="utf-8", errors="replace")

ROOT = pathlib.Path(__file__).resolve().parent.parent
CONTRACT = ROOT / "contracts" / "dryrun.py"

#: (what the mutant does, text in the contract, what replaces it). Each text
#: must occur exactly once, so a mutant always changes exactly one place.
MUTANTS = [
    # who may write
    ("update_rules: any account may update", 'raise gl.vm.UserError(E + "only the owner may update the rules")', "pass"),
    ("fund_pool: any account may fund", 'raise gl.vm.UserError(E + "only the owner may fund the pool")', "pass"),
    ("retire_case: any account may retire", "if me != r.owner and me != c.author:", "if False:"),
    ("register_rules: the owner is a fixed address", "            owner=me,\n            name=clean_name,", "            owner=ZERO,\n            name=clean_name,"),
    ("add_case: the author is a fixed address", "author=gl.message.sender_address,\n            scenario=text,", "author=ZERO,\n            scenario=text,"),
    ("run: the caller is not recorded", "c.ran_by = gl.message.sender_address", "pass"),
    ("retire_case: the retirer is not recorded", "c.retired_by = me", "pass"),
    ("withdraw: pays a fixed address", "gl.chain.Account(me).emit_transfer(amount)", "gl.chain.Account(ZERO).emit_transfer(amount)"),
    # money
    ("add_case: any stake is accepted", "if int(gl.message.value) != STAKE:", "if False:"),
    ("fund_pool: funding nothing is accepted", "if value <= 0:", "if False:"),
    ("fund_pool: the pool is not increased", "r.pool = u256(int(r.pool) + value)", "pass"),
    ("withdraw: the balance is not zeroed", "        self.balances[me] = u256(0)\n", ""),
    ("withdraw: nothing to withdraw is accepted", "if amount <= 0:", "if False:"),
    (
        "run: the stake is not returned",
        "            self._credit(c.author, int(c.stake))\n        if result == UNCLEAR",
        "            pass\n        if result == UNCLEAR",
    ),
    (
        "run: the stake is returned on every run",
        "        if int(c.stake_back) == 0:\n            c.stake_back = u32(1)\n            self._credit(c.author, int(c.stake))\n        if result == UNCLEAR",
        "        if True:\n            self._credit(c.author, int(c.stake))\n        if result == UNCLEAR",
    ),
    (
        "retire_case: the stake of an unrun case is not returned",
        "            c.stake_back = u32(1)\n            self._credit(c.author, int(c.stake))\n        return int(case_id)",
        "            c.stake_back = u32(1)\n        return int(case_id)",
    ),
    ("run: the bounty goes to whoever ran the case", "            self._credit(c.author, BOUNTY)", "            self._credit(gl.message.sender_address, BOUNTY)"),
    ("run: the bounty is paid more than once per case", " and int(c.bounty) == 0", ""),
    ("run: the bounty is paid from an empty pool", " and int(r.pool) >= BOUNTY", ""),
    ("run: the bounty is paid on any result but a pass", "if result == UNCLEAR and", "if result != PASS and"),
    ("run: the pool is not reduced by a bounty", "            r.pool = u256(int(r.pool) - BOUNTY)\n", ""),
    ("run: bounties paid are not totalled", "r.bounties_paid = u256(int(r.bounties_paid) + BOUNTY)", "pass"),
    ("add_case: the stake is not recorded", "stake=u256(STAKE),", "stake=u256(0),"),
    # results and colours, in code
    ("result_of: a contradicting label is a pass", "    if label == expected:\n        return PASS\n    return FAIL", "    if label == expected:\n        return PASS\n    return PASS"),
    ("result_of: an UNCLEAR label is not UNCLEAR", "    if label == UNCLEAR:\n        return UNCLEAR\n", ""),
    ("run: the model decides the result", "result = result_of(c.expected, label)", "result = label"),
    ("suite_of: a failing case does not make it red", "    if failed > 0:\n        return RED\n", ""),
    ("suite_of: an empty suite is green", "if live > 0 and passed == live:", "if passed == live:"),
    ("suite_of: any live case makes it green", "if live > 0 and passed == live:", "if live > 0:"),
    ("effective: a result on old rules is not stale", "        if int(c.ran_version) != int(r.version):\n            return STALE\n", ""),
    ("effective: a case that never ran has a result", '        if int(c.ran_version) == 0:\n            return ""\n', ""),
    ("counts: retired cases count as live", '            if c.status != LIVE:\n                counts["retired"] += 1\n                continue\n', ""),
    ("counts: stale cases count as passes", '                counts["stale"] += 1', '                counts["pass"] += 1'),
    ("counts: unclear cases count as fails", '                counts["unclear"] += 1', '                counts["fail"] += 1'),
    # versions and the run rules
    ("update_rules: the version is not bumped", "r.version = u32(version)", "r.version = r.version"),
    ("update_rules: the same text is accepted", "if text == r.text:", "if False:"),
    ("update_rules: the old text is not kept", 'self.versions[str(int(rules_id)) + "#" + str(version)] = RuleVersion(', "_lost = RuleVersion("),
    ("run: a case may run twice on one version", "if int(c.ran_version) == int(r.version):", "if False:"),
    ("run: a retired case may run", 'raise gl.vm.UserError(E + "this case is retired")', "pass"),
    ("run: the label is not stored", "c.label = label", "pass"),
    ("run: the version it ran on is not stored", "c.ran_version = u32(int(r.version))", "pass"),
    ("run: it reads the first version of the rules", "build_prompt(r.text, c.scenario)", 'build_prompt(self.versions[str(int(c.rules_id)) + "#1"].text, c.scenario)'),
    # caps and bounds
    ("add_case: no cap on live cases", "if int(r.live) >= MAX_LIVE:", "if False:"),
    ("add_case: an author may expect UNCLEAR", "if want not in EXPECTATIONS:", "if False:"),
    ("add_case: live cases are not counted", "r.live = u32(int(r.live) + 1)", "pass"),
    ("add_case: the version it was added on is not recorded", "created_version=u32(int(r.version)),", "created_version=u32(0),"),
    ("add_case: only the last case is listed", 'r.case_ids = (r.case_ids + "\\n" + str(cid)) if r.case_ids != "" else str(cid)', "r.case_ids = str(cid)"),
    ("retire_case: live cases are not counted down", "r.live = u32(int(r.live) - 1)", "pass"),
    ("retire_case: a case may be retired twice", 'raise gl.vm.UserError(E + "this case is already retired")', "pass"),
    ("add_case: the scenario length is unbounded", '_block(scenario, "the scenario", MAX_SCENARIO)', '_block(scenario, "the scenario", 10**9)'),
    ("register_rules: the rules length is unbounded", '        text = _block(rules, "the rules", MAX_RULES)\n        now = self._now()', '        text = _block(rules, "the rules", 10**9)\n        now = self._now()'),
    ("update_rules: the rules length is unbounded", '        text = _block(rules, "the rules", MAX_RULES)\n        if text == r.text:', '        text = _block(rules, "the rules", 10**9)\n        if text == r.text:'),
    ("register_rules: the name length is unbounded", '_line(name, "name", MAX_NAME)', '_line(name, "name", 10**9)'),
    # the judge
    ("fence: delimiters are not neutralised", 'return str(raw).replace("<", "(").replace(">", ")")', "return str(raw)"),
    ("build_prompt: the scenario is not fenced", "scenario=fence(scenario)", "scenario=scenario"),
    ("build_prompt: the rules are not fenced", "rules=fence(rules)", "rules=rules"),
    ("validator: any label agrees", 'return mine["label"] == theirs["label"]', "return True"),
    ("read_label: an empty answer defaults to ALLOW", 'raise gl.vm.UserError(L + "empty")', 'return "ALLOW"'),
    ("ask_model: a formatting slip is not retried", "        if not error_text(first).startswith(L):\n            raise\n", "        raise\n"),
    # views
    ("get_rules: the totals leave out the pools", 'totals["pool"] += int(other.pool)', "pass"),
]

EXCLUDED = [
    "tests/test_static.py::test_generated_files_are_what_the_generator_writes",
    "tests/test_static.py::test_the_site_reads_the_frozen_deployment",
    "tests/test_static.py::test_no_private_key_in_the_repository",
]


def first_failure(output: str) -> str | None:
    for line in output.splitlines():
        match = re.match(r"FAILED (\S+)", line.strip())
        if match:
            return match.group(1).split(" - ")[0]
    return None


def main() -> int:
    source = CONTRACT.read_text(encoding="utf-8")
    rows: list[tuple[int, str, str]] = []
    escapes: list[str] = []
    with tempfile.TemporaryDirectory() as folder:
        mutant = pathlib.Path(folder) / "dryrun.py"
        for index, (what, old, new) in enumerate(MUTANTS, 1):
            count = source.count(old)
            if count != 1:
                raise SystemExit(f"mutant {index} ({what}) matches {count} places; it must match exactly one")
            mutant.write_text(source.replace(old, new), encoding="utf-8", newline="\n")
            env = dict(os.environ, DRYRUN_CONTRACT=str(mutant))
            command = [
                sys.executable, "-m", "pytest", "tests/test_direct.py", "tests/test_static.py",
                "-x", "-q", "--tb=no", "-rf", "-p", "no:cacheprovider",
            ] + [arg for test in EXCLUDED for arg in ("--deselect", test)]
            result = subprocess.run(command, cwd=ROOT, env=env, capture_output=True, text=True, encoding="utf-8")
            killer = first_failure(result.stdout)
            if result.returncode == 0 or killer is None:
                escapes.append(what)
                print(f"  {index:2} ESCAPED  {what}")
            else:
                rows.append((index, what, killer))
                print(f"  {index:2} killed   {what}  <- {killer}")
    if escapes:
        print(f"\n{len(escapes)} mutant(s) escaped; no table written:")
        for what in escapes:
            print(f"  - {what}")
        return 1
    if "--table" in sys.argv:
        target = ROOT / sys.argv[sys.argv.index("--table") + 1]
        lines = [
            "# Mutations",
            "",
            f"Written by `python scripts/mutate.py --table docs/MUTATIONS.md`. {len(rows)} defences in",
            "`contracts/dryrun.py` were each broken on their own, and every mutant was caught. Each row",
            "names the first test that failed against it, read from pytest's report rather than an exit code.",
            "The generated-files, frozen-deployment and private-key tests are excluded, because the first two",
            "fail for any edit at all and the last reads files, not the contract.",
            "",
            "Two checks are deliberately not mutated, because no test can tell the mutant from the original.",
            "The validator's test that the leader's payload is a dict with a label from the closed set: the",
            "label comparison right below it already refuses anything else. And read_label's test that a label",
            "is in the closed set: the validator's check refuses such a label first, so it can never reach",
            "storage. Both stay so that nothing depends on how the runtime treats an exception raised inside",
            "a validator.",
            "",
            "| # | defence broken | caught by |",
            "|---|---|---|",
        ] + [f"| {i} | {what} | `{killer}` |" for i, what, killer in rows]
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_text("\n".join(lines) + "\n", encoding="utf-8", newline="\n")
        print(f"\nwrote {target.relative_to(ROOT).as_posix()}")
    print(f"\n{len(rows)} of {len(MUTANTS)} killed")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
