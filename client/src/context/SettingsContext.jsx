import { createContext, useContext, useEffect, useState } from 'react';
import axios from 'axios';

const SettingsContext = createContext({
  settings: { site_name: 'ReturnLoad', logo_url: '', primary_color: '#0B2545', theme_preset: 'navy' },
  refresh: () => {},
});

export function SettingsProvider({ children }) {
  const [settings, setSettings] = useState({
    site_name: 'ReturnLoad',
    logo_url: '',
    primary_color: '#0B2545',
    theme_preset: 'navy',
  });

  async function refresh() {
    try {
      const { data } = await axios.get('/api/settings');
      setSettings(data);
    } catch (_) {}
  }

  useEffect(() => { refresh(); }, []);

  useEffect(() => {
    applyTheme(settings.primary_color || '#0B2545');
  }, [settings.primary_color]);

  return (
    <SettingsContext.Provider value={{ settings, setSettings, refresh }}>
      {children}
    </SettingsContext.Provider>
  );
}

function hexToRgb(hex) {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return m ? { r: parseInt(m[1], 16), g: parseInt(m[2], 16), b: parseInt(m[3], 16) } : null;
}

function darken(hex, amount = 0.15) {
  const rgb = hexToRgb(hex);
  if (!rgb) return hex;
  const r = Math.max(0, Math.round(rgb.r * (1 - amount)));
  const g = Math.max(0, Math.round(rgb.g * (1 - amount)));
  const b = Math.max(0, Math.round(rgb.b * (1 - amount)));
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

function lighten(hex, opacity = 0.08) {
  const rgb = hexToRgb(hex);
  if (!rgb) return hex;
  return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${opacity})`;
}

function applyTheme(primary) {
  const dark   = darken(primary, 0.12);
  const subtle = lighten(primary, 0.08);
  const ring   = lighten(primary, 0.12);
  const border = lighten(primary, 0.35);

  let el = document.getElementById('rl-theme');
  if (!el) {
    el = document.createElement('style');
    el.id = 'rl-theme';
    document.head.appendChild(el);
  }

  el.textContent = `
    :root {
      --primary: ${primary};
      --primary-dark: ${dark};
      --primary-subtle: ${subtle};
    }

    /* Tailwind bg-navy-* overrides */
    .bg-navy-900  { background-color: ${primary} !important; }
    .bg-navy-800  { background-color: ${dark}    !important; }
    .bg-navy-50   { background-color: ${subtle}  !important; }

    /* Tailwind text-navy-* overrides */
    .text-navy-900 { color: ${primary} !important; }
    .text-navy-400 { color: ${lighten(primary, 0.55)} !important; }

    /* Hover variants */
    .hover\\:bg-navy-900:hover  { background-color: ${primary} !important; }
    .hover\\:bg-navy-800:hover  { background-color: ${dark}    !important; }
    .hover\\:bg-navy-50:hover   { background-color: ${subtle}  !important; }
    .hover\\:text-navy-900:hover { color: ${primary} !important; }

    /* Border */
    .border-navy-900 { border-color: ${primary} !important; }
    .border-navy-200 { border-color: ${lighten(primary, 0.25)} !important; }

    /* Focus ring / border on inputs */
    .focus\\:border-navy-900\\/40:focus { border-color: ${border} !important; }
    .focus\\:ring-navy-900\\/10:focus   { --tw-ring-color: ${ring} !important; }

    /* Custom component classes */
    .btn-primary {
      background-color: ${primary} !important;
    }
    .btn-primary:hover:not(:disabled) {
      background-color: ${dark} !important;
    }
    .btn-secondary {
      color: ${primary} !important;
      border-color: ${lighten(primary, 0.25)} !important;
    }
    .btn-secondary:hover {
      background-color: ${subtle} !important;
    }
    .card-hover:hover {
      border-color: ${lighten(primary, 0.25)} !important;
    }
    .badge-booked {
      background-color: ${subtle}  !important;
      color: ${primary}  !important;
      border-color: ${lighten(primary, 0.25)} !important;
    }
    .input-field:focus {
      border-color: ${border} !important;
      --tw-ring-color: ${ring} !important;
    }
    .section-title { color: ${primary} !important; }
  `;
}

export const useSettings = () => useContext(SettingsContext);
