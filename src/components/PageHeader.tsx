import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import type { ReactNode } from "react";

export function PageHeader({
  eyebrow,
  title,
  description,
  backHref = "/",
  backLabel = "返回",
  action,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  backHref?: string;
  backLabel?: string;
  action?: ReactNode;
}) {
  return (
    <header className="page-header">
      <Link className="back-link" href={backHref}>
        <ArrowLeft size={18} aria-hidden="true" />
        {backLabel}
      </Link>
      <div className="page-heading-row">
        <div>
          {eyebrow ? <span className="eyebrow">{eyebrow}</span> : null}
          <h1>{title}</h1>
          {description ? <p>{description}</p> : null}
        </div>
        {action ? <div className="page-heading-action">{action}</div> : null}
      </div>
    </header>
  );
}
