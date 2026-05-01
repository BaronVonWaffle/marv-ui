import { useState, useMemo, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BRAND } from '../utils/colors';

const sans = 'Arial, sans-serif';
const mono = "'JetBrains Mono', monospace";

/**
 * Header-mounted ticker search.
 *
 * Autocomplete source preference (in order):
 *   1. analyst_team.coverage_team[*].coverage flattened
 *   2. data.issuers (full universe — fallback for non-pod-covered names)
 *
 * On submit (or option click) navigates to /issuer/:ticker.
 */
export default function IssuerSearchBox({ data }) {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [activeIdx, setActiveIdx] = useState(0);
  const wrapRef = useRef(null);

  // Build ticker list once. Coverage team takes priority (more relevant),
  // then issuers fills the long tail.
  const tickers = useMemo(() => {
    const set = new Map(); // ticker -> { ticker, label, source }
    const team = data?.analyst_team?.coverage_team || [];
    for (const member of team) {
      const cov = Array.isArray(member?.coverage) ? member.coverage : [];
      for (const t of cov) {
        if (!t) continue;
        const ticker = String(t).toUpperCase();
        if (!set.has(ticker)) {
          set.set(ticker, { ticker, label: ticker, source: 'covered' });
        }
      }
    }
    const issuers = data?.issuers || [];
    for (const r of issuers) {
      if (!r?.ticker) continue;
      const ticker = String(r.ticker).toUpperCase();
      if (!set.has(ticker)) {
        set.set(ticker, { ticker, label: ticker, source: 'universe' });
      }
    }
    return Array.from(set.values());
  }, [data]);

  const matches = useMemo(() => {
    const q = query.trim().toUpperCase();
    if (!q) return [];
    return tickers
      .filter((t) => t.ticker.startsWith(q))
      .slice(0, 8);
  }, [query, tickers]);

  // Close on outside click
  useEffect(() => {
    function handler(e) {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  function go(ticker) {
    if (!ticker) return;
    setQuery('');
    setOpen(false);
    navigate(`/issuer/${ticker}`);
  }

  function onKeyDown(e) {
    if (!open || matches.length === 0) {
      if (e.key === 'Enter' && query.trim()) go(query.trim().toUpperCase());
      return;
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIdx((i) => Math.min(i + 1, matches.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIdx((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      go(matches[activeIdx]?.ticker || query.trim().toUpperCase());
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  }

  return (
    <div ref={wrapRef} style={{ position: 'relative' }}>
      <input
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setActiveIdx(0);
          setOpen(true);
        }}
        onFocus={() => query && setOpen(true)}
        onKeyDown={onKeyDown}
        placeholder="Search ticker…"
        style={{
          background: BRAND.card,
          color: BRAND.text,
          border: `1px solid ${BRAND.border}`,
          borderRadius: 3,
          padding: '3px 8px',
          fontFamily: mono,
          fontSize: 11,
          width: 130,
          outline: 'none',
        }}
        onFocusCapture={(e) => { e.currentTarget.style.borderColor = BRAND.gold; }}
        onBlurCapture={(e) => { e.currentTarget.style.borderColor = BRAND.border; }}
      />
      {open && matches.length > 0 && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            right: 0,
            marginTop: 4,
            background: BRAND.card,
            border: `1px solid ${BRAND.border}`,
            borderRadius: 4,
            boxShadow: '0 6px 16px rgba(0,0,0,0.4)',
            minWidth: 180,
            zIndex: 1100,
            overflow: 'hidden',
          }}
        >
          {matches.map((m, i) => (
            <button
              key={m.ticker}
              onMouseDown={(e) => { e.preventDefault(); go(m.ticker); }}
              onMouseEnter={() => setActiveIdx(i)}
              style={{
                all: 'unset',
                display: 'block',
                width: '100%',
                padding: '6px 10px',
                cursor: 'pointer',
                background: i === activeIdx ? BRAND.cardHover : 'transparent',
                fontFamily: mono,
                fontSize: 11.5,
                color: BRAND.text,
                boxSizing: 'border-box',
              }}
            >
              <span style={{ fontWeight: 700, color: BRAND.text }}>{m.ticker}</span>
              <span
                style={{
                  fontFamily: sans,
                  fontSize: 9,
                  color: m.source === 'covered' ? BRAND.gold : BRAND.muted,
                  marginLeft: 8,
                  textTransform: 'uppercase',
                  letterSpacing: 0.5,
                }}
              >
                {m.source === 'covered' ? 'pod-covered' : 'universe'}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
