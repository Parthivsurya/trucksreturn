export default function StatCard({ icon: Icon, label, value, color = 'blue', prefix = '' }) {
  const isAccent = color === 'blue';

  const staticColors = {
    amber:  { bg: '#fffbeb', icon: '#b45309' },
    green:  { bg: '#f0fdf4', icon: '#15803d' },
    red:    { bg: '#fef2f2', icon: '#dc2626' },
    purple: { bg: '#f1f5f9', icon: '#475569' },
  };

  const sc = !isAccent ? staticColors[color] : null;

  return (
    <div className="stat-card !p-4">
      <div
        className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center shrink-0"
        style={isAccent
          ? { backgroundColor: 'var(--accent-subtle, rgba(25,118,210,0.12))', color: 'var(--accent, #1976D2)' }
          : { backgroundColor: sc?.bg, color: sc?.icon }
        }
      >
        <Icon size={17} />
      </div>
      <div>
        <p className="text-[10px] sm:text-xs text-slate-400 uppercase tracking-wider font-medium leading-tight">{label}</p>
        <p className="text-lg sm:text-2xl font-bold text-navy-900 mt-0.5">
          {prefix}{typeof value === 'number' ? value.toLocaleString('en-IN') : value}
        </p>
      </div>
    </div>
  );
}
