import { useCallback, useEffect, useRef, useState } from "react";

const API_URL = "http://localhost:3001/api/chat";

export default function App() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const bottomRef = useRef(null);

  const scrollToBottom = useCallback(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading, scrollToBottom]);

  async function sendMessage(e) {
    e?.preventDefault();
    const text = input.trim();
    if (!text || loading) return;

    setInput("");
    setError(null);
    setMessages((m) => [...m, { role: "user", content: text }]);
    setLoading(true);

    try {
      const res = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text }),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data.error || res.statusText || "Request failed");
      }

      const reply = data.reply ?? "";
      const sources = Array.isArray(data.sources) ? data.sources : [];

      setMessages((m) => [
        ...m,
        {
          role: "assistant",
          content: reply,
          sources,
        },
      ]);
    } catch (err) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-full flex-col bg-gradient-to-b from-zinc-950 via-zinc-950 to-zinc-900">
      <header className="border-b border-zinc-800/80 px-4 py-4 sm:px-6">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-4">
          <div>
            <h1 className="text-lg font-semibold tracking-tight text-zinc-50">
              Vector Brain
            </h1>
            <p className="text-sm text-zinc-500">
              Ask questions about your C++ codebase (RAG over{" "}
              <code className="rounded bg-zinc-800/80 px-1 py-0.5 font-mono text-xs text-emerald-400/90">
                backend/data
              </code>
              )
            </p>
          </div>
          <div className="hidden shrink-0 rounded-lg border border-zinc-800 bg-zinc-900/50 px-3 py-1.5 text-xs text-zinc-500 sm:block">
            API:{" "}
            <span className="font-mono text-zinc-400">localhost:3001</span>
          </div>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col px-4 py-6 sm:px-6">
        {error && (
          <div
            className="mb-4 rounded-lg border border-red-900/50 bg-red-950/40 px-4 py-3 text-sm text-red-200"
            role="alert"
          >
            {error}
          </div>
        )}

        <div className="flex flex-1 flex-col gap-4 overflow-y-auto pb-4">
          {messages.length === 0 && !loading && (
            <div className="flex flex-1 flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-zinc-800 bg-zinc-900/20 px-6 py-16 text-center">
              <p className="max-w-sm text-zinc-400">
                Drop <span className="text-zinc-300">.cpp</span> and{" "}
                <span className="text-zinc-300">.h</span> files into{" "}
                <code className="font-mono text-emerald-400/90">backend/data</code>
                , restart the server, then ask anything about your code.
              </p>
            </div>
          )}

          {messages.map((msg, i) => (
            <div
              key={i}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[min(100%,36rem)] rounded-2xl px-4 py-3 text-[15px] leading-relaxed ${
                  msg.role === "user"
                    ? "bg-emerald-600/90 text-white shadow-lg shadow-emerald-950/30"
                    : "border border-zinc-800 bg-zinc-900/80 text-zinc-200 shadow-sm"
                }`}
              >
                {msg.role === "user" ? (
                  msg.content
                ) : (
                  <>
                    <div className="whitespace-pre-wrap">{msg.content}</div>
                    {msg.sources?.length > 0 && (
                      <div className="mt-3 border-t border-zinc-700/60 pt-3 text-xs text-zinc-500">
                        <span className="font-medium text-zinc-500">Sources:</span>{" "}
                        {msg.sources.map((s, j) => (
                          <span key={j} className="ml-1 font-mono text-zinc-400">
                            {s.file}
                            {s.chunkIndex != null ? `#${s.chunkIndex + 1}` : ""}
                            {j < msg.sources.length - 1 ? " · " : ""}
                          </span>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex justify-start">
              <div className="rounded-2xl border border-zinc-800 bg-zinc-900/80 px-4 py-3">
                <div className="flex items-center gap-2 text-sm text-zinc-500">
                  <span className="inline-flex gap-1">
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-zinc-500 [animation-delay:-0.3s]" />
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-zinc-500 [animation-delay:-0.15s]" />
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-zinc-500" />
                  </span>
                  Thinking…
                </div>
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        <form
          onSubmit={sendMessage}
          className="sticky bottom-0 border-t border-zinc-800/80 bg-zinc-950/95 pb-[env(safe-area-inset-bottom)] pt-4 backdrop-blur-sm"
        >
          <div className="flex gap-2 rounded-xl border border-zinc-800 bg-zinc-900/60 p-2 shadow-inner focus-within:border-emerald-700/50 focus-within:ring-1 focus-within:ring-emerald-600/30">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about your C++ code…"
              disabled={loading}
              className="min-w-0 flex-1 bg-transparent px-3 py-2 text-zinc-100 placeholder:text-zinc-600 focus:outline-none disabled:opacity-50"
              autoComplete="off"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="shrink-0 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Send
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
