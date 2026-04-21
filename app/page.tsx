"use client";

import { useEffect, useState } from "react";

const COMPOSITION_SRC = "/api/preview";
const COMPOSITION_WIDTH = 1920;
const COMPOSITION_HEIGHT = 1080;

type RenderState =
  | { status: "idle" }
  | { status: "rendering" }
  | { status: "done"; url: string }
  | { status: "error"; message: string };

export default function Home() {
  const [render, setRender] = useState<RenderState>({ status: "idle" });

  useEffect(() => {
    import("@hyperframes/player");
  }, []);

  async function handleRender() {
    setRender({ status: "rendering" });
    try {
      const res = await fetch("/api/render", { method: "POST" });
      if (!res.ok) {
        const body = await res.text();
        throw new Error(body || `Render failed (${res.status})`);
      }
      const data = (await res.json()) as { url: string };
      setRender({ status: "done", url: data.url });
    } catch (err) {
      setRender({
        status: "error",
        message: err instanceof Error ? err.message : "Render failed",
      });
    }
  }

  return (
    <main className="page">
      <header className="header">
        <h1>HyperFrames on Vercel</h1>
        <p>
          HTML-based video compositions — previewed in the browser, rendered
          server-side in a Vercel Sandbox.
        </p>
      </header>

      <section className="player-wrap">
        {/* @ts-expect-error — custom element */}
        <hyperframes-player
          src={COMPOSITION_SRC}
          width={COMPOSITION_WIDTH}
          height={COMPOSITION_HEIGHT}
          controls
        />
      </section>

      <section className="controls">
        <button
          className="render-btn"
          onClick={handleRender}
          disabled={render.status === "rendering"}
        >
          {render.status === "rendering" ? "Rendering…" : "Render MP4"}
        </button>

        {render.status === "rendering" && (
          <p className="hint">
            Spinning up a Vercel Sandbox (Chrome + FFmpeg). This usually takes
            30–90 seconds for a 20-second composition.
          </p>
        )}
        {render.status === "done" && (
          <p className="hint">
            Done —{" "}
            <a href={render.url} target="_blank" rel="noopener noreferrer">
              open MP4
            </a>
          </p>
        )}
        {render.status === "error" && (
          <p className="hint error">{render.message}</p>
        )}
      </section>

      <footer className="footer">
        <a
          href="https://github.com/heygen-com/hyperframes"
          target="_blank"
          rel="noopener noreferrer"
        >
          HyperFrames on GitHub
        </a>
        <span>·</span>
        <a
          href="https://hyperframes.heygen.com"
          target="_blank"
          rel="noopener noreferrer"
        >
          Docs
        </a>
      </footer>

      <style jsx>{`
        .page {
          max-width: 1100px;
          margin: 0 auto;
          padding: 48px 24px 64px;
          display: flex;
          flex-direction: column;
          gap: 32px;
        }
        .header h1 {
          font-size: 28px;
          font-weight: 600;
          letter-spacing: -0.01em;
        }
        .header p {
          margin-top: 8px;
          color: #a1a1aa;
          max-width: 640px;
        }
        .player-wrap {
          width: 100%;
          aspect-ratio: ${COMPOSITION_WIDTH} / ${COMPOSITION_HEIGHT};
          background: #000;
          border-radius: 12px;
          overflow: hidden;
        }
        .player-wrap :global(hyperframes-player) {
          width: 100%;
          height: 100%;
          display: block;
        }
        .controls {
          display: flex;
          align-items: center;
          gap: 16px;
          flex-wrap: wrap;
        }
        .render-btn {
          padding: 10px 20px;
          background: #fafafa;
          color: #0a0a0f;
          border-radius: 8px;
          font-weight: 500;
        }
        .render-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        .hint {
          color: #a1a1aa;
          font-size: 14px;
        }
        .hint.error {
          color: #f87171;
        }
        .hint a {
          color: #fafafa;
          text-decoration: underline;
        }
        .footer {
          display: flex;
          gap: 12px;
          color: #71717a;
          font-size: 13px;
        }
      `}</style>
    </main>
  );
}
