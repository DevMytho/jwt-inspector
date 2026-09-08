# JWT Inspector — Desktop GUI

A native desktop app for decoding, analyzing, and verifying JWT tokens. Built with Tauri v2 (Rust backend) + React + TypeScript (Vite frontend).

## Prerequisites

- **Node.js** ≥ 18
- **Tauri system dependencies** — see [Tauri prerequisites](https://v2.tauri.app/start/prerequisites/)

> **You do NOT need Rust installed.** Tauri handles the Rust compilation automatically during `npm run tauri dev` and `npm run tauri build`. Rust is only required if you want to modify the `src-tauri/` backend code directly.

### Platform-Specific Dependencies

<details>
<summary><strong>Ubuntu / Debian</strong></summary>

```bash
sudo apt update
sudo apt install -y libwebkit2gtk-4.1-dev build-essential curl wget file \
  libxdo-dev libssl-dev libayatana-appindicator3-dev librsvg2-dev
```
</details>

<details>
<summary><strong>macOS</strong></summary>

Xcode Command Line Tools (usually pre-installed):
```bash
xcode-select --install
```
</details>

<details>
<summary><strong>Windows</strong></summary>

- [Microsoft Visual Studio C++ Build Tools](https://visualstudio.microsoft.com/visual-cpp-build-tools/)
- [WebView2](https://developer.microsoft.com/en-us/microsoft-edge/webview2/) (usually pre-installed on Windows 10/11)
</details>

## Setup

```bash
cd gui
npm install
```

## Development

```bash
npm run tauri dev
```

This starts the Vite dev server on `http://localhost:1420` with hot module replacement, and opens a native Tauri window pointing to it. Changes to React components hot-reload instantly.

**If the Tauri window doesn't open**, try:
1. Check that all platform dependencies are installed (see above)
2. Run `npm run tauri dev` again — first build compiles the Rust backend (~1-2 min)
3. Check the terminal for Rust compilation errors

**Browser-only mode**: You can also develop without Tauri by running just the Vite server:
```bash
npx vite --port 1420
```
Then open `http://localhost:1420` in any browser. The JWT inspection features work identically — Tauri is only needed for the native window wrapper.

## Building for Production

```bash
npm run tauri build
```

Creates a platform-specific installer:
- **Linux**: `.deb` and `.AppImage` in `src-tauri/target/release/bundle/`
- **macOS**: `.app` and `.dmg` in `src-tauri/target/release/bundle/macos/`
- **Windows**: `.msi` and `.exe` in `src-tauri/target/release/bundle/msi/`

## Architecture

```
gui/
├── src/                    # React frontend (TypeScript)
│   ├── App.tsx             #   Main shell — wires all components together
│   ├── App.css             #   Full dark-theme styling
│   ├── main.tsx            #   React entry point (renders <App />)
│   ├── inspector.ts        #   Shared logic: inspectToken(), TEST_TOKENS
│   ├── TokenInput.tsx      #   Textarea + secret field + quick-test buttons
│   ├── ClaimsView.tsx      #   Decoded header/payload tables
│   └── FindingsList.tsx    #   Severity-colored analysis findings + verification
│
├── src-tauri/              # Rust backend (Tauri v2)
│   ├── src/
│   │   ├── main.rs         #   Tauri entry point
│   │   └── lib.rs          #   Tauri setup + any Rust commands
│   ├── Cargo.toml          #   Rust dependencies
│   └── tauri.conf.json     #   Tauri configuration
│
├── index.html              #   HTML shell
├── vite.config.ts          #   Vite config with @core alias
├── tsconfig.json           #   TypeScript config with @core paths
└── package.json            #   Node dependencies
```

### How `@core` Works

The GUI imports directly from `../core/` (the shared library) via a Vite alias:

```typescript
// In any GUI source file:
import { decodeJwt, analyzeJwt, verifyJwt } from "@core/index.js";
```

This resolves at build time to `../core/index.ts` — no build step needed for core. The same TypeScript source is used by both CLI and GUI.

The `@core` alias is configured in three places:
1. `vite.config.ts` — `resolve.alias` + `server.fs.allow`
2. `tsconfig.json` — `paths` with `baseUrl`
3. `vite.config.ts` — `optimizeDeps.exclude` (prevents Vite from pre-bundling core)

## Components

### `TokenInput`

- Large textarea for pasting JWT tokens
- Optional secret input for HMAC/RSA/ECDSA verification
- Three quick-test buttons that load pre-made tokens:
  - **Valid HS256** — healthy token, all checks pass
  - **Expired HS256** — expired token, shows error finding
  - **alg:none** — unsigned token, shows critical finding

### `ClaimsView`

Displays the decoded JWT in two side-by-side tables:
- **Header**: algorithm, type, and any custom header claims
- **Payload**: subject, issuer, audience, expiry, issued-at, and any custom claims

On mobile (< 600px), the tables stack vertically.

### `FindingsList`

Renders each analysis finding as a color-coded card:

| Color | Severity | Examples |
|-------|----------|----------|
| 🔴 Red | CRIT | `ALG_NONE`, `NO_SIGNATURE` |
| 🔴 Dark red | ERR | `TOKEN_EXPIRED`, `TOKEN_NOT_YET_VALID` |
| 🟡 Yellow | WARN | `NO_EXPIRY`, `NO_ISSUER`, `NO_AUDIENCE` |
| 🔵 Blue | INFO | `ALG_HMAC`, `TOKEN_VALID`, `HAS_ISSUER` |

If `--verify` is used (secret provided), a verification result badge appears below findings:
- ✅ **VALID** (green) — signature matches
- ❌ **INVALID** (red) — signature doesn't match or verification failed

### `inspector.ts`

Shared logic module that both components use:

```typescript
import { inspectToken, TEST_TOKENS } from "./inspector.js";

// Inspect a token (decode + analyze + optional verify)
const result = await inspectToken(token, secret);

// Pre-made test tokens
const validToken = TEST_TOKENS.valid.token;
```

## Styling

The app uses a dark theme with CSS custom colors:

- **Background**: `#0f0f1a` (deep navy)
- **Cards**: `#16162a` with `#2a2a40` borders
- **Claim keys**: `#9090ff` (light indigo)
- **Claim values**: `#c8e6c8` (soft green, monospace)
- **Accent**: `#5b5bff` (buttons, focus rings)

Fonts: system UI for body text, `Fira Code` / `JetBrains Mono` for code/claims.

## Troubleshooting

### "npm run tauri dev" fails with Rust errors

First build compiles the Rust backend. If it fails:
1. Ensure all platform dependencies are installed (see Prerequisites)
2. Check that Rust is installed: `rustc --version`
3. If Rust is missing, install via [rustup](https://rustup.rs/): `curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh`

### Vite dev server starts but Tauri window is blank

- Check the browser DevTools console (right-click → Inspect in the Tauri window)
- Look for import errors — usually a missing `@core` alias or wrong import path
- Try restarting: kill the dev server and run `npm run tauri dev` again

### "Core works: {...}" doesn't render

The `@core` alias isn't resolving. Check:
1. `vite.config.ts` has `resolve.alias` with `@core` → `../core`
2. `vite.config.ts` has `server.fs.allow: [".."]`
3. `tsconfig.json` has `paths["@core/*"]`
4. `core/` has `node_modules` (run `cd ../core && npm install`)

### Hot reload not working

Vite's HMR should handle React component changes. If it stops:
1. Check that `src-tauri/` is in the `watch.ignored` list in `vite.config.ts`
2. Restart the dev server

### Building fails with "tauri: command not found"

Run `npm install` again — the `@tauri-apps/cli` package provides the `tauri` command.

## Package Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Vite dev server only (no Tauri window) |
| `npm run tauri dev` | Start Vite + Tauri native window with hot reload |
| `npm run build` | Type-check + Vite production build |
| `npm run tauri build` | Full production build (frontend + native installer) |
| `npm run tauri` | Run any Tauri CLI command (e.g., `npm run tauri icon`) |
