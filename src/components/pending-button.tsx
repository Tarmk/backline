"use client";

import type { ReactNode } from "react";
import { useFormStatus } from "react-dom";

/** Submit button that disables itself while its form's action is running. */
export function PendingButton({
  children,
  className = "btn btn-primary",
  confirm,
}: {
  children: ReactNode;
  className?: string;
  /** Ask before submitting (for destructive actions). */
  confirm?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      className={className}
      disabled={pending}
      aria-busy={pending}
      onClick={(e) => {
        if (confirm && !window.confirm(confirm)) e.preventDefault();
      }}
    >
      {children}
    </button>
  );
}
