export interface JWTPayload {
  id: string;
  role: string;
  loginId: string;
  exp: number;
  iat: number;
}

const DEFAULT_SECRET = 'ad-campaign-jwt-secret-2026';

async function getKey(secret: string): Promise<CryptoKey> {
  const enc = new TextEncoder();
  return crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify'],
  );
}

function base64url(buf: ArrayBuffer): string {
  return btoa(String.fromCharCode(...new Uint8Array(buf)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

function decodeBase64url(str: string): string {
  str = str.replace(/-/g, '+').replace(/_/g, '/');
  while (str.length % 4) str += '=';
  return atob(str);
}

export async function signToken(
  payload: Omit<JWTPayload, 'iat' | 'exp'>,
  expiresInHours = 24,
  secret = DEFAULT_SECRET,
): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const fullPayload: JWTPayload = {
    ...payload,
    iat: now,
    exp: now + expiresInHours * 3600,
  };

  const header = base64url(
    new TextEncoder().encode(JSON.stringify({ alg: 'HS256', typ: 'JWT' })),
  );
  const body = base64url(
    new TextEncoder().encode(JSON.stringify(fullPayload)),
  );
  const unsigned = `${header}.${body}`;

  const key = await getKey(secret);
  const sig = await crypto.subtle.sign(
    'HMAC',
    key,
    new TextEncoder().encode(unsigned),
  );
  return `${unsigned}.${base64url(sig)}`;
}

export async function verifyToken(
  token: string,
  secret = DEFAULT_SECRET,
): Promise<JWTPayload | null> {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const [header, body, signature] = parts;
    const unsigned = `${header}.${body}`;
    const key = await getKey(secret);

    const sigBytes = Uint8Array.from(
      atob(signature.replace(/-/g, '+').replace(/_/g, '/')),
      (c) => c.charCodeAt(0),
    );
    const valid = await crypto.subtle.verify(
      'HMAC',
      key,
      sigBytes,
      new TextEncoder().encode(unsigned),
    );
    if (!valid) return null;

    const payload: JWTPayload = JSON.parse(decodeBase64url(body));
    if (payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch {
    return null;
  }
}

export function extractToken(authHeader: string | null): string | null {
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  return authHeader.slice(7);
}
