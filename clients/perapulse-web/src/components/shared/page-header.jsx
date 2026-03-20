import { useUiStore } from "@/store/ui-store";

export function PageHeader({ title, subtitle, actions }) {
  const { darkMode } = useUiStore();
  
  return (
    <div className={`mb-6 flex flex-col gap-4 rounded-3xl border px-5 py-5 shadow-lg backdrop-blur-xl sm:flex-row sm:items-start sm:justify-between transition-all duration-300 ${darkMode ? 'border-cyan-500/30 bg-gradient-to-br from-slate-900/60 to-blue-900/40 hover:border-cyan-400/50' : 'border-blue-200 bg-gradient-to-br from-blue-50 to-white hover:border-blue-300'}`}>
      <div className="min-w-0">
        <p className={`text-[11px] font-semibold uppercase tracking-[0.22em] ${darkMode ? 'bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent' : 'bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent'}`}>
          PeraPulse
        </p>
        <h1 className={`mt-2 text-2xl font-bold tracking-tight ${darkMode ? 'text-white' : 'text-slate-900'}`}>
          {title}
        </h1>
        {subtitle && (
          <p className={`mt-1.5 max-w-2xl text-sm leading-6 ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>
            {subtitle}
          </p>
        )}
      </div>
      {actions && (
        <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>
      )}
    </div>
  );
}
