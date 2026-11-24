import { NextResponse } from 'next/server';

import { getCase, readError } from '@/lib/read';

/** One case, read fresh from the contract through the cache the site already uses; the add page calls it right after a run is decided. */
export async function GET(request: Request) {
  const id = Number(new URL(request.url).searchParams.get('id'));
  if (!Number.isInteger(id) || id < 1) return NextResponse.json({ error: 'Send a case id.' }, { status: 400 });
  try {
    const c = await getCase(id);
    if (!c.found) return NextResponse.json({ error: 'No such case.' }, { status: 404 });
    return NextResponse.json({ label: c.label, result: c.result, bounty: c.bounty });
  } catch (e) {
    return NextResponse.json({ error: readError(e) }, { status: 502 });
  }
}
