import type { ReactNode } from "react";
import { BottomNav } from "@/components/ui/BottomNav";

export default function WithNavLayout({ children }: { children: ReactNode }) {
  return <>{children}<BottomNav /></>;
}
