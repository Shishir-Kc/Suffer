"use client";

import { Clock3, Compass, Home, Map, Users } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
  { href: "/home", label: "Home", Icon: Home },
  { href: "/map", label: "Map", Icon: Map },
  { href: "/quest/i2", label: "Quest", Icon: Compass },
  { href: "/leaderboard", label: "Crew", Icon: Users },
  { href: "/timeline", label: "Timeline", Icon: Clock3 },
];

export function BottomNav() {
  const pathname = usePathname();
  return (
    <nav className="bottom-nav" aria-label="Main navigation">
      {items.map(({ href, label, Icon }) => {
        const active =
          pathname === href ||
          (label === "Home" && pathname === "/") ||
          (label === "Quest" && pathname.startsWith("/quest/"));
        return (
          <Link className={active ? "active" : ""} href={href} key={label}>
            <Icon
              size={20}
              strokeWidth={active ? 2.4 : 1.8}
              aria-hidden="true"
            />
            <span>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
