import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import ThemeToggle from "../components/ThemeToggle.jsx";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const idleReason = params.get("reason") === "idle";

  async function onSubmit(e) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      await login(email, password);
      navigate("/");
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen bg-navy flex items-center justify-center px-4 relative overflow-hidden">
      {/* ambient gradient blobs — signature moment */}
      <div className="pointer-events-none absolute -top-32 -left-24 h-96 w-96 rounded-full bg-primary/40 blur-3xl animate-blob" />
      <div className="pointer-events-none absolute top-1/3 -right-24 h-80 w-80 rounded-full bg-accent/30 blur-3xl animate-blob [animation-delay:4s]" />
      <div className="pointer-events-none absolute -bottom-24 left-1/3 h-72 w-72 rounded-full bg-primary-300/20 blur-3xl animate-blob [animation-delay:8s]" />

      <div className="absolute top-5 right-5">
        <ThemeToggle />
      </div>

      <div className="relative w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-brand-gradient text-xl font-bold font-display text-white shadow-glow">
            B
          </div>
          <div className="text-2xl font-semibold text-white tracking-tight font-display">BezProblem</div>
          <div className="text-sm text-white/50 mt-1">Внутренняя система управления</div>
        </div>

        <form
          onSubmit={onSubmit}
          className="bg-card/95 backdrop-blur rounded-lg p-6 space-y-4 shadow-2xl border border-white/10"
        >
          {idleReason && (
            <div className="text-xs bg-primary-50 text-primary-600 dark:bg-primary/15 dark:text-primary-300 rounded-sm px-3 py-2">
              Сессия завершена из-за длительного отсутствия активности. Войдите снова.
            </div>
          )}
          {error && (
            <div className="text-xs bg-rose-50 text-rose-700 dark:bg-rose/15 dark:text-rose-300 rounded-sm px-3 py-2">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-muted mb-1">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input"
              placeholder="you@bezproblem.local"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-muted mb-1">Пароль</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={busy}
            className="w-full bg-brand-gradient text-white text-sm font-medium rounded-sm py-2.5 hover:brightness-110 transition-all shadow-glow disabled:opacity-50"
          >
            {busy ? "Вход…" : "Войти"}
          </button>
        </form>
      </div>
    </div>
  );
}
