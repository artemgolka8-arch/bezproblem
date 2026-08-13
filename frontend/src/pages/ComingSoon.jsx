export default function ComingSoon({ title }) {
  return (
    <div className="space-y-2">
      <h1 className="text-xl font-semibold text-ink font-display">{title}</h1>
      <div className="bg-card border border-line rounded-md p-8 text-center shadow-soft">
        <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-primary-50 dark:bg-primary/15 text-primary text-lg">
          ⚡
        </div>
        <p className="text-sm text-muted">
          Этот раздел спроектирован в базе данных и будет реализован в следующей фазе,
          сразу после каркаса авторизации и Dashboard.
        </p>
      </div>
    </div>
  );
}
