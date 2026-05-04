import { createContext, useContext, useEffect, useState } from 'react';
import axios from 'axios';

const SettingsContext = createContext({
  settings: { site_name: 'ReturnLoad', tab_title: '', logo_url: '', favicon_url: '', primary_color: '#0f172a', accent_color: '#f59e0b', theme_preset: 'freight', footer_color: '#1e293b' },
  refresh: () => {},
});

export function SettingsProvider({ children }) {
  const [settings, setSettings] = useState({
    site_name: 'ReturnLoad',
    tab_title: '',
    logo_url: '',
    favicon_url: '',
    primary_color: '#0f172a',
    accent_color: '#f59e0b',
    theme_preset: 'freight',
    footer_color: '#1e293b',
  });

  async function refresh() {
    try {
      const { data } = await axios.get('/api/settings');
      setSettings(data);
    } catch (_) {}
  }

  useEffect(() => { refresh(); }, []);

  useEffect(() => {
    applyTheme(
      settings.primary_color || '#0f172a',
      settings.accent_color  || '#f59e0b',
    );
  }, [settings.primary_color, settings.accent_color]);

  useEffect(() => {
    applyFavicon(settings.favicon_url);
  }, [settings.favicon_url]);

  useEffect(() => {
    const tab  = (settings.tab_title || '').trim();
    const name = (settings.site_name || '').trim();
    const title = tab || name;
    if (title) document.title = title;
  }, [settings.tab_title, settings.site_name]);

  return (
    <SettingsContext.Provider value={{ settings, setSettings, refresh }}>
      {children}
    </SettingsContext.Provider>
  );
}

// ── Colour helpers ────────────────────────────────────────────────────────────

function hexToRgb(hex) {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return m ? { r: parseInt(m[1], 16), g: parseInt(m[2], 16), b: parseInt(m[3], 16) } : null;
}

function darken(hex, amount = 0.15) {
  const rgb = hexToRgb(hex);
  if (!rgb) return hex;
  const c = v => Math.max(0, Math.round(v * (1 - amount))).toString(16).padStart(2, '0');
  return `#${c(rgb.r)}${c(rgb.g)}${c(rgb.b)}`;
}

function lighten(hex, opacity = 0.08) {
  const rgb = hexToRgb(hex);
  if (!rgb) return hex;
  return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${opacity})`;
}

/** Returns #0f172a (dark) or #ffffff (light) depending on accent luminance */
function contrastOn(hex) {
  const rgb = hexToRgb(hex);
  if (!rgb) return '#ffffff';
  const lum = (0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b) / 255;
  return lum > 0.5 ? '#0f172a' : '#ffffff';
}

// ── Favicon injector ──────────────────────────────────────────────────────────

const DEFAULT_FAVICON = '/favicon.svg';

function applyFavicon(url) {
  const href = url && url.trim() ? url.trim() : DEFAULT_FAVICON;
  let link = document.querySelector('link[rel~="icon"]');
  if (!link) {
    link = document.createElement('link');
    link.rel = 'icon';
    document.head.appendChild(link);
  }
  if (link.getAttribute('href') === href) return;
  link.setAttribute('href', href);
  // Drop the type attribute so the browser sniffs from the resource — the admin
  // can paste a .png, .ico, or .svg without us having to know which.
  link.removeAttribute('type');
}

// ── Theme injector ────────────────────────────────────────────────────────────

function applyTheme(primary, accent) {
  const primaryDark   = darken(primary, 0.14);
  const primarySubtle = lighten(primary, 0.07);
  const primaryBorder = lighten(primary, 0.30);
  const primaryRing   = lighten(primary, 0.10);

  const accentDark    = darken(accent, 0.14);
  const accentSubtle  = lighten(accent, 0.12);
  const accentBorder  = lighten(accent, 0.35);
  const accentText    = contrastOn(accent);   // dark/light text on accent bg

  let el = document.getElementById('rl-theme');
  if (!el) {
    el = document.createElement('style');
    el.id = 'rl-theme';
    document.head.appendChild(el);
  }

  el.textContent = `
    :root {
      --primary:        ${primary};
      --primary-dark:   ${primaryDark};
      --primary-subtle: ${primarySubtle};
      --accent:         ${accent};
      --accent-dark:    ${accentDark};
      --accent-subtle:  ${accentSubtle};
      --accent-text:    ${accentText};
    }

    /* ── Primary overrides ────────────────── */
    .bg-navy-900  { background-color: ${primary}       !important; }
    .bg-navy-800  { background-color: ${primaryDark}   !important; }
    .bg-navy-50   { background-color: ${primarySubtle} !important; }

    .text-navy-900 { color: ${primary}     !important; }
    .text-navy-600 { color: ${darken(primary, 0.05)} !important; }
    .text-navy-400 { color: ${lighten(primary, 0.5)} !important; }
    .text-navy-300 { color: ${lighten(accent, 0.75)} !important; }

    .hover\\:bg-navy-900:hover   { background-color: ${primary}       !important; }
    .hover\\:bg-navy-800:hover   { background-color: ${primaryDark}   !important; }
    .hover\\:bg-navy-50:hover    { background-color: ${primarySubtle} !important; }
    .hover\\:text-navy-900:hover { color: ${primary} !important; }

    .border-navy-900 { border-color: ${primary} !important; }
    .border-navy-200 { border-color: ${lighten(primary, 0.20)} !important; }

    .focus\\:border-navy-900\\/40:focus { border-color: ${primaryBorder} !important; }
    .focus\\:ring-navy-900\\/10:focus   { --tw-ring-color: ${primaryRing} !important; }

    /* ── Accent overrides ─────────────────── */
    .bg-accent        { background-color: ${accent}       !important; }
    .bg-accent-subtle { background-color: ${accentSubtle} !important; }
    .text-accent      { color: ${accent} !important; }
    .border-accent    { border-color: ${accent} !important; }

    /* ── Component classes ────────────────── */
    .btn-primary {
      background-color: ${primary} !important;
      color: #fff !important;
    }
    .btn-primary:hover:not(:disabled) {
      background-color: ${primaryDark} !important;
    }
    .btn-accent {
      background-color: ${accent}   !important;
      color: ${accentText}          !important;
    }
    .btn-accent:hover:not(:disabled) {
      background-color: ${accentDark} !important;
    }
    .btn-secondary {
      color: ${primary}                         !important;
      border-color: ${lighten(primary, 0.22)}   !important;
    }
    .btn-secondary:hover {
      background-color: ${primarySubtle} !important;
    }
    .card-hover:hover {
      border-color: ${lighten(accent, 0.30)} !important;
      box-shadow: 0 4px 20px ${lighten(primary, 0.06)} !important;
    }
    .badge-booked {
      background-color: ${accentSubtle} !important;
      color: ${darken(accent, 0.15)}    !important;
      border-color: ${accentBorder}     !important;
    }
    .input-field:focus {
      border-color: ${primaryBorder}   !important;
      --tw-ring-color: ${primaryRing}  !important;
    }
    .section-title { color: ${primary} !important; }
  `;
}

export const useSettings = () => useContext(SettingsContext);
