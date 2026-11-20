import 'server-only';
import { createHash, timingSafeEqual } from 'node:crypto';
import { cookies } from 'next/headers';

export const ADMIN_COOKIE = 'admin_session';

export function sessionValue() {
  const password = process.env.ADMIN_PASSWORD;
  if (!password) throw new Error('ADMIN_PASSWORD is not configured');
  return createHash('sha256').update(password).digest('hex');
}

export function passwordMatches(candidate: string) {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) return false;
  const a = Buffer.from(createHash('sha256').update(candidate).digest('hex'));
  const b = Buffer.from(createHash('sha256').update(expected).digest('hex'));
  return timingSafeEqual(a, b);
}

export async function isAdmin() {
  try {
    const value = (await cookies()).get(ADMIN_COOKIE)?.value;
    if (!value) return false;
    const a = Buffer.from(value);
    const b = Buffer.from(sessionValue());
    return a.length === b.length && timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

export function isSameOrigin(request: Request) {
  const origin = request.headers.get('origin');
  if (!origin) return true;
  return origin === new URL(request.url).origin;
}
