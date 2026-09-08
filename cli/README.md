# JWT Inspector CLI

A terminal tool for decoding, analyzing, verifying, and cracking JWT tokens.

## Installation

```bash
cd cli
npm install
```

No global install needed — run directly via `npx tsx src/cli.ts` or build first with `npm run build`.

## Quick Start

```bash
# Decode a token
npx tsx src/cli.ts 'eyJhbGciOiJIUzI1NiIs...'

# Verify signature
npx tsx src/cli.ts -s 'my-secret' 'eyJhbGciOiJIUzI1NiIs...'

# JSON output
npx tsx src/cli.ts --json 'eyJhbGciOiJIUzI1NiIs...'

# Pipe from stdin
echo 'eyJhbGciOiJIUzI1NiIs...' | npx tsx src/cli.ts --json

# Brute-force weak secrets
npx tsx src/cli.ts --crack 'eyJhbGciOiJIUzI1NiIs...'
```

## Commands & Options

| Option | Description |
|--------|-------------|
| `[token]` | JWT token as a positional argument |
| `--json` | Output as structured JSON instead of formatted text |
| `-s, --secret <key>` | Secret or public key for signature verification |
| `--crack` | Brute-force the token against a built-in weak-secret wordlist |
| `--wordlist <file>` | Path to a custom wordlist file (one secret per line) for `--crack` |

## Stdin Piping

The CLI detects whether stdin is a TTY or a pipe:

```bash
# From a file
cat token.txt | npx tsx src/cli.ts --json

# From another command
curl -s https://api.example.com/auth | npx tsx src/cli.ts -s 'key'

# Combined with --verify
echo "$TOKEN" | npx tsx src/cli.ts -s 'my-secret'

# Combined with --crack
cat captured-token.txt | npx tsx src/cli.ts --crack
```

**If no token is provided and stdin is a TTY (interactive terminal),** the CLI exits with an error instead of hanging. This prevents the common mistake of running `jwt-inspector` without arguments and waiting forever.

## Signature Verification

### HMAC (HS256/HS384/HS512)

Pass the shared secret as a string:

```bash
npx tsx src/cli.ts -s 'my-super-secret-key' 'eyJhbGciOiJIUzI1NiIs...'
```

### RSA (RS256/RS384/RS512/PS256/PS384/PS512)

Pass the PEM-encoded public key. The key can be on multiple lines:

```bash
# From a file
npx tsx src/cli.ts -s "$(cat public.pem)" 'eyJhbGciOiJSUzI1NiIs...'

# Inline (single-line PEM)
npx tsx src/cli.ts -s '-----BEGIN PUBLIC KEY-----MIIBI...-----END PUBLIC KEY-----' TOKEN
```

### ECDSA (ES256/ES384/ES512)

Pass the PEM-encoded public key or a JWK object:

```bash
npx tsx src/cli.ts -s "$(cat ec-public.pem)" 'eyJhbGciOiJFUzI1NiIs...'
```

### alg: none

Tokens with `alg: none` are detected automatically. If you pass `-s` with an unsigned token, verification succeeds (no signature to check).

## Crack Feature (`--crack`)

Brute-forces weak secrets against HMAC-signed tokens using a built-in wordlist of ~140 common secrets (passwords, JWT tutorial defaults, dev/test values).

```bash
npx tsx src/cli.ts --crack 'eyJhbGciOiJIUzI1NiIs...'
```

**Output when found:**
```
Crack Attempt
  Testing secrets... FOUND!

  ✓ Secret: "password"
  Tested 33 secrets in 9ms
```

**Output when not found:**
```
Crack Attempt
  Testing secrets... not found
  Tested 136 secrets in 14ms — token appears strong
```

### Custom Wordlist

```bash
npx tsx src/cli.ts --crack --wordlist rockyou-top1000.txt 'eyJhbGciOiJIUzI1NiIs...'
```

The wordlist file should contain one candidate secret per line. Blank lines are ignored.

### Limitations

- Only works on HMAC tokens (HS256/384/512). RSA/ECDSA tokens cannot be brute-forced this way — the CLI will tell you.
- The built-in wordlist is small (~140 entries) for fast execution. Use `--wordlist` with a larger dictionary for serious cracking.
- This is a v0.2 feature. A future version may add rule-based mutations (appending numbers, common suffixes, etc.).

## Exit Codes

| Code | Meaning |
|------|---------|
| `0` | Success — token is valid, no errors, signature checks out |
| `1` | Failure — token expired, `alg: none`, missing signature, wrong key, or critical finding |

This makes the CLI safe for use in scripts:

```bash
if npx tsx src/cli.ts -s "$JWT_SECRET" "$TOKEN"; then
  echo "Token is valid"
else
  echo "Token is invalid or has errors"
  exit 1
fi
```

## JSON Output (`--json`)

Outputs a single JSON object with `header`, `payload`, `findings`, and optionally `verification` and `crack`:

```json
{
  "header": { "alg": "HS256", "typ": "JWT" },
  "payload": { "sub": "user-42", "exp": 1788869678 },
  "findings": [
    { "severity": "info", "code": "ALG_HMAC", "message": "Symmetric HMAC algorithm: HS256" },
    { "severity": "info", "code": "TOKEN_VALID", "message": "Token is valid (expires in 3557s, exp=1788869678)" }
  ],
  "verification": { "valid": true }
}
```

When `--crack` is used, a `crack` field is added:

```json
{
  "crack": {
    "found": true,
    "secret": "password",
    "attempts": 33,
    "elapsedMs": 9
  }
}
```

## Troubleshooting

### "Cannot find module '@jwt-inspector/core'"

Run `npm install` in both `core/` and `cli/`:

```bash
cd core && npm install && cd ../cli && npm install
```

### "Invalid JWT: expected 2 or 3 dot-separated segments"

The token string isn't a valid JWT. Check that:
- It has exactly 2 or 3 parts separated by dots (`.`)
- It wasn't truncated when copy-pasting
- It's not URL-encoded ( `%2E` instead of `.`)

### Verification hangs or takes forever

This shouldn't happen — HMAC verification is instant. If it does, check that the token isn't extremely large (e.g., contains a JWE payload).

### "Error: no token provided" when piping

Make sure the token is actually being piped. Test with:

```bash
echo 'eyJhbGciOiJIUzI1NiIs...' | npx tsx src/cli.ts
```

If stdin is empty or the pipe broke, you'll get this error.

### --crack says "Cannot crack — token uses RS256, not HMAC"

This is correct. Brute-force cracking only works on HMAC-signed tokens. For RSA/ECDSA, you'd need the private key, which can't be derived from the public key.

### Exit code is always 0

Check that you're not accidentally swallowing the exit code:

```bash
# Wrong — subshell eats the exit code
result=$(npx tsx src/cli.ts -s 'key' "$TOKEN")

# Right — check exit code directly
npx tsx src/cli.ts -s 'key' "$TOKEN"
echo $?
```

## Building

```bash
npm run build      # Compiles to dist/cli.js
npm run typecheck  # Type-checks without emitting
```

The compiled output in `dist/cli.js` requires Node.js ≥ 18 and all dependencies installed. For development, running via `npx tsx src/cli.ts` is recommended.
