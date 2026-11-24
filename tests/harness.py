"""
Loads the REAL contract file against the doubles in genvm_double.py.

Nothing is copied or re-implemented here, so a change to contracts/dryrun.py
is a change to what these tests exercise. The runner comment on the first lines
of the contract is ignored by CPython, so the file imports as ordinary Python.
"""

from __future__ import annotations

import datetime
import importlib.util
import json
import os
import pathlib
import sys
import types

HERE = pathlib.Path(__file__).resolve().parent
ROOT = HERE.parent
#: DRYRUN_CONTRACT points the suite at a mutant; scripts/mutate.py sets it.
CONTRACT = pathlib.Path(os.environ.get("DRYRUN_CONTRACT") or ROOT / "contracts" / "dryrun.py")

sys.path.insert(0, str(HERE))

import genvm_double as D  # noqa: E402

GEN = 10**18
HOUR = 3600
DAY = 86400

#: 2026-09-01T00:00:00Z. Every world starts here.
T0 = 1788220800


def _install(gl: D.GL) -> None:
    """
    Publish a `genlayer` package shaped like the Studio Next runtime: the star
    import brings Address and the integer types, `import genlayer as gl` is the
    package itself, and the storage names live in genlayer.storage. An import
    the contract left out fails here rather than on chain.
    """
    storage = types.ModuleType("genlayer.storage")
    storage.TreeMap = D.TreeMap
    storage.DynArray = D.DynArray
    storage.allow = D.allow_storage
    module = types.ModuleType("genlayer")
    module.Address = D.Address
    for name in ("u8", "u16", "u32", "u64", "u256"):
        setattr(module, name, getattr(D, name))
    for name in ("contract", "vm", "message", "public", "nondet", "evm", "chain"):
        setattr(module, name, getattr(gl, name))
    module.storage = storage
    module.__all__ = ["Address", "u8", "u16", "u32", "u64", "u256"]
    sys.modules["genlayer"] = module
    sys.modules["genlayer.storage"] = storage


def load(gl: D.GL, path: pathlib.Path | None = None, name: str = "dryrun_contract") -> types.ModuleType:
    """Import the contract fresh against this gl."""
    _install(gl)
    spec = importlib.util.spec_from_file_location(name, path or CONTRACT)
    module = importlib.util.module_from_spec(spec)
    sys.modules[spec.name] = module
    spec.loader.exec_module(module)
    return module


def label_answer(label: str) -> str:
    """A model answer, as the model would type it."""
    return json.dumps({"label": label})


class World:
    """
    One Dryrun contract and the accounts around it.

    Time is explicit: `at(seconds)` sets the transaction datetime the contract
    reads. The accounts model value honestly: `sender(address, value)` sends
    value with the call, and `received` totals everything the contract was paid.
    """

    OWNER = "0x" + "a1" * 20
    AUTHOR = "0x" + "b2" * 20
    STRANGER = "0x" + "d4" * 20
    OTHER = "0x" + "e5" * 20

    NAME = "community-rules"
    RULES_LINES = [
        "1. Be respectful, no harassment.",
        "2. Members must be 18 or older.",
        "3. No spam.",
        "4. Members may not promote other projects in the main channel.",
        "5. Moderators must give a reason for removing a post.",
    ]
    RULES = chr(10).join(RULES_LINES)
    RULES_V2 = RULES.replace("4. Members may not promote other projects in the main channel.", "4. Members may not promote other projects in any channel.")
    SCENARIO = "A member posts an ad for their own token in the main channel"
    STAKE = 1 * GEN
    BOUNTY = 2 * GEN

    def __init__(self) -> None:
        self.gl = D.GL()
        self.mod = load(self.gl)
        self.at(T0)
        self.sender(self.OWNER)
        self.c = self.mod.Dryrun()
        self.received = 0

    # -- controls ----------------------------------------------------------

    def at(self, seconds: int) -> "World":
        self.t = int(seconds)
        stamp = datetime.datetime.fromtimestamp(self.t, datetime.timezone.utc)
        self.gl.message.raw["datetime"] = stamp.strftime("%Y-%m-%dT%H:%M:%SZ")
        return self

    def advance(self, seconds: int) -> "World":
        return self.at(self.t + seconds)

    def sender(self, address: str, value: int = 0) -> "World":
        self.gl.message.sender_address = D.Address(address)
        self.gl.message.origin_address = D.Address(address)
        self.gl.message.value = int(value)
        return self

    @property
    def leader(self) -> D.NodeWorld:
        return self.gl.nondet.leader

    @property
    def validators(self) -> list[D.NodeWorld]:
        return self.gl.nondet.validators

    def nodes(self) -> list[D.NodeWorld]:
        return [self.leader, *self.validators]

    # -- shorthands --------------------------------------------------------

    def register(self, name=None, rules=None, who=None) -> int:
        self.sender(who or self.OWNER)
        return int(self.c.register_rules(name if name is not None else self.NAME, rules if rules is not None else self.RULES))

    def update(self, rules=None, rid: int = 1, who=None) -> int:
        self.sender(who or self.OWNER)
        return int(self.c.update_rules(rid, rules if rules is not None else self.RULES_V2))

    def fund(self, amount: int = 20 * GEN, rid: int = 1, who=None) -> int:
        self.sender(who or self.OWNER, amount)
        try:
            out = int(self.c.fund_pool(rid))
        finally:
            self.sender(who or self.OWNER)
        self.received += amount
        return out

    def add(self, scenario=None, expected="BLOCK", rid: int = 1, who=None, value=None) -> int:
        pay = self.STAKE if value is None else int(value)
        self.sender(who or self.AUTHOR, pay)
        try:
            cid = int(self.c.add_case(rid, scenario if scenario is not None else self.SCENARIO, expected))
        finally:
            self.sender(who or self.AUTHOR)
        self.received += pay
        return cid

    def queue(self, label: str, validator=None) -> None:
        """One model answer for the leader and one for each validator."""
        self.leader.answers.append(label_answer(label))
        for world in self.validators:
            world.answers.append(label_answer(validator or label))

    def run(self, label: str, cid: int = 1, validator=None, who=None) -> int:
        self.queue(label, validator=validator)
        self.sender(who or self.STRANGER)
        try:
            return int(self.c.run(cid))
        except D.UserError:
            # A refused call never reached the model; its queued answers must not leak into the next call.
            for node in self.nodes():
                node.answers.clear()
            raise

    def retire(self, cid: int = 1, who=None) -> int:
        self.sender(who or self.OWNER)
        return int(self.c.retire_case(cid))

    def withdraw(self, who=None) -> int:
        self.sender(who or self.AUTHOR)
        return int(self.c.withdraw())

    # -- reads -------------------------------------------------------------

    def rules(self, rid: int = 1) -> dict:
        return json.loads(self.c.get_rules(rid))

    def case(self, cid: int = 1) -> dict:
        return json.loads(self.c.get_case(cid))

    def cases(self, rid: int = 1) -> list[dict]:
        return json.loads(self.c.list_cases(rid))["cases"]

    def balance(self, who: str) -> int:
        return int(self.c.balances.get(D.Address(who), 0))

    def paid_to(self, address: str) -> int:
        return sum(t.value for t in self.gl.bus.transfers if t.to.lower() == address.lower())

    def paid_out(self) -> int:
        return sum(t.value for t in self.gl.bus.transfers)

    def owed(self) -> int:
        """Everything the contract holds for someone: balances, pools, and the stakes of cases that have not paid theirs back."""
        total = 0
        for balance in self.c.balances.values():
            total += int(balance)
        for rule_set in self.c.rule_sets.values():
            total += int(rule_set.pool)
        for case in self.c.cases.values():
            if int(case.stake_back) == 0:
                total += int(case.stake)
        return total

    def balances_add_up(self) -> None:
        """Every wei the contract was paid is either still owed, or was paid out."""
        assert self.received == self.owed() + self.paid_out(), (self.received, self.owed(), self.paid_out())


def refused(prefix: str, fn, *args, **kwargs) -> str:
    """Assert the call is refused, and that the refusal is the sentence it should be."""
    try:
        fn(*args, **kwargs)
    except D.UserError as error:
        message = str(error)
        assert message.startswith("[EXPECTED] "), f"unprefixed refusal: {message}"
        assert prefix in message, f"expected {prefix!r}, got {message!r}"
        return message
    raise AssertionError(f"expected a refusal containing {prefix!r}, nothing was raised")
