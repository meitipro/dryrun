/** The JSON the contract's views return. Field names are the contract's own. */

export type Label = 'ALLOW' | 'BLOCK' | 'UNCLEAR';
/** The result of a case on the CURRENT rules: empty before its first run, STALE once the rules have moved on. */
export type Result = '' | 'PASS' | 'FAIL' | 'UNCLEAR' | 'STALE';
export type Suite = 'GREEN' | 'AMBER' | 'RED';
export type CaseStatus = 'LIVE' | 'RETIRED';

export type Totals = { rule_sets: number; cases: number; pool: string; live: number; bounties: string };

export type Counts = { live: number; pass: number; fail: number; unclear: number; stale: number; not_run: number; retired: number };

export type Version = { version: number; text: string; by: string; at: number };

export type RuleSet = {
  found: true;
  totals: Totals;
  id: number;
  owner: string;
  name: string;
  version: number;
  text: string;
  pool: string;
  bounties_paid: string;
  created_at: number;
  updated_at: number;
  suite: Suite;
  counts: Counts;
  versions: Version[];
  owner_balance: string;
};

export type Case = {
  found: true;
  id: number;
  rules_id: number;
  author: string;
  scenario: string;
  expected: 'ALLOW' | 'BLOCK';
  label: '' | Label;
  result: Result;
  /** The result of the last run, whichever version it read. */
  ran_result: '' | 'PASS' | 'FAIL' | 'UNCLEAR';
  status: CaseStatus;
  stake: string;
  stake_back: boolean;
  ran_version: number;
  rules_version: number;
  ran_by: string;
  ran_at: number;
  bounty: string;
  created_at: number;
  created_version: number;
  retired_by: string;
  retired_at: number;
  author_balance?: string;
};

export type CaseList = { found: true; rules_id: number; version: number; cases: Case[] };

export type NotFound = { found: false; totals?: Totals };
