#!/usr/bin/env node

import { Command } from "commander";
import chalk from "chalk";
import {
  decodeJwt,
  analyzeJwt,
  verifyJwt,
  crackJwt,
  isCrackable,
} from "@jwt-inspector/core";
import { formatFinding, formatHeader, formatPayload } from "./format.js";

const program = new Command();

program
  .name("jwt-inspector")
  .description("Decode, analyze, and verify JWT tokens")
  .version("0.1.0");

program
  .argument("[token]", "JWT token to inspect (or paste from stdin)")
  .option("--json", "Output as JSON instead of human-readable text")
  .option("-s, --secret <secret>", "Secret key for HMAC signature verification")
  .option(
    "--crack",
    "Brute-force weak secrets against the built-in wordlist (HMAC tokens only)",
  )
  .option("--wordlist <file>", "Path to a custom wordlist file for --crack")
  .action(async (tokenArg: string | undefined, opts) => {
    // Get token from argument or stdin
    let token = tokenArg;
    if (!token && !process.stdin.isTTY) {
      // Piped stdin: read until EOF
      const chunks: Buffer[] = [];
      process.stdin.resume();
      for await (const chunk of process.stdin) chunks.push(Buffer.from(chunk));
      token = Buffer.concat(chunks).toString("utf-8").trim();
    }
    if (!token) {
      console.error(
        chalk.red(
          "Error: no token provided. Pass a token as an argument or pipe one via stdin.",
        ),
      );
      process.exit(1);
    }

    try {
      const decoded = decodeJwt(token);
      const analysis = analyzeJwt(decoded);

      // --json mode
      if (opts.json) {
        const output: Record<string, unknown> = {
          header: decoded.header,
          payload: decoded.payload,
          findings: analysis.findings,
        };

        if (opts.secret) {
          const result = await verifyJwt(decoded, opts.secret);
          output.verification = result;
        }

        if (opts.crack) {
          if (isCrackable(decoded)) {
            let wordlist: string[] | undefined;
            if (opts.wordlist) {
              const fs = await import("fs");
              const raw = fs.readFileSync(opts.wordlist, "utf-8");
              wordlist = raw.split("\n").map((l) => l.trim()).filter(Boolean);
            }
            output.crack = await crackJwt(decoded, wordlist);
          } else {
            output.crack = {
              found: false,
              error: `Cannot crack — token uses ${decoded.header.alg}, not HMAC`,
            };
          }
        }

        console.log(JSON.stringify(output, null, 2));
        process.exit(0);
      }

      // Human-readable mode
      console.log(chalk.bold.underline("\nHeader"));
      console.log(formatHeader(decoded.header as Record<string, unknown>));

      console.log(chalk.bold.underline("\nPayload"));
      console.log(formatPayload(decoded.payload as Record<string, unknown>));

      console.log(chalk.bold.underline("\nFindings"));
      if (analysis.findings.length === 0) {
        console.log(chalk.green("  No issues found"));
      } else {
        for (const f of analysis.findings) {
          console.log(formatFinding(f));
        }
      }

      // --verify mode
      let verifyFailed = false;
      if (opts.secret) {
        const result = await verifyJwt(decoded, opts.secret);
        console.log(chalk.bold.underline("\nSignature Verification"));
        if (result.valid) {
          console.log(chalk.green.bold("  ✓ VALID"));
        } else {
          console.log(chalk.red.bold(`  ✗ INVALID — ${result.error}`));
          verifyFailed = true;
        }
      }

      // --crack mode
      if (opts.crack) {
        console.log(chalk.bold.underline("\nCrack Attempt"));
        if (!isCrackable(decoded)) {
          console.log(
            chalk.yellow(
              `  Cannot crack — token uses ${decoded.header.alg}, not HMAC`,
            ),
          );
        } else {
          let wordlist: string[] | undefined;
          if (opts.wordlist) {
            const fs = await import("fs");
            const raw = fs.readFileSync(opts.wordlist, "utf-8");
            wordlist = raw.split("\n").map((l) => l.trim()).filter(Boolean);
            console.log(chalk.gray(`  Loaded ${wordlist.length} words from ${opts.wordlist}`));
          }

          process.stdout.write(chalk.gray("  Testing secrets... "));
          const crackResult = await crackJwt(decoded, wordlist);

          if (crackResult.found) {
            console.log(chalk.red.bold("FOUND!"));
            console.log(
              chalk.green.bold(`\n  ✓ Secret: "${crackResult.secret}"`),
            );
            console.log(
              chalk.gray(
                `  Tested ${crackResult.attempts} secrets in ${crackResult.elapsedMs.toFixed(0)}ms`,
              ),
            );
          } else {
            console.log(chalk.green("not found"));
            console.log(
              chalk.gray(
                `  Tested ${crackResult.attempts} secrets in ${crackResult.elapsedMs.toFixed(0)}ms — token appears strong`,
              ),
            );
          }
        }
      }

      console.log(""); // trailing newline

      // Exit code: non-zero if any error/critical findings or verification failed
      const hasErrors = analysis.findings.some(
        (f) => f.severity === "error" || f.severity === "critical",
      );
      process.exit(hasErrors || verifyFailed ? 1 : 0);
    } catch (err) {
      console.error(chalk.red(`Error: ${String(err)}`));
      process.exit(1);
    }
  });

program.parse();
