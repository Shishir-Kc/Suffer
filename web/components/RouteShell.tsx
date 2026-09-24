"use client";

import Link from "next/link";
import { ArrowLeft, WifiOff } from "lucide-react";
import type { ReactNode } from "react";

export function RouteShell({
  children,
  title,
  back = false,
  eyebrow,
}: {
  children: ReactNode;
  title?: string;
  back?: boolean;
  eyebrow?: string;
  nav?: boolean;
}) {
  return (
    <div className="app-shell">
      <header className="top-bar">
        {back ? (
          <Link className="icon-button" href="/home" aria-label="Back to home">
            <ArrowLeft size={19} />
          </Link>
        ) : (
          <span className="brand-mark">S</span>
        )}
        <div className="top-bar-title">
          {eyebrow && <span>{eyebrow}</span>}
          {title && <strong>{title}</strong>}
        </div>
        <span className="connection-pill">
          <WifiOff size={13} aria-hidden="true" /> Offline ready
        </span>
      </header>
      <main className="page-content">{children}</main>
    </div>
  );
}
