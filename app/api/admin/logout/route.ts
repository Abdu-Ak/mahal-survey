import { NextResponse } from 'next/server';
import { ADMIN_COOKIE, isSameOrigin } from '@/lib/admin-auth';

export async function POST(request: Request) {
  if (!isSameOrigin(request)) return NextResponse.json({ error: 'അനുവദനീയമല്ല' }, { status: 403 });
  const response = NextResponse.json({ ok: true });
  response.cookies.set(ADMIN_COOKIE, '', { httpOnly: true, expires: new Date(0), path: '/', sameSite: 'strict' });
  return response;
}
