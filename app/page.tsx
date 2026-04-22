"use client";

import { useEffect, useRef, useState } from "react";
import styles from "./page.module.css";

const COMPOSITION_SRC = "/api/preview";
const COMPOSITION_WIDTH = 1920;
const COMPOSITION_HEIGHT = 1080;

type RenderState =
  | { status: "idle" }
  | { status: "rendering" }
  | { status: "done"; url: string }
  | { status: "error"; message: string };

type HyperframesPlayerElement = HTMLElement & {
  pause?: () => void;
  currentTime?: number;
};

export default function Home() {
  const [render, setRender] = useState<RenderState>({ status: "idle" });
  const [playerLoaded, setPlayerLoaded] = useState(false);
  const playerRef = useRef<HyperframesPlayerElement | null>(null);

  useEffect(() => {
    let cancelled = false;

    import("@hyperframes/player").then(() => {
      if (!cancelled) setPlayerLoaded(true);
    });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!playerLoaded) return;

    const player = playerRef.current;
    if (!player) return;

    const syncInitialState = () => {
      player.pause?.();
      if (typeof player.currentTime === "number") {
        player.currentTime = 0;
      }
    };

    syncInitialState();
    player.addEventListener("ready", syncInitialState);

    return () => {
      player.removeEventListener("ready", syncInitialState);
    };
  }, [playerLoaded]);

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
    <main className={styles.page}>
      <header className={styles.header}>
        <h1>HyperFrames on Vercel</h1>
        <p>
          HTML-based video compositions — previewed in the browser, rendered
          server-side in a Vercel Sandbox.
        </p>
      </header>

      <section className={styles.playerWrap}>
        {playerLoaded && (
          /* @ts-expect-error — custom element */
          <hyperframes-player
            ref={playerRef}
            src={COMPOSITION_SRC}
            width={COMPOSITION_WIDTH}
            height={COMPOSITION_HEIGHT}
            controls
          />
        )}
      </section>

      <section className={styles.controls}>
        <button
          className={styles.renderBtn}
          onClick={handleRender}
          disabled={render.status === "rendering"}
        >
          {render.status === "rendering" ? "Rendering…" : "Render MP4"}
        </button>

        {render.status === "rendering" && (
          <p className={styles.hint}>
            Spinning up a Vercel Sandbox (Chrome + FFmpeg). This usually takes
            30–90 seconds for a 20-second composition.
          </p>
        )}
        {render.status === "done" && (
          <p className={styles.hint}>
            Done —{" "}
            <a href={render.url} target="_blank" rel="noopener noreferrer">
              open MP4
            </a>
          </p>
        )}
        {render.status === "error" && (
          <p className={`${styles.hint} ${styles.error}`}>{render.message}</p>
        )}
      </section>

      <footer className={styles.footer}>
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
    </main>
  );
}
