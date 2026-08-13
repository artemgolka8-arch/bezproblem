export function StatCard({ label, value, tone = "ink", hint }) {
  const toneClasses = {
    ink: "text-ink",
    primary: "text-primary",
    teal: "text-teal",
    rose: "text-rose",
  };
  return (
    <div className="bg-card border border-line rounded-md p-5 shadow-soft transition-colors hover:border-primary/40">
      <div className="text-xs font-medium text-muted uppercase tracking-wide">{label}</div>
      <div className={`mt-2 text-3xl font-semibold mono ${toneClasses[tone]}`}>{value}</div>
      {hint && <div className="mt-1 text-xs text-muted">{hint}</div>}
    </div>
  );
}

const BADGE_TONES = {
  neutral: "bg-line/60 text-ink",
  primary: "bg-primary-50 text-primary-600 dark:bg-primary/15 dark:text-primary-300",
  teal: "bg-teal-50 text-teal-700 dark:bg-teal/15 dark:text-teal-300",
  rose: "bg-rose-50 text-rose-700 dark:bg-rose/15 dark:text-rose-300",
};

export function Badge({ children, tone = "neutral" }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-sm text-xs font-medium ${BADGE_TONES[tone]}`}>
      {children}
    </span>
  );
}

export function Panel({ title, action, children }) {
  return (
    <div className="bg-card border border-line rounded-md shadow-soft">
      {(title || action) && (
        <div className="flex items-center justify-between px-5 py-4 border-b border-line">
          <h2 className="text-sm font-semibold text-ink font-display">{title}</h2>
          {action}
        </div>
      )}
      <div className="p-5">{children}</div>
    </div>
  );
}

export function Button({ children, variant = "primary", className = "", ...props }) {
  const variants = {
    primary: "bg-brand-gradient text-white hover:brightness-110 shadow-glow disabled:opacity-50",
    ghost: "text-muted hover:text-ink",
    danger: "text-rose hover:text-rose-700",
  };
  return (
    <button
      className={`text-sm font-medium rounded-sm px-4 py-2 transition-all ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
