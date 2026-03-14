export default function StatCard({ icon: Icon, label, value, color = 'blue', prefix = '' }) {
  const colors = {
    blue: 'from-blue-500/20 to-cyan-500/20 text-blue-400 border-blue-500/20',
    amber: 'from-amber-500/20 to-orange-500/20 text-amber-400 border-amber-500/20',
    green: 'from-green-500/20 to-emerald-500/20 text-green-400 border-green-500/20',
    red: 'from-red-500/20 to-pink-500/20 text-red-400 border-red-500/20',
    purple: 'from-purple-500/20 to-violet-500/20 text-purple-400 border-purple-500/20',
  };

  return (
    <div className={`stat-card bg-gradient-to-br ${colors[color]} border`}>
      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${colors[color]} flex items-center justify-center`}>
        <Icon size={22} />
      </div>
      <div>
        <p className="text-xs text-gray-400 uppercase tracking-wider">{label}</p>
        <p className="text-2xl font-bold text-white mt-0.5">
          {prefix}{typeof value === 'number' ? value.toLocaleString('en-IN') : value}
        </p>
      </div>
    </div>
  );
}
