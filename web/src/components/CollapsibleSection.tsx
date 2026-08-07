"use client";

import { useState, type ReactNode } from "react";

export default function CollapsibleSection({
  id,
  title,
  subtitle,
  defaultOpen = false,
  children,
}: {
  id?: string;
  title: string;
  subtitle?: string;
  defaultOpen?: boolean;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div id={id} className={`card action-card${open ? " open" : ""}`}>
      <button className="action-header" type="button" onClick={() => setOpen((o) => !o)}>
        <span className="action-title">{title}</span>
        {subtitle && <span className="action-sub">{subtitle}</span>}
        <span className="action-chevron">&#9660;</span>
      </button>
      <div className="action-body">{children}</div>
    </div>
  );
}
