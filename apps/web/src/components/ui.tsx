import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ButtonHTMLAttributes,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from 'react';
import { CheckCircle2, Info, X, AlertTriangle, XCircle, Eye, EyeOff } from 'lucide-react';
import { cn, statusTone } from '../lib/utils';

/* -------------------------------------------------------------------------- */
/* Button                                                                     */
/* -------------------------------------------------------------------------- */

export function Button({
  variant = 'primary',
  size = 'md',
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'tertiary' | 'ghost' | 'danger' | 'danger-soft';
  size?: 'sm' | 'md' | 'lg';
}) {
  const variants = {
    primary: 'bg-accent text-white hover:bg-accent-hover shadow-xs',
    secondary: 'bg-surface text-ink border border-border hover:bg-surface-muted',
    tertiary: 'bg-transparent text-ink-secondary hover:bg-surface-muted hover:text-ink',
    ghost: 'bg-transparent text-ink-muted hover:bg-surface-muted hover:text-ink',
    danger: 'bg-danger text-white hover:opacity-90',
    'danger-soft': 'bg-danger-soft text-danger hover:bg-red-100',
  }[variant];

  const sizes = {
    sm: 'h-8 px-3 text-[13px] rounded-[var(--radius-sm)]',
    md: 'h-10 px-3.5 text-sm rounded-[var(--radius-md)]',
    lg: 'h-11 px-4 text-sm rounded-[var(--radius-md)]',
  }[size];

  return (
    <button
      className={cn(
        'inline-flex items-center justify-center gap-2 font-medium transition duration-150 disabled:pointer-events-none disabled:opacity-45',
        variants,
        sizes,
        className,
      )}
      {...props}
    />
  );
}

export function IconButton({
  className,
  label,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { label: string }) {
  return (
    <button
      aria-label={label}
      title={label}
      className={cn(
        'inline-flex h-8 w-8 items-center justify-center rounded-[var(--radius-sm)] text-ink-muted transition hover:bg-surface-muted hover:text-ink disabled:opacity-40',
        className,
      )}
      {...props}
    />
  );
}

/* -------------------------------------------------------------------------- */
/* Form controls                                                              */
/* -------------------------------------------------------------------------- */

const controlBase =
  'w-full rounded-[var(--radius-md)] border border-border bg-surface text-sm text-ink placeholder:text-ink-muted/80 transition duration-150 outline-none hover:border-border-strong focus:border-accent focus:ring-2 focus:ring-[var(--color-accent-ring)] disabled:bg-surface-muted disabled:text-ink-muted';

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn(controlBase, 'h-10 px-3', className)} {...props} />;
}

export function PasswordInput({
  className,
  ...props
}: Omit<InputHTMLAttributes<HTMLInputElement>, 'type'>) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <input
        type={show ? 'text' : 'password'}
        className={cn(controlBase, 'h-10 pl-3 pr-10', className)}
        {...props}
      />
      <button
        type="button"
        onClick={() => setShow((v) => !v)}
        aria-label={show ? 'Hide password' : 'Show password'}
        title={show ? 'Hide password' : 'Show password'}
        className="absolute right-1 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-[var(--radius-sm)] text-ink-muted transition hover:bg-surface-muted hover:text-ink"
        tabIndex={-1}
      >
        {show ? <EyeOff size={16} /> : <Eye size={16} />}
      </button>
    </div>
  );
}

export function Textarea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea className={cn(controlBase, 'min-h-24 px-3 py-2.5 resize-y', className)} {...props} />
  );
}

export function Select({ className, children, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select className={cn(controlBase, 'h-10 px-3', className)} {...props}>
      {children}
    </select>
  );
}

export function Label({
  children,
  htmlFor,
  optional,
}: {
  children: ReactNode;
  htmlFor?: string;
  optional?: boolean;
}) {
  return (
    <label htmlFor={htmlFor} className="mb-1.5 block text-[13px] font-medium text-ink-secondary">
      {children}
      {optional ? <span className="ml-1 font-normal text-ink-muted">(optional)</span> : null}
    </label>
  );
}

export function Field({
  label,
  children,
  error,
  hint,
  optional,
}: {
  label: string;
  children: ReactNode;
  error?: string;
  hint?: string;
  optional?: boolean;
}) {
  return (
    <div>
      <Label optional={optional}>{label}</Label>
      {children}
      {hint && !error ? <p className="mt-1.5 text-xs text-ink-muted">{hint}</p> : null}
      {error ? <p className="mt-1.5 text-xs text-danger">{error}</p> : null}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Status / badges                                                            */
/* -------------------------------------------------------------------------- */

export function Badge({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-medium tracking-wide',
        className,
      )}
    >
      {children}
    </span>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const label =
    status === 'SCHEDULED'
      ? 'Scheduled'
      : status === 'ENDED'
        ? 'Ended'
        : status === 'CLOSED'
          ? 'Closed'
          : status === 'ACTIVE'
            ? 'Active'
            : status === 'DRAFT'
              ? 'Draft'
              : status === 'ARCHIVED'
                ? 'Archived'
                : status === 'PUBLISHED'
                  ? 'Published'
                  : status === 'FINALIZED'
                    ? 'Finalized'
                    : status === 'IN_PROGRESS'
                      ? 'In Progress'
                      : status === 'COMPLETED'
                        ? 'Completed'
                        : status.charAt(0) + status.slice(1).toLowerCase().replaceAll('_', ' ');
  return (
    <Badge className={cn('border border-transparent', statusTone(status))}>
      <span
        className={cn(
          'h-1.5 w-1.5 rounded-full',
          status === 'ACTIVE' && 'bg-accent',
          (status === 'PUBLISHED' || status === 'SCHEDULED' || status === 'FINALIZED') && 'bg-info',
          (status === 'DRAFT' || status === 'IN_PROGRESS') && 'bg-ink-muted',
          (status === 'CLOSED' || status === 'ENDED') && 'bg-warning',
          (status === 'ARCHIVED' || status === 'COMPLETED') && 'bg-ink-muted',
        )}
      />
      {label}
    </Badge>
  );
}

/* -------------------------------------------------------------------------- */
/* Page chrome                                                                */
/* -------------------------------------------------------------------------- */

export function PageHeader({
  title,
  subtitle,
  actions,
  breadcrumb,
}: {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  breadcrumb?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
      <div className="min-w-0">
        {breadcrumb ? <div className="mb-2 text-xs text-ink-muted">{breadcrumb}</div> : null}
        <h1 className="text-[1.625rem] font-semibold tracking-tight text-ink">{title}</h1>
        {subtitle ? <p className="mt-1 max-w-2xl text-sm text-ink-muted">{subtitle}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  );
}

export function SectionTitle({
  title,
  action,
}: {
  title: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-3 flex items-center justify-between gap-3">
      <h2 className="text-sm font-semibold text-ink">{title}</h2>
      {action}
    </div>
  );
}

export function Surface({
  children,
  className,
  padded = true,
}: {
  children: ReactNode;
  className?: string;
  padded?: boolean;
}) {
  return (
    <div
      className={cn(
        'rounded-[var(--radius-lg)] border border-border bg-surface shadow-xs',
        padded && 'p-5',
        className,
      )}
    >
      {children}
    </div>
  );
}

export function EmptyState({
  title,
  body,
  action,
  icon,
}: {
  title: string;
  body?: string;
  action?: ReactNode;
  icon?: ReactNode;
}) {
  return (
    <div className="rounded-[var(--radius-lg)] border border-dashed border-border bg-surface px-6 py-14 text-center">
      {icon ? <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center text-ink-muted">{icon}</div> : null}
      <p className="text-base font-semibold text-ink">{title}</p>
      {body ? <p className="mx-auto mt-1.5 max-w-md text-sm text-ink-muted">{body}</p> : null}
      {action ? <div className="mt-5 flex justify-center gap-2">{action}</div> : null}
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('skeleton', className)} />;
}

/* -------------------------------------------------------------------------- */
/* Tabs / filters                                                             */
/* -------------------------------------------------------------------------- */

export function Tabs({
  tabs,
  value,
  onChange,
}: {
  tabs: Array<{ id: string; label: string }>;
  value: string;
  onChange: (id: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1 border-b border-border">
      {tabs.map((tab) => {
        const active = tab.id === value;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            className={cn(
              'relative px-3.5 py-2.5 text-sm font-medium transition',
              active ? 'text-accent' : 'text-ink-muted hover:text-ink',
            )}
          >
            {tab.label}
            {active ? (
              <span className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-accent" />
            ) : null}
          </button>
        );
      })}
    </div>
  );
}

export function FilterChip({
  active,
  children,
  onClick,
}: {
  active?: boolean;
  children: ReactNode;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'h-8 rounded-full px-3 text-[13px] font-medium transition',
        active
          ? 'bg-ink text-ink-inverse'
          : 'bg-surface text-ink-secondary border border-border hover:bg-surface-muted',
      )}
    >
      {children}
    </button>
  );
}

/* -------------------------------------------------------------------------- */
/* Modal                                                                      */
/* -------------------------------------------------------------------------- */

export function Modal({
  open,
  title,
  description,
  children,
  onClose,
  footer,
  size = 'md',
}: {
  open: boolean;
  title: string;
  description?: string;
  children?: ReactNode;
  onClose: () => void;
  footer?: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  const widths = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
  }[size];

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center">
      <button
        type="button"
        aria-label="Close dialog"
        className="absolute inset-0 bg-ink/40 backdrop-blur-[1px]"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        className={cn(
          'relative z-10 w-full animate-fade-in rounded-[var(--radius-xl)] border border-border bg-surface shadow-lg',
          widths,
        )}
      >
        <div className="flex items-start justify-between gap-3 border-b border-border px-5 py-4">
          <div>
            <h3 className="text-base font-semibold text-ink">{title}</h3>
            {description ? <p className="mt-1 text-sm text-ink-muted">{description}</p> : null}
          </div>
          <IconButton label="Close" onClick={onClose}>
            <X size={16} />
          </IconButton>
        </div>
        {children ? <div className="px-5 py-4">{children}</div> : null}
        {footer ? (
          <div className="flex justify-end gap-2 border-t border-border px-5 py-4">{footer}</div>
        ) : null}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Toast                                                                      */
/* -------------------------------------------------------------------------- */

type ToastKind = 'success' | 'error' | 'info' | 'warning';
type ToastItem = { id: number; message: string; kind: ToastKind };

type ToastContextValue = {
  toast: (message: string, kind?: ToastKind) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);

  const toast = useCallback((message: string, kind: ToastKind = 'success') => {
    const id = Date.now() + Math.random();
    setItems((prev) => [...prev, { id, message, kind }]);
    window.setTimeout(() => {
      setItems((prev) => prev.filter((t) => t.id !== id));
    }, 2800);
  }, []);

  const value = useMemo(() => ({ toast }), [toast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed bottom-4 right-4 z-[60] flex w-[min(360px,calc(100vw-2rem))] flex-col gap-2">
        {items.map((item) => {
          const Icon =
            item.kind === 'success'
              ? CheckCircle2
              : item.kind === 'error'
                ? XCircle
                : item.kind === 'warning'
                  ? AlertTriangle
                  : Info;
          const tone =
            item.kind === 'success'
              ? 'border-success/20 bg-surface text-success'
              : item.kind === 'error'
                ? 'border-danger/20 bg-surface text-danger'
                : item.kind === 'warning'
                  ? 'border-warning/20 bg-surface text-warning'
                  : 'border-info/20 bg-surface text-info';
          return (
            <div
              key={item.id}
              className={cn(
                'pointer-events-auto animate-toast-in rounded-[var(--radius-md)] border px-3.5 py-3 shadow-md',
                tone,
              )}
            >
              <div className="flex items-start gap-2.5 text-sm text-ink">
                <Icon size={16} className="mt-0.5 shrink-0" />
                <span>{item.message}</span>
              </div>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}

export function SaveIndicator({ saving, saved }: { saving?: boolean; saved?: boolean }) {
  if (saving) {
    return <span className="text-xs text-ink-muted">Saving…</span>;
  }
  if (saved) {
    return <span className="text-xs text-success">Saved</span>;
  }
  return null;
}

/* -------------------------------------------------------------------------- */
/* Avatar / Stats / Search                                                    */
/* -------------------------------------------------------------------------- */

export function Avatar({ name, size = 'md' }: { name: string; size?: 'sm' | 'md' | 'lg' }) {
  const initials = name
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
  const dims = size === 'sm' ? 'h-8 w-8 text-[11px]' : size === 'lg' ? 'h-12 w-12 text-sm' : 'h-9 w-9 text-xs';
  return (
    <div
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-full bg-accent-soft font-semibold text-accent',
        dims,
      )}
    >
      {initials || '—'}
    </div>
  );
}

export function StatStrip({
  items,
  loading,
}: {
  items: Array<{ label: string; value: ReactNode }>;
  loading?: boolean;
}) {
  return (
    <Surface className="!p-0 overflow-hidden">
      <div
        className={cn(
          'grid divide-y divide-border sm:divide-x sm:divide-y-0',
          items.length <= 3 ? 'sm:grid-cols-3' : items.length === 4 ? 'sm:grid-cols-2 lg:grid-cols-4' : 'sm:grid-cols-3 lg:grid-cols-6',
        )}
      >
        {loading
          ? items.map((item) => (
              <div key={item.label} className="px-5 py-5">
                <Skeleton className="h-3 w-16" />
                <Skeleton className="mt-3 h-8 w-20" />
              </div>
            ))
          : items.map((item) => (
              <div key={item.label} className="px-5 py-5">
                <p className="text-[12px] font-medium uppercase tracking-[0.08em] text-ink-muted">
                  {item.label}
                </p>
                <p className="mt-2 text-[1.75rem] font-semibold tracking-tight text-ink tabular-nums">
                  {item.value}
                </p>
              </div>
            ))}
      </div>
    </Surface>
  );
}

export function SearchInput({
  value,
  onChange,
  placeholder = 'Search…',
  className,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}) {
  return (
    <div className={cn('relative min-w-[200px] flex-1', className)}>
      <svg
        aria-hidden
        className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <circle cx="11" cy="11" r="7" />
        <path d="m20 20-3-3" />
      </svg>
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="pl-9"
        aria-label={placeholder}
      />
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Data table                                                                 */
/* -------------------------------------------------------------------------- */

export type DataColumn<T> = {
  key: string;
  header: string;
  className?: string;
  render: (row: T) => ReactNode;
};

export function DataTable<T extends { id: string | number }>({
  columns,
  rows,
  loading,
  emptyTitle = 'No results',
  emptyBody,
  emptyAction,
  onRowClick,
  rowActions,
}: {
  columns: Array<DataColumn<T>>;
  rows: T[];
  loading?: boolean;
  emptyTitle?: string;
  emptyBody?: string;
  emptyAction?: ReactNode;
  onRowClick?: (row: T) => void;
  rowActions?: (row: T) => ReactNode;
}) {
  if (loading) {
    return (
      <Surface className="!p-0 overflow-hidden">
        <div className="space-y-0 divide-y divide-border">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex gap-4 px-4 py-4">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-4 w-24" />
              <Skeleton className="ml-auto h-4 w-16" />
            </div>
          ))}
        </div>
      </Surface>
    );
  }

  if (!rows.length) {
    return <EmptyState title={emptyTitle} body={emptyBody} action={emptyAction} />;
  }

  return (
    <Surface className="!p-0 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-border bg-surface-muted/50">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={cn(
                    'px-4 py-3 text-[12px] font-medium uppercase tracking-[0.06em] text-ink-muted',
                    col.className,
                  )}
                >
                  {col.header}
                </th>
              ))}
              {rowActions ? (
                <th className="w-12 px-3 py-3 text-[12px] font-medium uppercase tracking-[0.06em] text-ink-muted">
                  <span className="sr-only">Actions</span>
                </th>
              ) : null}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr
                key={row.id}
                className={cn(
                  'border-b border-border last:border-b-0 transition',
                  onRowClick && 'cursor-pointer hover:bg-surface-muted/60',
                )}
                onClick={() => onRowClick?.(row)}
              >
                {columns.map((col) => (
                  <td key={col.key} className={cn('px-4 py-3.5 align-middle text-ink', col.className)}>
                    {col.render(row)}
                  </td>
                ))}
                {rowActions ? (
                  <td
                    className="px-2 py-3.5 text-right"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {rowActions(row)}
                  </td>
                ) : null}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Surface>
  );
}

/* -------------------------------------------------------------------------- */
/* Drawer / Dropdown                                                          */
/* -------------------------------------------------------------------------- */

export function Drawer({
  open,
  title,
  description,
  children,
  onClose,
  footer,
  width = 'md',
}: {
  open: boolean;
  title: string;
  description?: string;
  children?: ReactNode;
  onClose: () => void;
  footer?: ReactNode;
  width?: 'sm' | 'md' | 'lg';
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  const widths = { sm: 'max-w-md', md: 'max-w-lg', lg: 'max-w-xl' }[width];

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <button
        type="button"
        aria-label="Close drawer"
        className="absolute inset-0 bg-ink/35"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        className={cn(
          'relative z-10 flex h-full w-full flex-col border-l border-border bg-surface shadow-lg animate-fade-in',
          widths,
        )}
      >
        <div className="flex items-start justify-between gap-3 border-b border-border px-5 py-4">
          <div>
            <h3 className="text-base font-semibold text-ink">{title}</h3>
            {description ? <p className="mt-1 text-sm text-ink-muted">{description}</p> : null}
          </div>
          <IconButton label="Close" onClick={onClose}>
            <X size={16} />
          </IconButton>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-4 scroll-thin">{children}</div>
        {footer ? (
          <div className="flex justify-end gap-2 border-t border-border px-5 py-4">{footer}</div>
        ) : null}
      </div>
    </div>
  );
}

export function DropdownMenu({
  trigger,
  items,
  align = 'right',
}: {
  trigger: ReactNode;
  items: Array<{
    label: string;
    onClick: () => void;
    danger?: boolean;
    disabled?: boolean;
  }>;
  align?: 'left' | 'right';
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [open]);

  return (
    <div className="relative inline-flex" ref={ref}>
      <div
        onClick={(e) => {
          e.stopPropagation();
          setOpen((v) => !v);
        }}
      >
        {trigger}
      </div>
      {open ? (
        <div
          className={cn(
            'absolute top-full z-40 mt-1 min-w-[180px] overflow-hidden rounded-[var(--radius-md)] border border-border bg-surface py-1 shadow-md animate-fade-in',
            align === 'right' ? 'right-0' : 'left-0',
          )}
        >
          {items.map((item) => (
            <button
              key={item.label}
              type="button"
              disabled={item.disabled}
              className={cn(
                'flex w-full px-3 py-2 text-left text-sm transition hover:bg-surface-muted disabled:opacity-40',
                item.danger ? 'text-danger' : 'text-ink',
              )}
              onClick={(e) => {
                e.stopPropagation();
                setOpen(false);
                item.onClick();
              }}
            >
              {item.label}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

export function FilterBar({ children }: { children: ReactNode }) {
  return (
    <div className="mb-4 flex flex-wrap items-center gap-2">{children}</div>
  );
}

export function ConfirmDangerModal({
  open,
  title,
  description,
  confirmLabel,
  onConfirm,
  onClose,
  loading,
}: {
  open: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  onConfirm: () => void;
  onClose: () => void;
  loading?: boolean;
}) {
  return (
    <Modal
      open={open}
      title={title}
      description={description}
      onClose={onClose}
      size="sm"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="danger" onClick={onConfirm} disabled={loading}>
            {loading ? 'Working…' : confirmLabel}
          </Button>
        </>
      }
    />
  );
}

