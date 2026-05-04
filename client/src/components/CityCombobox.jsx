import { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronDown, X, Search } from 'lucide-react';
import { CITIES } from '../lib/cities.js';

// Searchable city picker. `value` is the city name (string).
// `onChange(cityObject | null)` fires with the full {name,state,lat,lng} on pick,
// or null when the user clears the field.
export default function CityCombobox({
  value,
  onChange,
  placeholder = 'Search city or state…',
  required = false,
  disabledCity = null,
  iconColor = 'text-slate-400',
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [highlight, setHighlight] = useState(0);
  const wrapRef = useRef(null);
  const inputRef = useRef(null);
  const listRef = useRef(null);

  const selected = useMemo(
    () => CITIES.find(c => c.name === value) || null,
    [value]
  );

  // Show the selected city in the input when closed; show the live query while typing.
  const inputValue = open
    ? query
    : selected
      ? `${selected.name} — ${selected.state}`
      : '';

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return CITIES;
    return CITIES.filter(c =>
      c.name.toLowerCase().includes(q) || c.state.toLowerCase().includes(q)
    );
  }, [query]);

  // Reset highlight whenever the filtered list changes.
  useEffect(() => { setHighlight(0); }, [query, open]);

  // Click-outside closes the dropdown.
  useEffect(() => {
    if (!open) return;
    function onDoc(e) {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) {
        setOpen(false);
        setQuery('');
      }
    }
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [open]);

  // Keep the highlighted row scrolled into view.
  useEffect(() => {
    if (!open || !listRef.current) return;
    const el = listRef.current.querySelector(`[data-idx="${highlight}"]`);
    if (el) el.scrollIntoView({ block: 'nearest' });
  }, [highlight, open]);

  function pick(city) {
    if (disabledCity && city.name === disabledCity) return;
    onChange?.(city);
    setOpen(false);
    setQuery('');
    inputRef.current?.blur();
  }

  function clear() {
    onChange?.(null);
    setQuery('');
    setOpen(true);
    inputRef.current?.focus();
  }

  function onKeyDown(e) {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (!open) setOpen(true);
      setHighlight(h => Math.min(h + 1, filtered.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlight(h => Math.max(h - 1, 0));
    } else if (e.key === 'Enter') {
      if (open && filtered[highlight]) {
        e.preventDefault();
        pick(filtered[highlight]);
      }
    } else if (e.key === 'Escape') {
      setOpen(false);
      setQuery('');
      inputRef.current?.blur();
    }
  }

  return (
    <div ref={wrapRef} className="relative">
      <div className="relative">
        <Search
          size={14}
          className={`absolute left-3 top-1/2 -translate-y-1/2 ${iconColor} pointer-events-none`}
        />
        <input
          ref={inputRef}
          type="text"
          className="input-field !pl-9 !pr-9"
          placeholder={placeholder}
          value={inputValue}
          onFocus={() => setOpen(true)}
          onChange={e => { setQuery(e.target.value); setOpen(true); }}
          onKeyDown={onKeyDown}
          autoComplete="off"
          spellCheck={false}
          aria-autocomplete="list"
          aria-expanded={open}
          required={required && !selected}
        />
        {selected && !open ? (
          <button
            type="button"
            onClick={clear}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-600"
            aria-label="Clear"
          >
            <X size={14} />
          </button>
        ) : (
          <ChevronDown
            size={16}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
          />
        )}
      </div>

      {open && (
        <div
          ref={listRef}
          className="absolute z-30 mt-1 w-full max-h-64 overflow-auto rounded-xl border border-slate-200 bg-white shadow-lg"
        >
          {filtered.length === 0 ? (
            <div className="px-3 py-3 text-sm text-slate-500">No cities match "{query}"</div>
          ) : (
            filtered.map((c, i) => {
              const isSelected = selected?.name === c.name;
              const isDisabled = disabledCity === c.name;
              return (
                <button
                  type="button"
                  key={`${c.name}-${c.state}`}
                  data-idx={i}
                  onMouseDown={e => e.preventDefault()}
                  onClick={() => pick(c)}
                  onMouseEnter={() => setHighlight(i)}
                  disabled={isDisabled}
                  className={`w-full text-left px-3 py-2 text-sm flex items-baseline justify-between gap-3 ${
                    isDisabled
                      ? 'opacity-40 cursor-not-allowed'
                      : i === highlight
                        ? 'bg-slate-100'
                        : 'hover:bg-slate-50'
                  } ${isSelected ? 'font-semibold text-navy-900' : 'text-slate-700'}`}
                >
                  <span className="truncate">{c.name}</span>
                  <span className="text-xs text-slate-400 shrink-0">{c.state}</span>
                </button>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
