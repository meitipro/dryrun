'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

/**
 * The navigation is a vertical rail, like a file tree in a terminal. Five
 * numbered links of real <a> elements, current page marked with aria-current.
 * `last` is the newest rule set, so "add a case" and "history" always lead
 * somewhere; with none yet, both lead to the list where one is registered.
 */
export function RailLinks({ last }: { last: number }) {
  const path = usePathname() ?? '/';
  const add = last ? `/r/${last}/add` : '/r';
  const history = last ? `/r/${last}/history` : '/r';
  const items: [string, string, string, boolean][] = [
    ['01', 'suites', '/r', path === '/r' || (/^\/r\/\d+$/.test(path))],
    ['02', 'add a case', add, /^\/r\/\d+\/add$/.test(path)],
    ['03', 'history', history, /^\/r\/\d+\/history$/.test(path)],
    ['04', 'bounties', '/me', path === '/me'],
    ['05', 'docs', '/docs', path.startsWith('/docs')],
  ];
  return (
    <nav aria-label="Main">
      {items.map(([n, label, href, current]) => (
        <Link key={n} href={href} className="lk" aria-current={current ? 'page' : undefined}>
          <i>{n}</i>
          {label}
        </Link>
      ))}
    </nav>
  );
}
