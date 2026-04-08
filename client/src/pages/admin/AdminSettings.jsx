import { useState, useEffect } from 'react';
import AdminLayout from '../../components/AdminLayout.jsx';
import { useAdminApi } from '../../hooks/useAdminApi.js';
import { useSettings } from '../../context/SettingsContext.jsx';
import { Settings, Palette, Image, Type, Check, Upload } from 'lucide-react';
import toast from 'react-hot-toast';

const PRESETS = [
  { id: 'navy',     label: 'Navy',    color: '#0B2545' },
  { id: 'midnight', label: 'Midnight', color: '#1a1a2e' },
  { id: 'forest',   label: 'Forest',   color: '#1a4731' },
  { id: 'burgundy', label: 'Burgundy', color: '#7b1c1c' },
  { id: 'purple',   label: 'Purple',   color: '#3d1a6b' },
  { id: 'teal',     label: 'Teal',     color: '#0f4c5c' },
  { id: 'slate',    label: 'Slate',    color: '#2d3748' },
  { id: 'custom',   label: 'Custom',   color: null },
];

export default function AdminSettings() {
  const api = useAdminApi();
  const { settings, setSettings } = useSettings();
  const [form, setForm]     = useState({ site_name: '', logo_url: '', primary_color: '#0B2545', theme_preset: 'navy' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (settings.site_name !== undefined) {
      setForm({
        site_name:     settings.site_name     || 'ReturnLoad',
        logo_url:      settings.logo_url      || '',
        primary_color: settings.primary_color || '#0B2545',
        theme_preset:  settings.theme_preset  || 'navy',
      });
    }
  }, [settings]);

  function selectPreset(preset) {
    if (preset.id === 'custom') {
      setForm(f => ({ ...f, theme_preset: 'custom' }));
      return;
    }
    setForm(f => ({ ...f, theme_preset: preset.id, primary_color: preset.color }));
  }

  async function save() {
    setSaving(true);
    try {
      const data = await api.put('/settings', form);
      setSettings(data);
      toast.success('Settings saved');
    } catch (err) {
      toast.error(err.message);
    }
    setSaving(false);
  }

  const activePreset = form.theme_preset;

  return (
    <AdminLayout>
      <div className="p-6 lg:p-8 max-w-3xl">
        <div className="mb-8">
          <h1 className="text-2xl font-black text-navy-900 flex items-center gap-2">
            <Settings size={24} /> Platform Settings
          </h1>
          <p className="text-slate-500 text-sm mt-1">Customise branding and appearance — no code required</p>
        </div>

        {/* Branding */}
        <section className="card mb-6">
          <div className="flex items-center gap-2 mb-5">
            <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center">
              <Type size={15} className="text-slate-600" />
            </div>
            <h2 className="font-bold text-navy-900">Branding</h2>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Site Name</label>
              <input
                type="text"
                value={form.site_name}
                onChange={e => setForm(f => ({ ...f, site_name: e.target.value }))}
                placeholder="ReturnLoad"
                className="input-field"
              />
              <p className="text-xs text-slate-400 mt-1">Shown in the navbar and browser tab</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Logo URL</label>
              <div className="flex gap-3">
                <input
                  type="url"
                  value={form.logo_url}
                  onChange={e => setForm(f => ({ ...f, logo_url: e.target.value }))}
                  placeholder="https://example.com/logo.png  or  /uploads/logo.png"
                  className="input-field"
                />
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Paste any image URL, or upload a file via the documents endpoint and paste the path (e.g. <code className="bg-slate-100 px-1 rounded">/uploads/filename.png</code>). Leave blank to use the default icon.
              </p>

              {/* Logo preview */}
              {form.logo_url && (
                <div className="mt-3 flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <img
                    src={form.logo_url}
                    alt="Logo preview"
                    className="h-10 w-auto object-contain"
                    onError={e => { e.target.style.display = 'none'; }}
                  />
                  <span className="text-sm text-slate-500">Preview</span>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Theme */}
        <section className="card mb-6">
          <div className="flex items-center gap-2 mb-5">
            <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center">
              <Palette size={15} className="text-slate-600" />
            </div>
            <h2 className="font-bold text-navy-900">Theme Color</h2>
          </div>

          <p className="text-sm text-slate-500 mb-4">Choose a preset or pick a custom color. This changes buttons, sidebar, active states, and headings.</p>

          {/* Preset grid */}
          <div className="grid grid-cols-4 sm:grid-cols-8 gap-2 mb-5">
            {PRESETS.map(p => (
              <button
                key={p.id}
                onClick={() => selectPreset(p)}
                className="flex flex-col items-center gap-1.5 group"
                title={p.label}
              >
                <div
                  className="w-10 h-10 rounded-xl border-2 transition-all flex items-center justify-center"
                  style={{
                    backgroundColor: p.color || form.primary_color,
                    borderColor: activePreset === p.id ? '#94a3b8' : 'transparent',
                    boxShadow: activePreset === p.id ? '0 0 0 2px white, 0 0 0 4px ' + (p.color || form.primary_color) : 'none',
                  }}
                >
                  {activePreset === p.id && <Check size={14} className="text-white" strokeWidth={3} />}
                </div>
                <span className="text-[10px] text-slate-500 group-hover:text-slate-700">{p.label}</span>
              </button>
            ))}
          </div>

          {/* Custom color picker — always visible */}
          <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl border border-slate-200">
            <label className="text-sm font-medium text-slate-700 whitespace-nowrap">Custom color</label>
            <div className="flex items-center gap-3 flex-1">
              <input
                type="color"
                value={form.primary_color}
                onChange={e => setForm(f => ({ ...f, primary_color: e.target.value, theme_preset: 'custom' }))}
                className="w-10 h-10 rounded-lg border border-slate-200 cursor-pointer p-0.5 bg-white"
              />
              <input
                type="text"
                value={form.primary_color}
                onChange={e => {
                  const v = e.target.value;
                  setForm(f => ({ ...f, primary_color: v, theme_preset: 'custom' }));
                }}
                placeholder="#0B2545"
                className="input-field !py-2 !w-32 font-mono text-sm"
                maxLength={7}
              />
              <span className="text-xs text-slate-400">hex code</span>
            </div>
          </div>

          {/* Live preview strip */}
          <div className="mt-4 p-4 bg-slate-50 rounded-xl border border-slate-200">
            <p className="text-xs text-slate-400 mb-3 uppercase tracking-wider font-medium">Live preview</p>
            <div className="flex flex-wrap items-center gap-3">
              <button
                className="px-4 py-2 text-white text-sm font-semibold rounded-xl"
                style={{ backgroundColor: form.primary_color }}
              >
                Primary Button
              </button>
              <button
                className="px-4 py-2 text-sm font-semibold rounded-xl border"
                style={{ color: form.primary_color, borderColor: form.primary_color + '44', backgroundColor: 'white' }}
              >
                Secondary
              </button>
              <span
                className="px-3 py-1 text-xs font-semibold rounded-full border"
                style={{ backgroundColor: form.primary_color + '18', color: form.primary_color, borderColor: form.primary_color + '33' }}
              >
                Badge
              </span>
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: form.primary_color }}
              >
                <span className="text-white text-xs font-bold">A</span>
              </div>
            </div>
          </div>
        </section>

        {/* Save */}
        <div className="flex items-center justify-between">
          <p className="text-sm text-slate-400">Changes apply immediately across the platform</p>
          <button
            onClick={save}
            disabled={saving}
            className="btn-primary"
          >
            {saving ? 'Saving…' : 'Save Settings'}
          </button>
        </div>
      </div>
    </AdminLayout>
  );
}
