import { decodeJwt, analyzeJwt, verifyJwt } from "@core/index.js";
import type {
  DecodedJwt,
  Analysis,
  VerifyResult,
} from "@core/index.js";

export interface InspectResult {
  decoded: DecodedJwt;
  analysis: Analysis;
  verification?: VerifyResult;
}

/**
 * Inspect a JWT token — decode, analyze, and optionally verify.
 */
export async function inspectToken(
  token: string,
  secret?: string,
): Promise<InspectResult> {
  const decoded = decodeJwt(token.trim());
  const analysis = analyzeJwt(decoded);

  let verification: VerifyResult | undefined;
  if (secret) {
    verification = await verifyJwt(decoded, secret);
  }

  return { decoded, analysis, verification };
}

/** All three test tokens for demo purposes */
export const TEST_TOKENS = {
  valid: {
    label: "Valid HS256",
    token:
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyLTQyIiwiaXNzIjoiand0LWluc3BlY3Rvci1kZW1vIiwiYXVkIjoidGVzdC1hcHAiLCJleHAiOjE3ODg4Njk2NzgsImlhdCI6MTc4ODg2NjA3OH0.DUtoQXprl396owwwo2y6OBuJwpjrvq8yo4i-GHSRR50",
    secret: "super-secret-key-123",
  },
  expired: {
    label: "Expired HS256",
    token:
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyLTk5IiwiaXNzIjoiand0LWluc3BlY3Rvci1kZW1vIiwiZXhwIjoxNzg4ODYyNDc4LCJpYXQiOjE3ODg4NTg4Nzh9.yrHCBY_Jr7VnztEwU9WmybVMLSRmQmdhQKhCqPmPTJM",
    secret: "super-secret-key-123",
  },
  algNone: {
    label: "alg:none",
    token:
      "eyJhbGciOiJub25lIiwidHlwIjoiSldUIn0.eyJzdWIiOiJhdHRhY2tlciIsImlzcyI6ImV2aWwiLCJleHAiOjE3ODg4Njk2Nzh9.",
    secret: undefined,
  },
} as const;
