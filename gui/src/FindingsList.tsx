import type { Finding } from "@core/index.js";
import type { VerifyResult } from "@core/index.js";

interface Props {
  findings: Finding[];
  verification?: VerifyResult;
}

const SEVERITY_CLASS: Record<string, string> = {
  critical: "severity-critical",
  error: "severity-error",
  warning: "severity-warning",
  info: "severity-info",
};

const SEVERITY_LABEL: Record<string, string> = {
  critical: "CRIT",
  error: "ERR",
  warning: "WARN",
  info: "INFO",
};

export function FindingsList({ findings, verification }: Props) {
  return (
    <div className="findings-list">
      <h3>Findings ({findings.length})</h3>
      <ul>
        {findings.map((f, i) => (
          <li key={i} className={SEVERITY_CLASS[f.severity] ?? "severity-info"}>
            <span className="finding-severity">
              {SEVERITY_LABEL[f.severity] ?? f.severity.toUpperCase()}
            </span>
            <span className="finding-code">{f.code}</span>
            <span className="finding-message">{f.message}</span>
          </li>
        ))}
      </ul>

      {verification !== undefined && (
        <div className={`verification ${verification.valid ? "valid" : "invalid"}`}>
          <strong>
            Signature: {verification.valid ? "✓ VALID" : `✗ INVALID — ${verification.error}`}
          </strong>
        </div>
      )}
    </div>
  );
}
