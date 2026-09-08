import { useState, useCallback } from "react";
import { TokenInput } from "./TokenInput.js";
import { ClaimsView } from "./ClaimsView.js";
import { FindingsList } from "./FindingsList.js";
import { inspectToken } from "./inspector.js";
import type { InspectResult } from "./inspector.js";
import "./App.css";

function App() {
  const [result, setResult] = useState<InspectResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleInspect = useCallback(async (token: string, secret?: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await inspectToken(token, secret);
      setResult(res);
    } catch (err) {
      setError(String(err));
      setResult(null);
    } finally {
      setLoading(false);
    }
  }, []);

  return (
    <div className="app">
      <header>
        <h1>🔐 JWT Inspector</h1>
        <p className="subtitle">Decode, analyze, and verify JSON Web Tokens</p>
      </header>

      <TokenInput onInspect={handleInspect} loading={loading} />

      {error && (
        <div className="error-box">
          <strong>Error:</strong> {error}
        </div>
      )}

      {result && (
        <>
          <ClaimsView
            header={result.decoded.header}
            payload={result.decoded.payload}
          />
          <FindingsList
            findings={result.analysis.findings}
            verification={result.verification}
          />
        </>
      )}
    </div>
  );
}

export default App;
