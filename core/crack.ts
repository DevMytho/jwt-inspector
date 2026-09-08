import { verifyJwt } from "./verify.js";
import type { DecodedJwt } from "./decode.js";
import type { VerifyResult } from "./verify.js";

export interface CrackResult {
  found: boolean;
  secret?: string;
  attempts: number;
  elapsedMs: number;
  tested: string[];
}

// Built-in weak-secret wordlist — covers the most common JWT secrets
// seen in CTFs, tutorials, and misconfigured production systems.
const DEFAULT_WORDLIST: string[] = [
  // Empty / single char
  "",
  "a", "b", "c", "d", "e", "f", "g", "h", "i", "j",
  "k", "l", "m", "n", "o", "p", "q", "r", "s", "t",
  "u", "v", "w", "x", "y", "z",
  "1", "2", "3", "0",
  // Common secrets
  "secret",
  "password",
  "password1",
  "changeme",
  "123456",
  "12345678",
  "admin",
  "test",
  "qwerty",
  "letmein",
  "welcome",
  "monkey",
  "dragon",
  "master",
  "login",
  "abc123",
  "passw0rd",
  "shadow",
  "mustang",
  "michael",
  "football",
  "baseball",
  "soccer",
  "hockey",
  "batman",
  "trustno1",
  "iloveyou",
  // JWT-specific (from tutorials, docs, blog posts)
  "shhhhh",
  "keyboard cat",
  "mysecret",
  "jwt-secret",
  "jwt_secret",
  "jwtsecret",
  "super-secret",
  "supersecret",
  "super-secret-key",
  "super-secret-key-123",
  "your-256-bit-secret",
  "your-256-bit-secret-here",
  "your-256-bit-secret-here-make-it-long-enough",
  "HS256-secret",
  "my-super-secret",
  "my-super-secret-key",
  "my_secret_key",
  "mysecretkey",
  "verysecret",
  "very-secret",
  "super-supersupersecretkey12345678901234567890",
  // Common development/test secrets
  "dev",
  "development",
  "staging",
  "production",
  "localhost",
  "example",
  "demo",
  "sample",
  // Encoding patterns
  "key",
  "private",
  "token",
  "api-key",
  "apikey",
  "api_key",
  "access",
  "auth",
  "signing-key",
  "signing_key",
  "encryption-key",
  "encryption_key",
  // Numbers
  "0000",
  "1111",
  "1234",
  "12345",
  "654321",
  "987654321",
  // Random common words
  "chocolate",
  "strawberry",
  "purple",
  "rainbow",
  "sunshine",
  "princess",
  "football",
  "shadow",
  "hello",
  "freedom",
  "whatever",
  "nothing",
  "something",
  "anything",
  "everything",
  "qwertyuiop",
  "asdfghjkl",
  "zxcvbnm",
  // Longer patterns
  "superman",
  "spiderman",
  "ironman",
  "password123",
  "admin123",
  "root",
  "toor",
  "pass",
  "pass123",
  "secret123",
  "password!",
  "secret!",
  "admin!",
];

/**
 * Brute-force crack an HMAC-signed JWT against a wordlist.
 *
 * Returns immediately on first match. If no match found, returns
 * with found=false and the full list of tested secrets.
 */
export async function crackJwt(
  decoded: DecodedJwt,
  customWordlist?: string[],
): Promise<CrackResult> {
  const wordlist = customWordlist ?? DEFAULT_WORDLIST;
  const start = performance.now();
  const tested: string[] = [];

  for (const candidate of wordlist) {
    tested.push(candidate);
    const result: VerifyResult = await verifyJwt(decoded, candidate);
    if (result.valid) {
      return {
        found: true,
        secret: candidate,
        attempts: tested.length,
        elapsedMs: performance.now() - start,
        tested,
      };
    }
  }

  return {
    found: false,
    attempts: tested.length,
    elapsedMs: performance.now() - start,
    tested,
  };
}

/**
 * Check if a JWT is crackable (HMAC algorithm).
 * Non-HMAC tokens cannot be brute-forced this way.
 */
export function isCrackable(decoded: DecodedJwt): boolean {
  return decoded.header.alg === "HS256" ||
    decoded.header.alg === "HS384" ||
    decoded.header.alg === "HS512";
}
