import { useState, useMemo } from 'react';
import ScoreBadge from '../components/ScoreBadge';
import SectorTag from '../components/SectorTag';
import { BRAND } from '../utils/colors';
import { formatScore, colorForDev, colorForFund, colorForMaturity } from '../utils/format';

const mono = "'JetBrains Mono', monospace";
const sans = 'Arial, sans-serif';

const SCORE_ORDER = { red: 0, yellow: 1, green: 2, no_data: -1 };

const COLUMNS = [
  { key: 'ticker',    label: 'Ticker',  type: 'text' },
  { key: 'sector',    label: 'Sector',  type: 'text' },
  { key: 'composite_score', label: 'Comp', type: 'score' },
  { key: 'quant_score',       label: 'Qnt',  type: 'score' },
  { key: 'qual_score',        label: 'Qal',  type: 'score' },
  { key: 'debt_to_ev_value',  label: 'D/EV',    type: 'num' },
  { key: 'fundamental_score', label: 'Fund',    type: 'num' },
  { key: 'nearest_maturity_year', label: 'Mat', type: 'num' },
  { key: 'coverage_tier',     label: 'Tier',    type: 'text' },
  { key: 'liquidity_score',   label: 'Liq',     type: 'score' },
  { key: 'risk_score',        label: 'Risk',    type: 'score' },
  { key: 'tone_score',        label: 'Tone',    type: 'score' },
  { key: 'allocation_score',  label: 'Alloc',   type: 'score' },
  { key: 'flag_summary', label: 'Flags', type: 'text' },
];

function sortVal(row, key, type) {
  const v = row[key];
  if (type === 'score') return SCORE_ORDER[v] ?? -1;
  if (type === 'num') return typeof v === 'number' ? v : -Infinity;
  return (v || '').toString().toLowerCase();
}

const V2_NA_BADGE_STYLE = {
  display: 'inline-block',
  background: BRAND.navyDark,
  color: BRAND.textSecondary,
  fontFamily: sans,
  fontSize: 11,
  padding: '2px 6px',
  borderRadius: 4,
  marginLeft: 6,
  textDecoration: 'none',
  cursor: 'help',
  whiteSpace: 'nowrap',
};

export default function Universe({ data, sectorFilter, onTickerClick }) {
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState('ticker');
  const [sortAsc, setSortAsc] = useState(true);

  const v2MissingTickers = useMemo(() => {
    const v1 = data?.scores || [];
    const v2 = data?.fundamental_scores_v2 || [];
    const v2Set = new Set();
    for (const r of v2) if (r?.ticker) v2Set.add(r.ticker);
    const missing = new Set();
    for (const r of v1) if (r?.ticker && !v2Set.has(r.ticker)) missing.add(r.ticker);
    return missing;
  }, [data]);

  const rows = useMemo(() => {
    if (!data?.scores) return [];
    let list = data.scores;
    if (sectorFilter !== 'all') {
      list = list.filter((s) => s.sector?.toLowerCase() === sectorFilter.toLowerCase());
    }
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((s) => s.ticker?.toLowerCase().includes(q) || s.peer_group?.toLowerCase().includes(q));
    }
    const col = COLUMNS.find((c) => c.key === sortKey);
    const type = col?.type || 'text';
    const sorted = [...list].sort((a, b) => {
      const av = sortVal(a, sortKey, type);
      const bv = sortVal(b, sortKey, type);
      if (av < bv) return sortAsc ? -1 : 1;
      if (av > bv) return sortAsc ? 1 : -1;
      return 0;
    });
    return sorted;
  }, [data, sectorFilter, search, sortKey, sortAsc]);

  function handleSort(key) {
    if (sortKey === key) setSortAsc(!sortAsc);
    else { setSortKey(key); setSortAsc(true); }
  }

  function renderCell(row, col) {
    const v = row[col.key];
    switch (col.key) {
      case 'ticker':
        return <span style={{ fontFamily: mono, fontWeight: 700, color: BRAND.white }} onMouseEnter={(e) => { e.target.style.color = BRAND.sage; e.target.style.textDecoration = 'underline'; }} onMouseLeave={(e) => { e.target.style.color = BRAND.white; e.target.style.textDecoration = 'none'; }}>{v}</span>;
      case 'sector':
        return v ? <SectorTag sector={v} /> : null;
      case 'debt_to_ev_value':
        return <span style={{ fontFamily: mono, fontSize: 11, color: colorForDev(v) }}>{typeof v === 'number' ? v.toFixed(2) : '—'}</span>;
      case 'fundamental_score':
        return <span style={{ fontFamily: mono, fontSize: 11, color: colorForFund(v) }}>{typeof v === 'number' ? formatScore(v) : '—'}</span>;
      case 'nearest_maturity_year': {
        const year = typeof v === 'number' ? v : parseInt(v);
        return <span style={{ fontFamily: mono, fontSize: 11, color: isNaN(year) ? BRAND.muted : colorForMaturity(year) }}>{isNaN(year) ? '—' : year}</span>;
      }
      case 'coverage_tier':
        return <span style={{ color: BRAND.textSecondary, fontSize: 11 }}>{v || '—'}</span>;
      case 'flag_summary':
        return (
          <span title={v || ''} style={{ fontSize: 10, color: BRAND.textSecondary, maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'inline-block' }}>
            {v || '—'}
          </span>
        );
      case 'composite_score': {
        const missing = v2MissingTickers.has(row.ticker);
        return (
          <span style={{ display: 'inline-flex', alignItems: 'center' }}>
            <ScoreBadge score={v || 'no_data'} size="sm" />
            {missing && (
              <a
                href="#v2-coverage"
                title="FMP-safe factor coverage incomplete. See Methodology."
                onClick={(e) => e.stopPropagation()}
                style={V2_NA_BADGE_STYLE}
              >
                V2 N/A
              </a>
            )}
          </span>
        );
      }
      default:
        if (col.type === 'score') return <ScoreBadge score={v || 'no_data'} size="sm" />;
        return v ?? '—';
    }
  }

  return (
    <div>
      <input
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search ticker or peer group..."
        style={{
          width: '100%',
          boxSizing: 'border-box',
          padding: '7px 10px',
          fontFamily: sans,
          fontSize: 12,
          border: `1px solid ${BRAND.border}`,
          borderRadius: 4,
          marginBottom: 10,
          outline: 'none',
          background: BRAND.card,
          color: BRAND.text,
        }}
      />

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: sans, fontSize: 11 }}>
          <thead>
            <tr>
              {COLUMNS.map((col) => (
                <th
                  key={col.key}
                  onClick={() => handleSort(col.key)}
                  style={{
                    background: BRAND.navyDark,
                    color: BRAND.sage,
                    fontSize: 9,
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: 0.6,
                    padding: '5px 6px',
                    textAlign: 'left',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    userSelect: 'none',
                  }}
                >
                  {col.label}
                  {sortKey === col.key && <span style={{ marginLeft: 3, fontSize: 8 }}>{sortAsc ? '▲' : '▼'}</span>}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr
                key={row.ticker || i}
                onClick={() => onTickerClick?.(row.ticker)}
                style={{ background: i % 2 === 0 ? BRAND.card : BRAND.altRow, cursor: 'pointer' }}
                onMouseEnter={(e) => (e.currentTarget.style.background = BRAND.hover)}
                onMouseLeave={(e) => (e.currentTarget.style.background = i % 2 === 0 ? BRAND.card : BRAND.altRow)}
              >
                {COLUMNS.map((col) => (
                  <td key={col.key} style={{ padding: '4px 6px', borderBottom: `1px solid ${BRAND.border}`, whiteSpace: 'nowrap' }}>
                    {renderCell(row, col)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{ fontSize: 10, color: BRAND.muted, fontFamily: sans, padding: '6px 0', textAlign: 'right' }}>
        {rows.length} names shown
      </div>
    </div>
  );
}
