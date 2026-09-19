import 'server-only';
import crypto from 'crypto';
import { cookies } from 'next/headers';

const COOKIE_NAME = 'navjyoti_gate_session';
const SESSION_SECONDS = 60 * 60 * 12;

function secret() {
  return process.env.ADMIN_PASSWORD || 'navjyoti-admin';
}

function sign(value: string) {
  return crypto.createHmac('sha256', secret()).update(value).digest('hex');
}

export function gatePasswordIsValid(candidate: string) {
  const expected = Buffer.from(secret());
  const actual = Buffer.from(candidate);
  return expected.length === actual.length && crypto.timingSafeEqual(expected, actual);
}

export async function createGateSession() {
  const expires = Math.floor(Date.now() / 1000) + SESSION_SECONDS;
  const payload = `gate_operator:${expires}`;
  const value = `${payload}.${sign(payload)}`;
  const store = await cookies();
  store.set(COOKIE_NAME, value, {
    httpOnly: true,
    sameSite: 'strict',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: SESSION_SECONDS,
  });
}

export async function isGateOperatorAuthorized() {
  const value = (await cookies()).get(COOKIE_NAME)?.value;
  if (!value) return false;
  const separator = value.lastIndexOf('.');
  if (separator < 0) return false;
  const payload = value.slice(0, separator);
  const signature = value.slice(separator + 1);
  const expected = sign(payload);
  if (signature.length !== expected.length || !crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) return false;
  const [role, expires] = payload.split(':');
  return role === 'gate_operator' && Number(expires) > Math.floor(Date.now() / 1000);
}

