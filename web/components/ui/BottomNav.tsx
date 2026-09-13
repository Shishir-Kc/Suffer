"use client";

import { Compass, Home, Map, Trophy, Users } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
  { href: "/home", label: "Home", Icon: Home },
  { href: "/map", label: "Map", Icon: Map },
  { href: "/quest/i2", label: "Quest", Icon: Compass },
  { href: "/leaderboard", label: "Crew", Icon: Users },
  { href: "/leaderboard", label: "Ranks", Icon: Trophy },
];

export function BottomNav() {
  const pathname = usePathname();
  return <nav className="bottom-nav" aria-label="Main navigation">{items.map(({ href, label, Icon }) => { const active = pathname === href || (label === "Home" && pathname === "/"); return <Link className={active ? "active" : ""} href={href} key={label}><Icon size={20} strokeWidth={active ? 2.4 : 1.8} aria-hidden="true" /><span>{label}</span></Link>; })}</nav>;
}

