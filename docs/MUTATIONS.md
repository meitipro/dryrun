# Mutations

Written by `python scripts/mutate.py --table docs/MUTATIONS.md`. 60 defences in
`contracts/dryrun.py` were each broken on their own, and every mutant was caught. Each row
names the first test that failed against it, read from pytest's report rather than an exit code.
The generated-files, frozen-deployment and private-key tests are excluded, because the first two
fail for any edit at all and the last reads files, not the contract.

Two checks are deliberately not mutated, because no test can tell the mutant from the original.
The validator's test that the leader's payload is a dict with a label from the closed set: the
label comparison right below it already refuses anything else. And read_label's test that a label
is in the closed set: the validator's check refuses such a label first, so it can never reach
storage. Both stay so that nothing depends on how the runtime treats an exception raised inside
a validator.

| # | defence broken | caught by |
|---|---|---|
| 1 | update_rules: any account may update | `tests/test_direct.py::test_only_the_owner_may_update_the_rules` |
| 2 | fund_pool: any account may fund | `tests/test_direct.py::test_only_the_owner_may_fund_the_pool` |
| 3 | retire_case: any account may retire | `tests/test_direct.py::test_nobody_else_may_retire_a_case` |
| 4 | register_rules: the owner is a fixed address | `tests/test_direct.py::test_register_rules_records_the_owner_and_version_one` |
| 5 | add_case: the author is a fixed address | `tests/test_direct.py::test_add_case_records_the_scenario_the_expectation_and_the_author` |
| 6 | run: the caller is not recorded | `tests/test_direct.py::test_run_is_open_to_anyone_and_records_the_caller` |
| 7 | retire_case: the retirer is not recorded | `tests/test_direct.py::test_the_owner_may_retire_any_case` |
| 8 | withdraw: pays a fixed address | `tests/test_direct.py::test_withdraw_pays_the_whole_balance_once` |
| 9 | add_case: any stake is accepted | `tests/test_direct.py::test_the_stake_is_exactly_one_gen[0]` |
| 10 | fund_pool: funding nothing is accepted | `tests/test_direct.py::test_funding_nothing_is_refused` |
| 11 | fund_pool: the pool is not increased | `tests/test_direct.py::test_an_update_moves_no_money` |
| 12 | withdraw: the balance is not zeroed | `tests/test_direct.py::test_withdraw_pays_the_whole_balance_once` |
| 13 | withdraw: nothing to withdraw is accepted | `tests/test_direct.py::test_withdraw_pays_the_whole_balance_once` |
| 14 | run: the stake is not returned | `tests/test_direct.py::test_the_stake_comes_back_on_every_result[BLOCK]` |
| 15 | run: the stake is returned on every run | `tests/test_direct.py::test_the_stake_comes_back_on_every_result[BLOCK]` |
| 16 | retire_case: the stake of an unrun case is not returned | `tests/test_direct.py::test_retiring_a_case_that_never_ran_returns_the_stake` |
| 17 | run: the bounty goes to whoever ran the case | `tests/test_direct.py::test_an_unclear_result_pays_the_author_the_bounty_from_the_pool` |
| 18 | run: the bounty is paid more than once per case | `tests/test_direct.py::test_the_bounty_is_paid_once_per_case_even_after_an_update` |
| 19 | run: the bounty is paid from an empty pool | `tests/test_direct.py::test_the_result_is_computed_from_the_expectation_and_the_label[BLOCK-UNCLEAR-UNCLEAR]` |
| 20 | run: the bounty is paid on any result but a pass | `tests/test_direct.py::test_a_pass_and_a_fail_pay_no_bounty` |
| 21 | run: the pool is not reduced by a bounty | `tests/test_direct.py::test_an_unclear_result_pays_the_author_the_bounty_from_the_pool` |
| 22 | run: bounties paid are not totalled | `tests/test_direct.py::test_an_unclear_result_pays_the_author_the_bounty_from_the_pool` |
| 23 | add_case: the stake is not recorded | `tests/test_direct.py::test_an_update_moves_no_money` |
| 24 | result_of: a contradicting label is a pass | `tests/test_direct.py::test_an_update_turns_every_live_case_stale` |
| 25 | result_of: an UNCLEAR label is not UNCLEAR | `tests/test_direct.py::test_the_result_is_computed_from_the_expectation_and_the_label[BLOCK-UNCLEAR-UNCLEAR]` |
| 26 | run: the model decides the result | `tests/test_direct.py::test_an_update_turns_every_live_case_stale` |
| 27 | suite_of: a failing case does not make it red | `tests/test_direct.py::test_result_of_and_suite_of_are_pure_functions` |
| 28 | suite_of: an empty suite is green | `tests/test_direct.py::test_register_rules_records_the_owner_and_version_one` |
| 29 | suite_of: any live case makes it green | `tests/test_direct.py::test_result_of_and_suite_of_are_pure_functions` |
| 30 | effective: a result on old rules is not stale | `tests/test_direct.py::test_an_update_turns_every_live_case_stale` |
| 31 | effective: a case that never ran has a result | `tests/test_direct.py::test_an_update_turns_every_live_case_stale` |
| 32 | counts: retired cases count as live | `tests/test_direct.py::test_retiring_a_case_frees_a_slot` |
| 33 | counts: stale cases count as passes | `tests/test_direct.py::test_an_update_turns_every_live_case_stale` |
| 34 | counts: unclear cases count as fails | `tests/test_direct.py::test_an_empty_pool_pays_no_bounty_and_the_case_still_counts` |
| 35 | update_rules: the version is not bumped | `tests/test_direct.py::test_update_rules_bumps_the_version_and_keeps_every_text` |
| 36 | update_rules: the same text is accepted | `tests/test_direct.py::test_updating_to_the_same_text_is_refused` |
| 37 | update_rules: the old text is not kept | `tests/test_direct.py::test_update_rules_bumps_the_version_and_keeps_every_text` |
| 38 | run: a case may run twice on one version | `tests/test_direct.py::test_a_case_runs_once_per_version` |
| 39 | run: a retired case may run | `tests/test_direct.py::test_a_retired_case_cannot_run` |
| 40 | run: the label is not stored | `tests/test_direct.py::test_the_result_is_computed_from_the_expectation_and_the_label[BLOCK-BLOCK-PASS]` |
| 41 | run: the version it ran on is not stored | `tests/test_direct.py::test_an_update_turns_every_live_case_stale` |
| 42 | run: it reads the first version of the rules | `tests/test_direct.py::test_a_case_reads_the_current_rules_not_the_first` |
| 43 | add_case: no cap on live cases | `tests/test_direct.py::test_a_rule_set_has_at_most_forty_live_cases` |
| 44 | add_case: an author may expect UNCLEAR | `tests/test_direct.py::test_an_author_may_only_expect_allow_or_block[UNCLEAR]` |
| 45 | add_case: live cases are not counted | `tests/test_direct.py::test_a_rule_set_has_at_most_forty_live_cases` |
| 46 | add_case: the version it was added on is not recorded | `tests/test_direct.py::test_add_case_records_the_scenario_the_expectation_and_the_author` |
| 47 | add_case: only the last case is listed | `tests/test_direct.py::test_an_update_turns_every_live_case_stale` |
| 48 | retire_case: live cases are not counted down | `tests/test_direct.py::test_retiring_a_case_frees_a_slot` |
| 49 | retire_case: a case may be retired twice | `tests/test_direct.py::test_a_case_is_retired_once` |
| 50 | add_case: the scenario length is unbounded | `tests/test_direct.py::test_a_scenario_is_a_bounded_text[scenario2-the` |
| 51 | register_rules: the rules length is unbounded | `tests/test_direct.py::test_register_rules_refuses_out_of_range_input[kwargs5-the` |
| 52 | update_rules: the rules length is unbounded | `tests/test_direct.py::test_update_rules_is_bounded` |
| 53 | register_rules: the name length is unbounded | `tests/test_direct.py::test_register_rules_refuses_out_of_range_input[kwargs2-name` |
| 54 | fence: delimiters are not neutralised | `tests/test_direct.py::test_hostile_text_cannot_close_its_block` |
| 55 | build_prompt: the scenario is not fenced | `tests/test_direct.py::test_hostile_text_cannot_close_its_block` |
| 56 | build_prompt: the rules are not fenced | `tests/test_direct.py::test_hostile_text_cannot_close_its_block` |
| 57 | validator: any label agrees | `tests/test_direct.py::test_validators_must_agree_on_the_label` |
| 58 | read_label: an empty answer defaults to ALLOW | `tests/test_direct.py::test_an_unreadable_answer_is_never_a_label[]` |
| 59 | ask_model: a formatting slip is not retried | `tests/test_direct.py::test_a_formatting_slip_gets_exactly_one_retry` |
| 60 | get_rules: the totals leave out the pools | `tests/test_direct.py::test_rule_set_zero_answers_the_totals` |
