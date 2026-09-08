import chalk from "chalk";
import type { Finding, Severity } from "@jwt-inspector/core";

const SEVERITY_COLOR: Record<Severity, typeof chalk.red> = {
  critical: chalk.red.bold,
  error: chalk.red,
  warning: chalk.yellow,
  info: chalk.cyan,
};

const SEVERITY_LABEL: Record<Severity, string> = {
  critical: "CRIT",
  error: "ERR ",
  warning: "WARN",
  info: "INFO",
};

export function formatFinding(f: Finding): string {
  const color = SEVERITY_COLOR[f.severity];
  const label = SEVERITY_LABEL[f.severity];
  return `  ${color(label)}  ${chalk.white(f.code)}: ${f.message}`;
}

export function formatHeader(header: Record<string, unknown>): string {
  const lines: string[] = [];
  for (const [k, v] of Object.entries(header)) {
    lines.push(`  ${chalk.gray(k + ":")} ${chalk.green(JSON.stringify(v))}`);
  }
  return lines.join("\n");
}

export function formatPayload(payload: Record<string, unknown>): string {
  const lines: string[] = [];
  for (const [k, v] of Object.entries(payload)) {
    lines.push(`  ${chalk.gray(k + ":")} ${chalk.green(JSON.stringify(v))}`);
  }
  return lines.join("\n");
}
