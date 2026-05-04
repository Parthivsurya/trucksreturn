import { useState, useEffect } from 'react';
import AdminLayout from '../../components/AdminLayout.jsx';
import { useAdminApi } from '../../hooks/useAdminApi.js';
import { useSettings } from '../../context/SettingsContext.jsx';
import { Settings, Palette, Type, Check, Mail, Eye, EyeOff, Send, ToggleLeft, ToggleRight, ShieldCheck } from 'lucide-react';
import toast from 'react-hot-toast';

const PRESETS = [
  { id: 'freight',  label: 'Freight',  primary: '#0f172a', accent: '#f59e0b' },  // default
  { id: 'navy',     label: 'Navy',     primary: '#0B2545', accent: '#3b82f6' },
  { id: 'midnight', label: 'Midnight', primary: '#1a1a2e', accent: '#6366f1' },
  { id: 'forest',   label: 'Forest',   primary: '#1a4731', accent: '#22c55e' },
  { id: 'burgundy', label: 'Burgundy', primary: '#7b1c1c', accent: '#f97316' },
  { id: 'teal',     label: 'Teal',     primary: '#0f4c5c', accent: '#06b6d4' },
  { id: 'slate',    label: 'Slate',    primary: '#2d3748', accent: '#f59e0b' },
  { id: 'custom',   label: 'Custom',   primary: null,      accent: null },
];

export default function AdminSettings() {
  const api = useAdminApi();
  const { settings, setSettings } = useSettings();
  const [form, setForm]         = useState({ site_name: '', tab_title: '', logo_url: '', favicon_url: '', primary_color: '#0f172a', accent_color: '#f59e0b', footer_color: '#1e293b', theme_preset: 'freight', smtp_enabled: '0', smtp_host: '', smtp_port: '587', smtp_secure: '0', smtp_user: '', smtp_pass: '', smtp_from_name: '', smtp_from_email: '', email_on_login: '1', email_on_booking_shipper: '1', email_on_booking_driver: '1', email_on_status_change: '1', email_on_load_status: '1', security_rate_limit: '1', security_otp_required: '1' });
  const [savingSecurity, setSavingSecurity] = useState(false);
  const [savingTheme, setSavingTheme] = useState(false);
  const [savingSmtp,  setSavingSmtp]  = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [testTo, setTestTo]     = useState('');
  const [testing, setTesting]   = useState(false);

  // Load full settings from admin endpoint (includes sensitive keys not in public API)
  useEffect(() => {
    api.get('/settings').then(data => {
      setForm({
        site_name:               data.site_name               || 'ReturnLoad',
        tab_title:               data.tab_title               || '',
        logo_url:                data.logo_url                || '',
        favicon_url:             data.favicon_url             || '',
        primary_color:           data.primary_color           || '#0f172a',
        theme_preset:            data.theme_preset            || 'freight',
        smtp_enabled:            data.smtp_enabled            || '0',
        smtp_host:               data.smtp_host               || '',
        smtp_port:               data.smtp_port               || '587',
        smtp_secure:             data.smtp_secure             || '0',
        smtp_user:               data.smtp_user               || '',
        smtp_pass:               data.smtp_pass               || '',
        smtp_from_name:          data.smtp_from_name          || '',
        smtp_from_email:         data.smtp_from_email         || '',
        accent_color:            data.accent_color            ?? '#f59e0b',
        footer_color:            data.footer_color            ?? '#1e293b',
        security_rate_limit:     data.security_rate_limit     ?? '1',
        security_otp_required:   data.security_otp_required   ?? '1',
        email_on_login:          data.email_on_login          ?? '1',
        email_on_booking_shipper:data.email_on_booking_shipper ?? '1',
        email_on_booking_driver: data.email_on_booking_driver  ?? '1',
        email_on_status_change:  data.email_on_status_change  ?? '1',
        email_on_load_status:    data.email_on_load_status    ?? '1',
      });
    }).catch(() => {});
  }, []);

  async function sendTest() {
    if (!testTo) return toast.error('Enter a recipient email address.');
    setTesting(true);
    try {
      await api.post('/settings/test-email', { to: testTo });
      toast.success(`Test email sent to ${testTo}`);
    } catch (err) {
      toast.error(err.message);
    }
    setTesting(false);
  }

  function selectPreset(preset) {
    if (preset.id === 'custom') {
      setForm(f => ({ ...f, theme_preset: 'custom' }));
      return;
    }
    setForm(f => ({ ...f, theme_preset: preset.id, primary_color: preset.primary, accent_color: preset.accent }));
  }

  async function saveTheme() {
    setSavingTheme(true);
    try {
      const data = await api.put('/settings', {
        site_name: form.site_name, tab_title: form.tab_title,
        logo_url: form.logo_url, favicon_url: form.favicon_url,
        primary_color: form.primary_color, accent_color: form.accent_color,
        footer_color: form.footer_color, theme_preset: form.theme_preset,
      });
      setSettings(data);
      toast.success('Theme saved');
    } catch (err) { toast.error(err.message); }
    setSavingTheme(false);
  }

  async function saveSecurity() {
    setSavingSecurity(true);
    try {
      const data = await api.put('/settings', {
        security_rate_limit:   form.security_rate_limit,
        security_otp_required: form.security_otp_required,
      });
      setSettings(data);
      toast.success('Security settings saved');
    } catch (err) { toast.error(err.message); }
    setSavingSecurity(false);
  }

  async function saveSmtp() {
    setSavingSmtp(true);
    try {
      const data = await api.put('/settings', {
        smtp_enabled: form.smtp_enabled, smtp_host: form.smtp_host, smtp_port: form.smtp_port,
        smtp_secure: form.smtp_secure, smtp_user: form.smtp_user, smtp_pass: form.smtp_pass,
        smtp_from_name: form.smtp_from_name, smtp_from_email: form.smtp_from_email,
        email_on_login: form.email_on_login, email_on_booking_shipper: form.email_on_booking_shipper,
        email_on_booking_driver: form.email_on_booking_driver, email_on_status_change: form.email_on_status_change,
        email_on_load_status: form.email_on_load_status,
      });
      setSettings(data);
      toast.success('Email settings saved');
    } catch (err) { toast.error(err.message); }
    setSavingSmtp(false);
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
              <p className="text-xs text-slate-400 mt-1">Shown in the navbar, landing page, and login screens</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Browser Tab Title</label>
              <input
                type="text"
                value={form.tab_title}
                onChange={e => setForm(f => ({ ...f, tab_title: e.target.value }))}
                placeholder="ReturnLoad — Smart Return Load Platform"
                className="input-field"
              />
              <p className="text-xs text-slate-400 mt-1">
                Shown in the browser tab and bookmark text. Leave blank to use the Site Name above.
              </p>
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

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Favicon URL</label>
              <input
                type="url"
                value={form.favicon_url}
                onChange={e => setForm(f => ({ ...f, favicon_url: e.target.value }))}
                placeholder="https://example.com/favicon.png  or  /uploads/favicon.png"
                className="input-field"
              />
              <p className="text-xs text-slate-400 mt-1">
                Browser tab icon. Square images work best (32×32 or 64×64). Accepts .ico, .png, or .svg. Leave blank to use the default <code className="bg-slate-100 px-1 rounded">/favicon.svg</code>.
              </p>

              {/* Favicon preview */}
              {form.favicon_url && (
                <div className="mt-3 flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <img
                    src={form.favicon_url}
                    alt="Favicon preview"
                    className="h-8 w-8 object-contain"
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
            {PRESETS.map(p => {
              const pri = p.primary || form.primary_color;
              const acc = p.accent  || form.accent_color;
              const active = activePreset === p.id;
              return (
                <button
                  key={p.id}
                  onClick={() => selectPreset(p)}
                  className="flex flex-col items-center gap-1.5 group"
                  title={p.label}
                >
                  <div
                    className="w-10 h-10 rounded-xl border-2 transition-all overflow-hidden"
                    style={{
                      borderColor: active ? '#94a3b8' : 'transparent',
                      boxShadow: active ? `0 0 0 2px white, 0 0 0 4px ${pri}` : 'none',
                    }}
                  >
                    <div
                      className="w-full h-full flex items-center justify-center"
                      style={{ background: `linear-gradient(135deg, ${pri} 50%, ${acc} 50%)` }}
                    >
                      {active && <Check size={14} className="text-white drop-shadow" strokeWidth={3} />}
                    </div>
                  </div>
                  <span className="text-[10px] text-slate-500 group-hover:text-slate-700">{p.label}</span>
                </button>
              );
            })}
          </div>

          {/* Custom color pickers — primary + accent + footer */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Custom colors</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Primary */}
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={form.primary_color}
                  onChange={e => setForm(f => ({ ...f, primary_color: e.target.value, theme_preset: 'custom' }))}
                  className="w-10 h-10 rounded-lg border border-slate-200 cursor-pointer p-0.5 bg-white shrink-0"
                />
                <div className="flex-1">
                  <p className="text-xs text-slate-500 mb-1">Dark (Primary)</p>
                  <input
                    type="text"
                    value={form.primary_color}
                    onChange={e => setForm(f => ({ ...f, primary_color: e.target.value, theme_preset: 'custom' }))}
                    placeholder="#0B2545"
                    className="input-field !py-1.5 font-mono text-sm"
                    maxLength={7}
                  />
                </div>
              </div>
              {/* Accent */}
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={form.accent_color}
                  onChange={e => setForm(f => ({ ...f, accent_color: e.target.value, theme_preset: 'custom' }))}
                  className="w-10 h-10 rounded-lg border border-slate-200 cursor-pointer p-0.5 bg-white shrink-0"
                />
                <div className="flex-1">
                  <p className="text-xs text-slate-500 mb-1">Light (Accent)</p>
                  <input
                    type="text"
                    value={form.accent_color}
                    onChange={e => setForm(f => ({ ...f, accent_color: e.target.value, theme_preset: 'custom' }))}
                    placeholder="#1976D2"
                    className="input-field !py-1.5 font-mono text-sm"
                    maxLength={7}
                  />
                </div>
              </div>
              {/* Footer */}
              <div className="flex items-center gap-3 sm:col-span-2">
                <input
                  type="color"
                  value={form.footer_color}
                  onChange={e => setForm(f => ({ ...f, footer_color: e.target.value }))}
                  className="w-10 h-10 rounded-lg border border-slate-200 cursor-pointer p-0.5 bg-white shrink-0"
                />
                <div className="flex-1">
                  <p className="text-xs text-slate-500 mb-1">Footer Background</p>
                  <input
                    type="text"
                    value={form.footer_color}
                    onChange={e => setForm(f => ({ ...f, footer_color: e.target.value }))}
                    placeholder="#1e293b"
                    className="input-field !py-1.5 font-mono text-sm"
                    maxLength={7}
                  />
                </div>
                <div
                  className="w-24 h-10 rounded-xl border border-slate-200 shrink-0 flex items-center justify-center"
                  style={{ backgroundColor: form.footer_color }}
                >
                  <span className="text-[10px] font-semibold mix-blend-difference text-white">Footer</span>
                </div>
              </div>
            </div>
          </div>

          {/* Live preview strip */}
          <div className="mt-4 p-4 bg-slate-50 rounded-xl border border-slate-200">
            <p className="text-xs text-slate-400 mb-3 uppercase tracking-wider font-medium">Live preview — 3 colour theme</p>
            <div className="flex flex-wrap items-center gap-3">
              <button className="px-4 py-2 text-white text-sm font-semibold rounded-xl" style={{ backgroundColor: form.primary_color }}>Primary</button>
              <button className="px-4 py-2 text-white text-sm font-semibold rounded-xl" style={{ backgroundColor: form.accent_color }}>Accent</button>
              <button className="px-4 py-2 text-sm font-semibold rounded-xl border bg-white" style={{ color: form.primary_color, borderColor: form.primary_color + '44' }}>Secondary</button>
              <span className="px-3 py-1 text-xs font-semibold rounded-full border" style={{ backgroundColor: form.accent_color + '18', color: form.accent_color, borderColor: form.accent_color + '44' }}>Badge</span>
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: form.accent_color }}>
                <span className="text-white text-xs font-bold">✦</span>
              </div>
              <div className="flex items-center gap-1 px-3 py-1.5 rounded-lg" style={{ backgroundColor: form.primary_color }}>
                <span className="text-white text-xs font-medium">Navbar</span>
                <span className="ml-2 px-2 py-0.5 rounded text-xs text-white font-semibold" style={{ borderBottom: `2px solid ${form.accent_color}` }}>Active</span>
              </div>
            </div>
          </div>

          {/* Theme save */}
          <div className="mt-5 flex justify-end">
            <button onClick={saveTheme} disabled={savingTheme} className="btn-primary flex items-center gap-2">
              <Check size={15} /> {savingTheme ? 'Saving…' : 'Save Theme'}
            </button>
          </div>
        </section>

        {/* SMTP / Email */}
        <section className="card mb-6">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center">
                <Mail size={15} className="text-slate-600" />
              </div>
              <div>
                <h2 className="font-bold text-navy-900">Email / SMTP</h2>
                <p className="text-xs text-slate-400">Login alerts and transaction notifications</p>
              </div>
            </div>
            {/* Enable toggle */}
            <button
              type="button"
              onClick={() => setForm(f => ({ ...f, smtp_enabled: f.smtp_enabled === '1' ? '0' : '1' }))}
              className="flex items-center gap-2 text-sm font-medium"
            >
              {form.smtp_enabled === '1'
                ? <><ToggleRight size={28} className="text-green-500" /> <span className="text-green-600">Enabled</span></>
                : <><ToggleLeft  size={28} className="text-slate-400" /> <span className="text-slate-400">Disabled</span></>}
            </button>
          </div>

          <div className={form.smtp_enabled !== '1' ? 'opacity-50 pointer-events-none' : ''}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <div className="sm:col-span-2 flex gap-3">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">SMTP Host</label>
                  <input type="text" value={form.smtp_host}
                    onChange={e => setForm(f => ({ ...f, smtp_host: e.target.value }))}
                    className="input-field" placeholder="smtp.gmail.com" />
                </div>
                <div className="w-28">
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Port</label>
                  <input type="number" value={form.smtp_port}
                    onChange={e => setForm(f => ({ ...f, smtp_port: e.target.value }))}
                    className="input-field" placeholder="587" />
                </div>
                <div className="w-24 flex flex-col justify-end pb-1">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input type="checkbox" checked={form.smtp_secure === '1'}
                      onChange={e => setForm(f => ({ ...f, smtp_secure: e.target.checked ? '1' : '0' }))}
                      className="w-4 h-4 rounded accent-navy-900" />
                    <span className="text-sm text-slate-700">SSL/TLS</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">SMTP Username</label>
                <input type="email" value={form.smtp_user}
                  onChange={e => setForm(f => ({ ...f, smtp_user: e.target.value }))}
                  className="input-field" placeholder="you@gmail.com" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">SMTP Password</label>
                <div className="relative">
                  <input type={showPass ? 'text' : 'password'} value={form.smtp_pass}
                    onChange={e => setForm(f => ({ ...f, smtp_pass: e.target.value }))}
                    className="input-field !pr-10" placeholder="App password or SMTP password" />
                  <button type="button" onClick={() => setShowPass(p => !p)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                    {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">From Name</label>
                <input type="text" value={form.smtp_from_name}
                  onChange={e => setForm(f => ({ ...f, smtp_from_name: e.target.value }))}
                  className="input-field" placeholder="ReturnLoad Platform" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">From Email</label>
                <input type="email" value={form.smtp_from_email}
                  onChange={e => setForm(f => ({ ...f, smtp_from_email: e.target.value }))}
                  className="input-field" placeholder="noreply@yourplatform.com" />
              </div>
            </div>

            {/* Per-notification toggles */}
            <div className="border border-slate-200 rounded-xl overflow-hidden mb-4">
              <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200">
                <p className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Notification Triggers</p>
              </div>
              {[
                { key: 'email_on_login',           label: 'Login alerts',          desc: 'Notify users when a new login is detected on their account' },
                { key: 'email_on_booking_shipper', label: 'Booking — shipper',     desc: 'Notify shipper when a driver books their load' },
                { key: 'email_on_booking_driver',  label: 'Booking — driver',      desc: 'Send driver a confirmation when they book a load' },
                { key: 'email_on_status_change',   label: 'Booking status changes',desc: 'Notify both parties on every booking status update' },
                { key: 'email_on_load_status',     label: 'Load status changes',   desc: 'Notify shipper when admin updates their load status' },
              ].map(({ key, label, desc }) => (
                <div key={key} className="flex items-center justify-between px-4 py-3 border-b border-slate-100 last:border-0">
                  <div>
                    <p className="text-sm font-medium text-slate-700">{label}</p>
                    <p className="text-xs text-slate-400">{desc}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setForm(f => ({ ...f, [key]: f[key] === '1' ? '0' : '1' }))}
                    className="flex items-center gap-1.5 text-sm font-medium shrink-0 ml-4"
                  >
                    {form[key] === '1'
                      ? <><ToggleRight size={24} className="text-green-500" /><span className="text-green-600 text-xs">On</span></>
                      : <><ToggleLeft  size={24} className="text-slate-400" /><span className="text-slate-400 text-xs">Off</span></>}
                  </button>
                </div>
              ))}
            </div>

            {/* Test email */}
            <div className="flex gap-3 p-4 bg-slate-50 rounded-xl border border-slate-200">
              <input type="email" value={testTo} onChange={e => setTestTo(e.target.value)}
                className="input-field flex-1 !py-2.5 text-sm" placeholder="Send test email to…" />
              <button onClick={sendTest} disabled={testing}
                className="flex items-center gap-2 px-4 py-2.5 bg-navy-900 text-white text-sm font-semibold rounded-xl hover:bg-navy-800 transition-colors disabled:opacity-50">
                <Send size={14} /> {testing ? 'Sending…' : 'Send Test'}
              </button>
            </div>
            <p className="text-xs text-slate-400 mt-2">
              For Gmail, use an <strong>App Password</strong> (Google Account → Security → 2-Step Verification → App passwords). Port 587 with SSL/TLS off, or port 465 with SSL/TLS on.
            </p>
          </div>

          {/* SMTP save */}
          <div className="mt-5 flex justify-end">
            <button onClick={saveSmtp} disabled={savingSmtp} className="btn-primary flex items-center gap-2">
              <Check size={15} /> {savingSmtp ? 'Saving…' : 'Save Email Settings'}
            </button>
          </div>
        </section>

        {/* Security */}
        <section className="card mb-6">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center">
              <ShieldCheck size={15} className="text-slate-600" />
            </div>
            <div>
              <h2 className="font-bold text-navy-900">Security</h2>
              <p className="text-xs text-slate-400">Toggle these off only while testing. Turn them back on before going live.</p>
            </div>
          </div>

          <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 mb-4">
            ⚠️ Disabling security features exposes your platform to abuse. Only turn them off during local testing.
          </div>

          <div className="border border-slate-200 rounded-xl overflow-hidden">
            {[
              {
                key: 'security_rate_limit',
                label: 'Rate Limiting',
                desc: 'Limits OTP requests (5/15 min), logins (10/15 min), and registrations (5/hr) per IP. Disable if you\'re hitting limits while testing.',
              },
              {
                key: 'security_otp_required',
                label: 'OTP Email Verification',
                desc: 'Requires email OTP for registration and password reset. When OFF, the OTP is returned in the API response and auto-filled on screen — no email needed.',
              },
            ].map(({ key, label, desc }) => (
              <div key={key} className="flex items-center justify-between px-4 py-4 border-b border-slate-100 last:border-0">
                <div>
                  <p className="text-sm font-semibold text-slate-700">{label}</p>
                  <p className="text-xs text-slate-400 mt-0.5 max-w-md">{desc}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setForm(f => ({ ...f, [key]: f[key] === '1' ? '0' : '1' }))}
                  className="flex items-center gap-2 text-sm font-medium shrink-0 ml-6"
                >
                  {form[key] === '1'
                    ? <><ToggleRight size={28} className="text-green-500" /><span className="text-green-600 text-xs">ON</span></>
                    : <><ToggleLeft  size={28} className="text-slate-400" /><span className="text-slate-400 text-xs">OFF</span></>}
                </button>
              </div>
            ))}
          </div>

          <div className="mt-5 flex justify-end">
            <button onClick={saveSecurity} disabled={savingSecurity} className="btn-primary flex items-center gap-2">
              <Check size={15} /> {savingSecurity ? 'Saving…' : 'Save Security Settings'}
            </button>
          </div>
        </section>
      </div>
    </AdminLayout>
  );
}
