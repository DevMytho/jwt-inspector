import type { DecodedJwt } from "./decode.js";

export type Severity = "info" | "warning" | "error" | "critical";

export interface Finding {
  severity: Severity;
  code: string;
  message: string;
}

export interface Analysis {
  findings: Finding[];
  now: number;
}

function push(
  findings: Finding[],
  severity: Severity,
  code: string,
  message: string,
) {
  findings.push({ severity, code, message });
}

export function analyzeJwt(decoded: DecodedJwt): Analysis {
  const findings: Finding[] = [];
  const now = Math.floor(Date.now() / 1000);
  const { header, payload } = decoded;

  // --- algorithm checks ---
  if (header.alg === "none") {
    push(findings, "critical", "ALG_NONE", "Algorithm is \"none\" — token is unsigned and can be forged");
  }
  if (header.alg === "HS256" || header.alg === "HS384" || header.alg === "HS512") {
    push(findings, "info", "ALG_HMAC", `Symmetric HMAC algorithm: ${header.alg}`);
  }
  if (header.alg === "RS256" || header.alg === "RS384" || header.alg === "RS512") {
    push(findings, "info", "ALG_RSA", `Asymmetric RSA algorithm: ${header.alg}`);
  }
  if (header.alg === "ES256" || header.alg === "ES384" || header.alg === "ES512") {
    push(findings, "info", "ALG_EC", `Asymmetric ECDSA algorithm: ${header.alg}`);
  }

  // --- expiry ---
  if (payload.exp !== undefined) {
    if (payload.exp < now) {
      push(findings, "error", "TOKEN_EXPIRED", `Token expired ${now - payload.exp}s ago (exp=${payload.exp})`);
    } else {
      push(findings, "info", "TOKEN_VALID", `Token is valid (expires in ${payload.exp - now}s, exp=${payload.exp})`);
    }
  } else {
    push(findings, "warning", "NO_EXPIRY", "Token has no exp claim — it never expires");
  }

  // --- not-before ---
  if (payload.nbf !== undefined) {
    if (payload.nbf > now) {
      push(findings, "error", "TOKEN_NOT_YET_VALID", `Token not yet valid (nbf=${payload.nbf}, now=${now})`);
    } else {
      push(findings, "info", "TOKEN_ACTIVE", `Token became valid ${now - payload.nbf}s ago (nbf=${payload.nbf})`);
    }
  }

  // --- issued-at sanity ---
  if (payload.iat !== undefined) {
    if (payload.iat > now + 300) {
      push(findings, "warning", "FUTURE_IAT", `iat is in the future (${payload.iat}, now=${now})`);
    }
  }

  // --- issuer ---
  if (payload.iss !== undefined) {
    push(findings, "info", "HAS_ISSUER", `Issuer: ${payload.iss}`);
  } else {
    push(findings, "warning", "NO_ISSUER", "No iss claim");
  }

  // --- audience ---
  if (payload.aud !== undefined) {
    push(findings, "info", "HAS_AUDIENCE", `Audience: ${JSON.stringify(payload.aud)}`);
  } else {
    push(findings, "warning", "NO_AUDIENCE", "No aud claim");
  }

  // --- signature presence ---
  if (decoded.signatureBytes.length === 0 && header.alg !== "none") {
    push(findings, "critical", "NO_SIGNATURE", "Algorithm requires a signature but none was provided");
  }

  return { findings, now };
}
