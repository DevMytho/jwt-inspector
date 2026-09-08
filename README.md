# 🔐 JWT Inspector

Decode, analyze, and verify JSON Web Tokens — from the terminal or a native desktop app.

## Features

- **Decode** any JWT — header, payload, and signature, fully parsed
- **Analyze** — detects expired tokens, `alg: none` attacks, missing claims, and more
- **Verify** all standard algorithms — HMAC, RSA, ECDSA, and PSS
- **Crack** weak HMAC secrets against a built-in wordlist (`--crack`)
- **CLI** with `--json` output, stdin piping, and scriptable exit codes
- **GUI** — native desktop app (Tauri + React) with a dark-themed inspector

## Quick Start

```bash
# CLI — decode a token
cd cli && npm install
npx tsx src/cli.ts 'eyJhbGciOiJIUzI1NiIs...'

# GUI — open the desktop app
cd gui && npm install
npm run tauri dev
```

## Documentation

| Guide | What's inside |
|-------|---------------|
| **[CLI README](cli/README.md)** | Full CLI usage, stdin piping, verification, `--crack`, exit codes, troubleshooting |
| **[GUI README](gui/README.md)** | Setup prerequisites, development workflow, component breakdown, `@core` alias explained |

## Architecture

```
jwt-inspector/
├── core/              # Shared library — zero build step, raw .ts
│   ├── decode.ts      #   base64url decode, header/payload parsing
│   ├── analyze.ts     #   security analysis (expiry, alg:none, claims)
│   ├── verify.ts      #   HMAC + RSA + ECDSA signature verification (jose)
│   ├── crack.ts       #   weak-secret brute-force (built-in wordlist)
│   └── index.ts       #   re-exports
│
├── cli/               # Terminal tool — [docs →](cli/README.md)
│   └── src/
│       ├── cli.ts     #   commander-based CLI entry point
│       └── format.ts  #   chalk-colored terminal output
│
└── gui/               # Desktop app — [docs →](gui/README.md)
    ├── src/           #   React frontend (Tauri + Vite)
    └── src-tauri/     #   Rust backend (Tauri v2)
```

**Key design:** `core/` is a standalone TypeScript library consumed as raw `.ts` by both CLI (via `tsx`) and GUI (via a Vite `@core` alias). No build step for core — it's always source-of-truth.

## Algorithm Support

| Algorithm | Decode | Analyze | Verify |
|-----------|--------|---------|--------|
| HS256/384/512 (HMAC) | ✅ | ✅ | ✅ |
| RS256/384/512 (RSA PKCS#1 v1.5) | ✅ | ✅ | ✅ |
| PS256/384/512 (RSA-PSS) | ✅ | ✅ | ✅ |
| ES256/384/512 (ECDSA) | ✅ | ✅ | ✅ |
| none | ✅ | ✅ (critical) | ✅ |

## CLI Examples

```bash
# Decode with JSON output
npx tsx src/cli.ts --json 'eyJhbGciOiJIUzI1NiIs...'

# Verify HMAC signature
npx tsx src/cli.ts -s 'my-secret' 'eyJhbGciOiJIUzI1NiIs...'

# Verify RSA with public key
npx tsx src/cli.ts -s "$(cat public.pem)" 'eyJhbGciOiJSUzI1NiIs...'

# Pipe from stdin
cat token.txt | npx tsx src/cli.ts -s 'my-secret' --json

# Brute-force weak secrets
npx tsx src/cli.ts --crack 'eyJhbGciOiJIUzI1NiIs...'

# Custom wordlist
npx tsx src/cli.ts --crack --wordlist rockyou-top1000.txt TOKEN
```

## GUI Quick Test

The GUI includes three built-in test tokens you can load with one click:

| Button | What it tests |
|--------|---------------|
| **Valid HS256** | Healthy token — all checks pass, signature valid |
| **Expired HS256** | Token past its `exp` — error finding |
| **alg:none** | Unsigned token — critical security finding |

## CI/CD

- **On push/PR to `main`**: typecheck + build for CLI, GUI, and Tauri (Linux, macOS, Windows)
- **On tag push (`v*`)**: builds Tauri binaries for all platforms → GitHub Release

```bash
# Trigger a release
git tag v0.1.0
git push origin v0.1.0
```
