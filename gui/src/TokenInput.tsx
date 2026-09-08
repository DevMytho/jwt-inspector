import { useState } from "react";
import { TEST_TOKENS } from "./inspector.js";

interface Props {
  onInspect: (token: string, secret?: string) => void;
  loading: boolean;
}

export function TokenInput({ onInspect, loading }: Props) {
  const [token, setToken] = useState("");
  const [secret, setSecret] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (token.trim()) {
      onInspect(token, secret || undefined);
    }
  }

  function loadTest(name: keyof typeof TEST_TOKENS) {
    const t = TEST_TOKENS[name];
    setToken(t.token);
    setSecret(t.secret ?? "");
    onInspect(t.token, t.secret);
  }

  return (
    <div className="token-input">
      <form onSubmit={handleSubmit}>
        <label>
          JWT Token
          <textarea
            rows={4}
            value={token}
            onChange={(e) => setToken(e.target.value)}
            placeholder="Paste a JWT token here..."
            spellCheck={false}
          />
        </label>
        <label>
          Secret (for HMAC verification)
          <input
            type="text"
            value={secret}
            onChange={(e) => setSecret(e.target.value)}
            placeholder="Optional — secret key"
          />
        </label>
        <button type="submit" disabled={loading || !token.trim()}>
          {loading ? "Inspecting..." : "Inspect"}
        </button>
      </form>

      <div className="test-tokens">
        <span className="test-label">Quick test:</span>
        {Object.entries(TEST_TOKENS).map(([key, t]) => (
          <button
            key={key}
            type="button"
            className="test-btn"
            onClick={() => loadTest(key as keyof typeof TEST_TOKENS)}
          >
            {t.label}
          </button>
        ))}
      </div>
    </div>
  );
}
