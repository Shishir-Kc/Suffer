import type { ReactNode } from "react";

export function Modal({ title, children, onClose }: { title: string; children: ReactNode; onClose: () => void }) {
  return <div className="modal-scrim" role="dialog" aria-modal="true" aria-label={title}><div className="modal-sheet"><div className="modal-handle" /><div className="modal-heading"><h2>{title}</h2><button className="icon-button" onClick={onClose} aria-label="Close dialog">×</button></div>{children}</div></div>;
}

