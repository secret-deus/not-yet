"use client";

import { X } from "lucide-react";
import {
  useEffect,
  useId,
  useRef,
  type ReactNode,
} from "react";

export function Modal({
  open,
  title,
  description,
  children,
  onClose,
  tone = "default",
}: {
  open: boolean;
  title: string;
  description?: string;
  children: ReactNode;
  onClose(): void;
  tone?: "default" | "danger";
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={dialogRef}
      className={`modal ${tone === "danger" ? "modal-danger" : ""}`}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClose={onClose}
      aria-labelledby={titleId}
      aria-describedby={description ? descriptionId : undefined}
    >
      <div className="modal-head">
        <div>
          <h2 id={titleId}>{title}</h2>
          {description ? (
            <p id={descriptionId}>{description}</p>
          ) : null}
        </div>
        <button
          className="icon-button"
          type="button"
          onClick={onClose}
          aria-label="关闭"
        >
          <X size={20} />
        </button>
      </div>
      {children}
    </dialog>
  );
}
