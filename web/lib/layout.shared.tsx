import type { BaseLayoutProps } from 'fumadocs-ui/layouts/shared';

import { gitConfig } from './shared';

export function baseOptions(): BaseLayoutProps {
  return {
    nav: {
      title: (
        <span className="inline-flex items-center gap-2 font-semibold" style={{ fontFamily: 'var(--font-mono)' }}>
          dryrun
          <span className="t-caret-inline" aria-hidden />
          <span className="c-pill ml-1" style={{ height: 22, fontSize: 10.5 }}>
            <span className="dot" />
            Studio Next
          </span>
        </span>
      ),
      url: '/',
    },
    links: [
      { text: 'Suites', url: '/r' },
      { text: 'Bounties', url: '/me' },
    ],
    githubUrl: `https://github.com/${gitConfig.user}/${gitConfig.repo}`,
  };
}
