import { importSPKI, importJWK, jwtVerify } from "jose";
import type { JWK } from "jose";
import type { DecodedJwt } from "./decode.js";

export interface VerifyResult {
  valid: boolean;
  error?: string;
}

// Map JWT alg → JWA algorithm name for jose
const JOSE_ALG_MAP: Record<string, string> = {
  HS256: "HS256",
  HS384: "HS384",
  HS512: "HS512",
  RS256: "RS256",
  RS384: "RS384",
  RS512: "RS512",
  ES256: "ES256",
  ES384: "ES384",
  ES512: "ES512",
  PS256: "PS256",
  PS384: "PS384",
  PS512: "PS512",
};

/**
 * Verify a JWT's signature using the jose library.
 *
 * Supports all standard JWA algorithms:
 * - HMAC: HS256, HS384, HS512 (pass a string secret)
 * - RSA: RS256, RS384, RS512, PS256, PS384, PS512 (pass PEM public key)
 * - ECDSA: ES256, ES384, ES512 (pass PEM public key or JWK)
 * - none: alg=none (unsigned token)
 *
 * @param decoded - The decoded JWT from decodeJwt()
 * @param secretOrKey - For HMAC: a string secret.
 *                      For RSA/ECDSA: a PEM public key string, or a CryptoKey/JWK object.
 */
export async function verifyJwt(
  decoded: DecodedJwt,
  secretOrKey: string | CryptoKey | JWK,
): Promise<VerifyResult> {
  const { header, signatureBytes } = decoded;

  // Handle alg:none
  if (header.alg === "none") {
    if (signatureBytes.length === 0) {
      return { valid: true };
    }
    return { valid: false, error: "alg is \"none\" but a signature is present" };
  }

  const jweAlg = JOSE_ALG_MAP[header.alg];
  if (!jweAlg) {
    return { valid: false, error: `Unsupported algorithm: ${header.alg}` };
  }

  try {
    let key: CryptoKey | Uint8Array;

    if (typeof secretOrKey === "string") {
      const isHmac = header.alg.startsWith("HS");

      if (isHmac) {
        // HMAC: import raw secret bytes
        key = new TextEncoder().encode(secretOrKey);
      } else {
        // RSA/ECDSA: treat string as PEM public key
        // Strip PEM headers/footers to detect format, then import
        const pem = secretOrKey.trim();
        if (pem.startsWith("-----BEGIN")) {
          key = await importSPKI(pem, jweAlg);
        } else {
          // Assume raw base64url or JWK
          try {
            const jwk = JSON.parse(pem) as JWK;
            key = await importJWK(jwk, jweAlg);
          } catch {
            return { valid: false, error: "Invalid key format — expected PEM, JWK, or string secret" };
          }
        }
      }
    } else if (typeof secretOrKey === "object" && "kty" in secretOrKey) {
      // It's a JWK
      key = await importJWK(secretOrKey as JWK, jweAlg);
    } else {
      // CryptoKey
      key = secretOrKey as CryptoKey;
    }

    // Reconstruct the compact JWT for jose
    const compact = `${decoded.segments[0]}.${decoded.segments[1]}.${decoded.segments[2]}`;
    const { payload: _payload } = await jwtVerify(compact, key as any, {
      algorithms: [jweAlg],
    });

    return { valid: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return { valid: false, error: `Verification failed: ${msg}` };
  }
}
