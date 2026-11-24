import { MePanel } from '@/components/MePanel';

export const metadata = { title: 'My rules and cases' };

export default function MePage() {
  return (
    <div className="c-wrap py-8 md:py-12">
      <p className="t-prompt">dryrun me</p>
      <h1 className="t-head mt-3">My rules and cases</h1>
      <p className="c-muted mt-3 max-w-[44em] text-[14px] leading-relaxed">Cases by state, bounties earned, your balance and the one place money leaves the contract.</p>
      <div className="mt-8">
        <MePanel />
      </div>
    </div>
  );
}
