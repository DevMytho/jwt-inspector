// base64url helpers (no Node dependency — works in browser too)

function base64UrlToBytes(b64url: string): Uint8Array {
  // Convert base64url → base64
  let b64 = b64url.replace(/-/g, "+").replace(/_/g, "/");
  while (b64.length % 4) b64 += "=";
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

function bytesToBase64Url(bytes: Uint8Array): string {
  let binary = "";
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

// ---- public API ----

export interface JwtHeader {
  alg: string;
  typ?: string;
  [key: string]: unknown;
}

export interface JwtPayload {
  sub?: string;
  iss?: string;
  aud?: string | string[];
  exp?: number;
  nbf?: number;
  iat?: number;
  jti?: string;
  [key: string]: unknown;
}

export interface DecodedJwt {
  raw: string;
  header: JwtHeader;
  payload: JwtPayload;
  signatureBytes: Uint8Array;
  segments: [string, string, string];
}

export function decodeJwt(token: string): DecodedJwt {
  const parts = token.split(".");
  if (parts.length < 2 || parts.length > 3) {
    throw new Error(`Invalid JWT: expected 2 or 3 dot-separated segments, got ${parts.length}`);
  }

  const [headerB64, payloadB64, sigB64] = parts as [string, string, string?];

  let header: JwtHeader;
  let payload: JwtPayload;

  try {
    header = JSON.parse(new TextDecoder().decode(base64UrlToBytes(headerB64)));
  } catch {
    throw new Error("Invalid JWT header: base64url decode or JSON parse failed");
  }

  try {
    payload = JSON.parse(new TextDecoder().decode(base64UrlToBytes(payloadB64)));
  } catch {
    throw new Error("Invalid JWT payload: base64url decode or JSON parse failed");
  }

  const signatureBytes = sigB64 ? base64UrlToBytes(sigB64) : new Uint8Array(0);

  return {
    raw: token,
    header,
    payload,
    signatureBytes,
    segments: [headerB64, payloadB64, sigB64 ?? ""],
  };
}

export function encodeBytesBase64Url(bytes: Uint8Array): string {
  return bytesToBase64Url(bytes);
}
