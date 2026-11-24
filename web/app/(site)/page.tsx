import Link from 'next/link';

import { Cmd, Counts, Empty, ReadError, ResultMark, SuiteBar, SuiteWord, Ticker, Addr } from '@/components/Terminal';
import { featuredSuite } from '@/lib/featured';
import { gen } from '@/lib/format';
import { readError } from '@/lib/read';

export const revalidate = 20;

const BANNER = String.raw`██████╗  ██████╗  ██╗   ██╗██████╗  ██╗   ██╗███╗   ██╗
██╔══██╗██╔══██╗╚██╗ ██╔╝██╔══██╗██║   ██║████╗  ██║
██║  ██║██████╔╝ ╚████╔╝ ██████╔╝██║   ██║██╔██╗ ██║
██║  ██║██╔══██╗  ╚██╔╝  ██╔══██╗██║   ██║██║╚██╗██║
██████╔╝██║  ██║   ██║   ██║  ██║╚██████╔╝██║ ╚████║
╚═════╝ ╚═╝  ╚═╝   ╚═╝   ╚═╝  ╚═╝ ╚═════╝ ╚═╝  ╚═══╝`;

const FAQ = [
  ['Is it enforcement?', 'No. Dryrun tests rules, it does not stop anyone from doing anything. A label is a prediction about what the text says, not a ruling on a person.'],
  ['Who can add cases?', 'Anyone, with a stake of 1 GEN that comes back when the case runs. Up to 40 live cases per rule set. The owner or the author can retire a case.'],
  ['What is a bounty?', 'When the validators find that the rules do not settle a scenario, the case is UNCLEAR and its author earns 2 GEN from the owner’s pool, once per case, while the pool has it.'],
  ['What decides PASS or FAIL?', 'The contract, by comparing your expected answer with the validators’ label. The model never says whether a case passed, and never says what colour the suite is.'],
  ['Which network?', 'GenLayer Studio Next, chain 61997. Test GEN is free from the faucet in the site. Every write carries a small fee deposit, most of which is refunded.'],
  ['Is it private?', 'No. Rule sets and scenarios are public and permanent text on chain, so write only what can be public.'],
];

export default async function Landing() {
  let data: Awaited<ReturnType<typeof featuredSuite>> | null = null;
  let error = '';
  try {
    data = await featuredSuite();
  } catch (e) {
    error = readError(e);
  }
  const f = data?.featured ?? null;
  const cases = (data?.cases ?? []).filter((c) => c.status === 'LIVE');
  const shown = cases.slice(0, 8);
  const bountyCase = cases.find((c) => c.bounty !== '0');
  const first = data?.real[data.real.length - 1] ?? null;
  const total = f ? Math.max(1, f.counts.live) : 1;
  const pct = (n: number) => `${Math.round((n * 100) / total)}%`;

  return (
    <div className="c-wrap py-8 md:py-12">
      <section aria-label="a suite, run">
        <div className="win">
          <div className="win-bar">
            <span className="d" /> <span className="d" /> <span className="d" />
            <span className="ml-2">dryrun ~ zsh ~ studio-next</span>
          </div>
          <div className="win-body">
            <pre className="t-pre" aria-label="dryrun">{BANNER}</pre>
            <h1 className="mt-5 text-[15px] font-medium" style={{ color: '#b9f0cb' }}>
              A test suite for the rules your community writes in plain English.
            </h1>
            {error ? (
              <div className="mt-5">
                <ReadError message={error} />
              </div>
            ) : f ? (
              <div className="mt-6">
                <p className="t-prompt">dryrun run {f.name} --version {f.version}</p>
                <p className="dim">loading rules ({f.text.length.toLocaleString('en-US')} chars) ... validators reading ...</p>
                <div className="mt-2">
                  {shown.map((c) => (
                    <div key={c.id} className="t-line">
                      <span className="id">#{c.id}</span>
                      <span className="what">{c.scenario}</span>
                      <span className="col">{c.expected}</span>
                      <span className="col">{c.label || '-'}</span>
                      <ResultMark result={c.result} />
                    </div>
                  ))}
                  {cases.length > shown.length ? <p className="dim mt-1">... {cases.length - shown.length} more</p> : null}
                </div>
                <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2">
                  <span className="dim">suite</span>
                  <div style={{ flex: '1 1 200px', minWidth: 160 }}>
                    <SuiteBar counts={f.counts} />
                  </div>
                  <span className="text-[18px] font-semibold">
                    <SuiteWord suite={f.suite} />
                  </span>
                  <Counts counts={f.counts} />
                </div>
                {bountyCase ? (
                  <p className="mt-3 warn">
                    bounty {gen(bountyCase.bounty)} credited to <Addr address={bountyCase.author} /> for case {bountyCase.id} · pool {gen(f.pool)}
                  </p>
                ) : (
                  <p className="mt-3 dim">pool {gen(f.pool)} · bounty 2 GEN per unclear case</p>
                )}
                <p className="t-prompt mt-4">dryrun add --rules {f.name}</p>
              </div>
            ) : (
              <div className="mt-6">
                <p className="t-prompt">dryrun run community-rules</p>
                <Empty>No rule set on chain yet. Register the first one, and its suite prints here, line by line, with the result of every case.</Empty>
              </div>
            )}
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <Link href="/r#register" className="c-btn solid">
                Register a rule set
              </Link>
              <Link href={f ? `/r/${f.id}` : '/r'} className="c-btn">
                Read a live suite
              </Link>
              <span className="cr" aria-hidden />
            </div>
          </div>
        </div>
      </section>

      <section className="mt-10" aria-label="the bars">
        <div className="grid gap-4 sm:grid-cols-3">
          {([
            ['PASS', f?.counts.pass ?? 0, 'var(--green)', ''],
            ['UNCLEAR', f?.counts.unclear ?? 0, 'var(--amber)', 'warn-bg'],
            ['FAIL', f?.counts.fail ?? 0, 'var(--red)', 'bad-bg'],
          ] as const).map(([name, n, color, cls]) => (
            <div key={name} className="c-card pad">
              <p className="c-eyebrow">{name}</p>
              <p className="mt-2 text-[32px] font-semibold leading-none" style={{ color }}>{n}</p>
              <div className="mt-3" style={{ border: '1px solid var(--line)', background: '#04100a' }}>
                <div className={`br ${cls}`} style={{ ['--w' as string]: pct(n) }} />
              </div>
              <p className="dim mt-2 text-[12px]">{f ? `of ${f.counts.live} live cases in ${f.name}` : 'no suite yet'}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-10" aria-label="live runs">
        <p className="boxed-title">live runs</p>
        <div className="boxed px-4 pb-3 pt-4" style={{ marginTop: -10 }}>
          <Ticker lines={(data?.runs ?? []).map((r) => ({ id: r.id, rules: r.rules, scenario: r.scenario, result: r.result, label: r.label, by: r.by }))} />
        </div>
      </section>

      <section className="mt-14" id="how">
        <p className="t-eyebrow">04 how it works</p>
        <div className="win mt-3">
          <div className="win-body">
            <p><span className="ok">$</span> dryrun register <span className="dim">  # the owner writes the rules and funds a bounty pool</span></p>
            <p><span className="ok">$</span> dryrun add <span className="dim">      # anyone adds a scenario with the answer they expect, and a stake of 1 GEN</span></p>
            <p><span className="ok">$</span> dryrun run <span className="dim">      # validators label it ALLOW, BLOCK or UNCLEAR, and the contract computes the result</span></p>
            <p><span className="ok">$</span> dryrun update-rules <span className="dim"> # the owner fixes the rules, every case turns STALE, run again</span></p>
          </div>
        </div>
      </section>

      <section className="mt-14" id="communities">
        <p className="t-eyebrow">05 for communities</p>
        <h2 className="t-h2 mt-3">Rules that are tested before a member breaks them.</h2>
        <p className="c-muted mt-3 max-w-[46em] text-[14px] leading-relaxed">
          Communities write rules in plain language and discover their gaps in public arguments. Code has tests, policy has none. With Dryrun the owner reads the gaps before a member does, and a scenario that exposes one earns its author a bounty. The suite is GREEN only when every live case passes on the current rules.
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Cmd href="/r#register">dryrun register</Cmd>
          {first ? <Cmd href={`/r/${first.id}/add`}>dryrun add --rules {first.id}</Cmd> : null}
          <Cmd href="/docs/quickstart">dryrun --help</Cmd>
        </div>
      </section>

      <section className="mt-14" id="faq">
        <p className="t-eyebrow">06 faq</p>
        <div className="mt-4 grid gap-6 md:grid-cols-2">
          {FAQ.map(([q, a]) => (
            <div key={q}>
              <p className="font-semibold" style={{ color: '#b9f0cb' }}>
                {q}
              </p>
              <p className="c-muted mt-1.5 text-[13.5px] leading-relaxed">{a}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
