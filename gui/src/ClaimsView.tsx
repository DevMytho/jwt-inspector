import type { JwtHeader, JwtPayload } from "@core/index.js";

interface Props {
  header: JwtHeader;
  payload: JwtPayload;
}

function ClaimRow({ label, value }: { label: string; value: unknown }) {
  const display =
    typeof value === "string"
      ? value
      : typeof value === "number"
        ? String(value)
        : JSON.stringify(value);

  return (
    <tr>
      <td className="claim-key">{label}</td>
      <td className="claim-value">{display}</td>
    </tr>
  );
}

export function ClaimsView({ header, payload }: Props) {
  return (
    <div className="claims-view">
      <div className="claims-section">
        <h3>Header</h3>
        <table>
          <tbody>
            {Object.entries(header).map(([k, v]) => (
              <ClaimRow key={k} label={k} value={v} />
            ))}
          </tbody>
        </table>
      </div>

      <div className="claims-section">
        <h3>Payload</h3>
        <table>
          <tbody>
            {Object.entries(payload).map(([k, v]) => (
              <ClaimRow key={k} label={k} value={v} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
