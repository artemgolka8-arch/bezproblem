import { useTheme } from "../context/ThemeContext.jsx";

export default function ThemeToggle({ className = "" }) {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={isDark ? "Включить светлую тему" : "Включить тёмную тему"}
      title={isDark ? "Светлая тема" : "Тёмная тема"}
      className={`group relative inline-flex h-8 w-14 shrink-0 items-center rounded-full transition-colors duration-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${
        isDark ? "bg-white/10" : "bg-primary-100"
      } ${className}`}
    >
      <span
        className={`inline-flex h-6 w-6 items-center justify-center rounded-full bg-brand-gradient shadow-glow transform transition-transform duration-300 ${
          isDark ? "translate-x-[30px]" : "translate-x-1"
        }`}
      >
        {isDark ? (
          <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 text-white" fill="currentColor">
            <path d="M12 3a9 9 0 1 0 8.94 10.06A7 7 0 0 1 12 3Z" />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 text-white" fill="currentColor">
            <circle cx="12" cy="12" r="4.5" />
            <path
              strokeWidth="2"
              stroke="currentColor"
              strokeLinecap="round"
              d="M12 2v2M12 20v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M2 12h2M20 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4"
            />
          </svg>
        )}
      </span>
    </button>
  );
}
