"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "@/lib/auth/actions";

export default function Topbar() {
  const pathname = usePathname();

  return (
    <header className="topbar">
      <span className="brand-mark">Pawz</span>
      <nav className="topbar-nav">
        <Link
          href="/dashboard"
          className="nav-tab"
          aria-current={pathname === "/dashboard" ? "true" : "false"}
        >
          Home
        </Link>
        <Link
          href="/care-card"
          className="nav-tab"
          aria-current={pathname === "/care-card" ? "true" : "false"}
        >
          Care Card
        </Link>
      </nav>
      <div className="topbar-actions">
        <form action={signOut}>
          <button className="nav-tab" type="submit">
            Log out
          </button>
        </form>
      </div>
    </header>
  );
}
