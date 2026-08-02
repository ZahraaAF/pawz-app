"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { pets } from "@/lib/pets";

const primaryPetId = pets[0].id;

const tabs = [
  { href: "/", label: "Home", match: (path: string) => path === "/" },
  {
    href: `/pets/${primaryPetId}`,
    label: "Profile",
    match: (path: string) => path.startsWith("/pets/") && !path.endsWith("/care-card"),
  },
  {
    href: `/pets/${primaryPetId}/care-card`,
    label: "Care Card",
    match: (path: string) => path.endsWith("/care-card"),
  },
];

export default function TopNav() {
  const pathname = usePathname();

  return (
    <header className="topbar">
      <span className="brand-mark">Pawz</span>
      <nav className="topbar-nav">
        {tabs.map((tab) => (
          <Link
            key={tab.label}
            href={tab.href}
            className="nav-tab"
            aria-current={tab.match(pathname) ? "true" : "false"}
          >
            {tab.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
