import type { ReactNode } from "react";
import { AlertTriangle, CheckCircle2, LoaderCircle, X } from "lucide-react";

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow?: string;
  title: string;
  description: string;
  actions?: ReactNode;
}) {
  return (
    <header className="page-header">
      <div>
        {eyebrow && <span className="eyebrow">{eyebrow}</span>}
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      {actions && <div className="page-actions">{actions}</div>}
    </header>
  );
}

export function Panel({ title, description, actions, children, className = "" }: { title?: string; description?: string; actions?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={`panel ${className}`}>
      {(title || actions) && (
        <header className="panel-header">
          <div>
            {title && <h2>{title}</h2>}
            {description && <p>{description}</p>}
          </div>
          {actions && <div className="panel-actions">{actions}</div>}
        </header>
      )}
      {children}
    </section>
  );
}

export function Badge({ children, tone = "default" }: { children: ReactNode; tone?: "default" | "positive" | "warning" | "danger" | "info" }) {
  return <span className={`badge badge-${tone}`}>{children}</span>;
}

export function Button({
  children,
  variant = "secondary",
  icon,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "secondary" | "ghost" | "danger"; icon?: ReactNode }) {
  return (
    <button {...props} className={`button button-${variant} ${props.className || ""}`}>
      {icon}
      <span>{children}</span>
    </button>
  );
}

export function EmptyState({ title = "Chưa có dữ liệu", description = "Dữ liệu sẽ xuất hiện tại đây sau khi được tạo.", action }: { title?: string; description?: string; action?: ReactNode }) {
  return (
    <div className="state state-empty">
      <CheckCircle2 />
      <h3>{title}</h3>
      <p>{description}</p>
      {action}
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="state state-error">
      <AlertTriangle />
      <h3>Không tải được dữ liệu</h3>
      <p>{message}</p>
      {onRetry && <Button onClick={onRetry}>Thử lại</Button>}
    </div>
  );
}

export function LoadingState() {
  return (
    <div className="state state-loading">
      <LoaderCircle className="spin" />
      <p>Đang tải dữ liệu...</p>
    </div>
  );
}

export function Modal({ title, children, onClose }: { title: string; children: ReactNode; onClose: () => void }) {
  return (
    <div className="modal-backdrop" onMouseDown={onClose}>
      <section className="modal" onMouseDown={(event) => event.stopPropagation()} role="dialog" aria-modal="true" aria-label={title}>
        <header>
          <h2>{title}</h2>
          <button className="icon-button" onClick={onClose} aria-label="Đóng">
            <X />
          </button>
        </header>
        <div className="modal-content">{children}</div>
      </section>
    </div>
  );
}
