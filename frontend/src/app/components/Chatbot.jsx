import { useMemo, useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/app/components/ui/card";
import { Input } from "@/app/components/ui/input";
import { Button } from "@/app/components/ui/button";

const API_BASE_URL = `${import.meta.env.VITE_API_URL ?? ""}`.replace(
  /\/+$/,
  "",
);

export default function Chatbot({ resumeText = "" }) {
  const [query, setQuery] = useState("");
  const [response, setResponse] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const payloadResumeText = useMemo(() => {
    return (resumeText ?? "").toString();
  }, [resumeText]);

  const send = async () => {
    const q = query.trim();
    if (!q) return;

    setLoading(true);
    setError("");
    setResponse("");

    try {
      const res = await fetch(`${API_BASE_URL}/chatbot`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resume_text: payloadResumeText, query: q }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        const detail = data?.detail || data?.message || "Request failed";
        throw new Error(detail);
      }

      setResponse((data?.response ?? "").toString());
    } catch (e) {
      setError(e?.message ? String(e.message) : "Chatbot request failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Gemini Career Assistant</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex gap-2">
          <Input
            value={query}
            placeholder="Ask for resume suggestions or career advice…"
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") send();
            }}
          />
          <Button onClick={send} disabled={loading || !query.trim()}>
            {loading ? "Sending…" : "Send"}
          </Button>
        </div>

        {error ? <div className="text-sm text-red-600">{error}</div> : null}

        {response ? (
          <div className="text-sm whitespace-pre-wrap text-gray-800">
            {response}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
