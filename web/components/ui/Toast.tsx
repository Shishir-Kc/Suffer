"use client";

import { CheckCircle2, X } from "lucide-react";
import { useState } from "react";

export function Toast({ message }: { message: string }) {
  const [visible, setVisible] = useState(true);
  if (!visible) return null;
  return <div className="toast" role="status" aria-live="polite"><CheckCircle2 size={18} aria-hidden="true" /><span>{message}</span><button aria-label="Dismiss notification" onClick={() => setVisible(false)}><X size={16} /></button></div>;
}

