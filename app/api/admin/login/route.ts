import { NextResponse } from 'next/server';
import { ADMIN_COOKIE, isSameOrigin, passwordMatches, sessionValue } from '@/lib/admin-auth';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  if (!isSameOrigin(request)) return NextResponse.json({ error: 'അനുവദനീയമല്ല' }, { status: 403 });
  const body = await request.json().catch(() => ({}));
  if (!passwordMatches(typeof body.password === 'string' ? body.password : '')) {
    await new Promise((resolve) => setTimeout(resolve, 650));
    return NextResponse.json({ error: 'പാസ്‌വേഡ് തെറ്റാണ്' }, { status: 401 });
  }
  const response = NextResponse.json({ ok: true });
  response.cookies.set(ADMIN_COOKIE, sessionValue(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: 60 * 60 * 24 * 30,
  });
  return response;
}
