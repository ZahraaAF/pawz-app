"use client";

import { useState, type ReactNode } from "react";

type ViewMode = "overview" | "timeline" | "actions";

export default function ViewToggle({
  overview,
  timeline,
  actions,
}: {
  overview: ReactNode;
  timeline: ReactNode;
  actions: ReactNode;
}) {
  const [mode, setMode] = useState<ViewMode>("overview");

  return (
    <>
      <div className="view-toggle" role="tablist">
        <button
          className="toggle-btn"
          type="button"
          role="tab"
          aria-selected={mode === "overview"}
          onClick={() => setMode("overview")}
        >
          Overview
        </button>
        <button
          className="toggle-btn"
          type="button"
          role="tab"
          aria-selected={mode === "timeline"}
          onClick={() => setMode("timeline")}
        >
          Timeline
        </button>
        <button
          className="toggle-btn"
          type="button"
          role="tab"
          aria-selected={mode === "actions"}
          onClick={() => setMode("actions")}
        >
          Actions
        </button>
      </div>
      {mode === "overview" && overview}
      {mode === "timeline" && timeline}
      {mode === "actions" && actions}
    </>
  );
}
