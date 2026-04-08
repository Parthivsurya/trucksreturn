export default function StatCard({ icon: Icon, label, value, color = 'blue', prefix = '' }) {
  const iconColors = {
    blue:   'bg-navy-50 text-navy-900',
    amber:  'bg-amber-50 text-amber-700',
    green:  'bg-green-50 text-green-700',
    red:    'bg-red-50 text-red-600',
    purple: 'bg-slate-100 text-slate-700',
  };

  return (
    <div className="stat-card">
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${iconColors[color]}`}>
        <Icon size={20} />
      </div>
      <div>
        <p className="text-xs text-slate-400 uppercase tracking-wider font-medium">{label}</p>
        <p className="text-2xl font-bold text-navy-900 mt-0.5">
          {prefix}{typeof value === 'number' ? value.toLocaleString('en-IN') : value}
        </p>
      </div>
    </div>
  );
}
