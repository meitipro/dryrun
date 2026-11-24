#!/usr/bin/env python3
"""
Seed the deployed contract with realistic rule sets and real cases, and keep the record.

    python scripts/seed.py            # four rule sets: a green suite, an amber one, a red one, and one that is fixed and re-run
    python scripts/seed.py --report   # rewrite docs/seed.studio-next.md from the record

Every label comes from the deployed judge through real consensus; nothing here
decides one. After each run the script reads the case back and records what the
contract said, not what was hoped, and what the colour of a suite turns out to
be is whatever the cases say. The author of the red suite makes a wrong
prediction on purpose, which is how a case fails. The accounts are test accounts
and the people and the communities are fictional (docs/seed.md says so).

Every step is written to docs/seed.studio-next.json before anything is
printed, so a crash never loses a transaction that exists on chain, and a
rerun resumes where the last one stopped. Accounts live in ~/.dryrun/accounts.json;
only addresses are printed.
"""

from __future__ import annotations

import datetime
import json
import sys

import chain as C

sys.stdout.reconfigure(encoding="utf-8", errors="replace")

RECORD = C.ROOT / "docs" / "seed.studio-next.json"
GEN = 10**18
POOL = 10 * GEN
ACCOUNTS = ["seed_owner", "seed_ana", "seed_ben", "seed_cam"]

CONDUCT = {
    "name": "Seed: member conduct",
    "rules": "1. Be respectful, no harassment.\n2. Members must be 18 or older.\n3. No spam.",
    "cases": [
        ("Someone aged 17 asks to join", "BLOCK"),
        ("A member asks a question about gas fees", "ALLOW"),
        ("A member posts the same advert for their token in ten channels", "BLOCK"),
    ],
}
PROMO = {
    "name": "Seed: promotion",
    "rules": "Members may not promote other projects in the main channel.",
    "v2": "Members may not promote other projects in the main channel. Sharing a podcast, article or talk that a member appeared in counts as promoting it.",
    "cases": [
        ("A member posts an ad for their own token in the main channel", "BLOCK"),
        ("A member shares a podcast they appeared on in the main channel", "BLOCK"),
        ("A member asks about gas fees in the main channel", "ALLOW"),
    ],
}
RESPECT = {
    "name": "Seed: tone",
    "rules": "Members must be respectful.",
    "cases": [
        ("A member calls another member an idiot in the main channel", "BLOCK"),
        ("A member replies to a newcomer with a sarcastic remark", "BLOCK"),
        ("A member thanks another member for their help", "ALLOW"),
    ],
}
AGE = {
    "name": "Seed: age",
    "rules": "Members must be 18 or older.",
    "cases": [
        ("Someone aged 25 asks to join", "ALLOW"),
        # A wrong prediction on purpose: the rules clearly forbid it, and the author expects them to allow it.
        ("Someone aged 17 asks to join", "ALLOW"),
    ],
}


def now_iso() -> str:
    return datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def load() -> dict:
    if RECORD.exists():
        return json.loads(RECORD.read_text(encoding="utf-8"))
    return {"network": C.NETWORK, "contract": C.address(), "steps": [], "rule_sets": {}, "cases": {}}


def save(record: dict) -> None:
    RECORD.parent.mkdir(parents=True, exist_ok=True)
    RECORD.write_text(json.dumps(record, indent=2, ensure_ascii=False) + "\n", encoding="utf-8", newline="\n")


def done(record: dict, key: str) -> dict | None:
    return next((s for s in record["steps"] if s["key"] == key and s.get("ok")), None)


def step(record: dict, key: str, chain: C.Chain, method: str, args: list, value: int = 0, note: str = "") -> dict:
    """Send once, record the outcome before printing, and never send a finished step again."""
    known = done(record, key)
    if known:
        print(f"{key}: already done {known['hash']}")
        return known
    outcome = chain.send(C.address(), method, args, value)
    row = {
        "key": key,
        "method": method,
        "from": chain.account.address,
        "ok": outcome["ok"],
        "hash": outcome["hash"],
        "returned": outcome["result"] if isinstance(outcome["result"], (int, str, type(None))) else None,
        "refusal": outcome["refusal"],
        "detail": outcome["detail"],
        "at": now_iso(),
        "note": note,
    }
    record["steps"].append(row)
    save(record)
    print(f"{key}: {'ok' if outcome['ok'] else 'FAILED ' + outcome['detail']} {C.EXPLORER}/tx/{outcome['hash']}")
    if not outcome["ok"]:
        raise SystemExit(f"{key} did not succeed: {outcome['detail']}")
    return row


def snapshot(record: dict, tag: str, reader: C.Chain, rid: int) -> dict:
    rules = reader.read_json(C.address(), "get_rules", [rid])
    cases = reader.read_json(C.address(), "list_cases", [rid])["cases"]
    record["rule_sets"][tag] = {
        "id": rid,
        "name": rules["name"],
        "version": rules["version"],
        "suite": rules["suite"],
        "counts": rules["counts"],
        "pool": rules["pool"],
        "bounties_paid": rules["bounties_paid"],
    }
    for c in cases:
        record["cases"][f"{tag}:{c['id']}"] = {k: c[k] for k in ("id", "scenario", "expected", "label", "result", "ran_result", "status", "bounty", "ran_version", "author")}
    save(record)
    print(f"  {tag}: rule set {rid} v{rules['version']} {rules['suite']} {rules['counts']}")
    return rules


def build(record, tag, spec, owner, author_of, runner, reader, prefix):
    """Register, fund, add and run the cases of one rule set. Returns its id and its case ids."""
    reg = step(record, f"{tag}:register", owner, "register_rules", [spec["name"], spec["rules"]])
    rid = int(reg["returned"])
    step(record, f"{tag}:fund", owner, "fund_pool", [rid], POOL, note="the bounty pool")
    ids = []
    for n, (scenario, expected) in enumerate(spec["cases"]):
        added = step(record, f"{tag}:add{n + 1}", author_of[n % len(author_of)], "add_case", [rid, scenario, expected], GEN)
        ids.append(int(added["returned"]))
    for n, cid in enumerate(ids):
        step(record, f"{tag}:run{n + 1}", runner, "run", [cid], note="run by someone other than its author")
    snapshot(record, tag, reader, rid)
    return rid, ids


def seed() -> None:
    record = load()
    people = C.accounts(*ACCOUNTS)
    chains = {name: C.Chain(people[name]) for name in ACCOUNTS}
    reader = C.Chain()
    for chain in chains.values():
        chain.ensure(chain.account.address, 80)
    owner, ana, ben, cam = (chains[n] for n in ACCOUNTS)

    # -- GREEN: every live case passes
    green, green_ids = build(record, "conduct", CONDUCT, owner, [ana], ben, reader, "conduct")
    # a case that is retired by its author, to show a retired case stays visible
    extra = step(record, "conduct:add_extra", ana, "add_case", [green, "A member posts spam in a direct message", "BLOCK"], GEN)
    step(record, "conduct:retire_extra", ana, "retire_case", [int(extra["returned"])], note="the author retires a case that has not run: the stake comes back")
    snapshot(record, "conduct", reader, green)

    # -- AMBER, then fixed: a gap is found, the owner updates the rules, the cases run again
    promo, promo_ids = build(record, "promo", PROMO, cam, [ana, ben, cam], owner, reader, "promo")
    first = reader.read_json(C.address(), "get_rules", [promo])
    record["rule_sets"]["promo"]["before_fix"] = {"version": first["version"], "suite": first["suite"], "counts": first["counts"]}
    save(record)
    if first["counts"]["unclear"] > 0 or first["counts"]["fail"] > 0:
        step(record, "promo:update", cam, "update_rules", [promo, PROMO["v2"]], note="the owner closes the gap")
        stale = reader.read_json(C.address(), "get_rules", [promo])
        record["rule_sets"]["promo"]["after_update"] = {"version": stale["version"], "suite": stale["suite"], "counts": stale["counts"]}
        save(record)
        for n, cid in enumerate(promo_ids):
            step(record, f"promo:rerun{n + 1}", owner, "run", [cid], note="run again on version 2")
        snapshot(record, "promo", reader, promo)

    # -- AMBER: the rules are underspecified, so the suite stays amber
    snapshot(record, "tone", reader, build(record, "tone", RESPECT, owner, [ben], cam, reader, "tone")[0])

    # -- RED: a prediction the rules contradict
    build(record, "age", AGE, ben, [ana], owner, reader, "age")

    # -- money: authors take what the suites paid them
    for name, chain in (("ana", ana), ("ben", ben), ("cam", cam), ("owner", owner)):
        me = chain.account.address.lower()
        owed = 0
        for key, c in record["cases"].items():
            if c["author"].lower() == me:
                owed = int(reader.read_json(C.address(), "get_case", [c["id"]])["author_balance"])
                break
        if owed == 0:
            for r in record["rule_sets"].values():
                got = reader.read_json(C.address(), "get_rules", [r["id"]])
                if got["owner"].lower() == me:
                    owed = int(got["owner_balance"])
                    break
        if owed > 0 and not done(record, f"{name}:withdraw"):
            step(record, f"{name}:withdraw", chain, "withdraw", [], note="stakes that came back and bounties earned")
    report()


def report() -> None:
    record = load()
    explorer = C.EXPLORER

    def link(h: str) -> str:
        return f"[{h[:10]}…]({explorer}/tx/{h})" if h else ""

    lines = [
        "# Seed",
        "",
        f"Written by `python scripts/seed.py` against the Dryrun contract [`{record.get('contract', '')}`]({explorer}/address/{record.get('contract', '')}) on Studio Next. "
        "Every label below was produced by the deployed judge through real consensus, and the script recorded what the contract said, not what was hoped.",
        "",
        "The communities and the people are fictional and exist only for this demonstration. The accounts are test accounts. "
        "The age suite is red on purpose: its author predicts ALLOW for a 17 year old under a rule that clearly forbids it.",
        "",
        "## Rule sets",
        "",
        "| Rule set | Name | Version | Suite | Pass | Unclear | Fail | Stale | Pool | Bounties paid |",
        "|---|---|---|---|---|---|---|---|---|---|",
    ]
    for tag, r in record.get("rule_sets", {}).items():
        c = r["counts"]
        lines.append(f"| {r['id']} | {r['name']} | {r['version']} | **{r['suite']}** | {c['pass']} | {c['unclear']} | {c['fail']} | {c['stale']} | {int(r['pool']) / GEN} GEN | {int(r['bounties_paid']) / GEN} GEN |")
    promo = record.get("rule_sets", {}).get("promo", {})
    if promo.get("before_fix"):
        b = promo["before_fix"]
        a = promo.get("after_update", {})
        lines += [
            "",
            f"The promotion rules were read first as version {b['version']}, a **{b['suite']}** suite ({b['counts']['pass']} pass, {b['counts']['unclear']} unclear, {b['counts']['fail']} fail). "
            f"The owner then wrote version {a.get('version', '?')}, which turned every live case **STALE** ({a.get('counts', {}).get('stale', '?')} stale), and every case ran again.",
        ]
    lines += ["", "## Cases", "", "| Rule set | Case | Scenario | Expected | Label | Result | Bounty |", "|---|---|---|---|---|---|---|"]
    for key, c in record.get("cases", {}).items():
        tag = key.split(":")[0]
        rid = record["rule_sets"][tag]["id"]
        result = c["status"] if c["status"] == "RETIRED" else c["result"]
        lines.append(f"| {rid} | {c['id']} | {c['scenario']} | {c['expected']} | {c['label'] or '-'} | {result or 'not run'} | {int(c['bounty']) / GEN} GEN |")
    lines += ["", "## Money", ""]
    for s in record["steps"]:
        if s["method"] in ("withdraw", "fund_pool"):
            lines.append(f"- {s['key']}: {link(s['hash'])} {'(' + s['note'] + ')' if s.get('note') else ''}")
    lines += ["", "## Every step", ""]
    for s in record["steps"]:
        lines.append(f"- `{s['key']}` {s['method']} {'ok' if s['ok'] else 'FAILED'} {link(s['hash'])} {s['at']}")
    lines.append("")
    out = C.ROOT / "docs" / "seed.studio-next.md"
    out.write_text("\n".join(lines), encoding="utf-8", newline="\n")
    print("wrote", out.relative_to(C.ROOT).as_posix())


if __name__ == "__main__":
    if "--report" in sys.argv:
        report()
    else:
        seed()
