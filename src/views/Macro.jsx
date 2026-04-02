import { useState, useMemo } from 'react';
import ScoreBadge from '../components/ScoreBadge';
import SectorTag from '../components/SectorTag';
import { BRAND, SCORE_COLORS } from '../utils/colors';
import { colorForDev } from '../utils/format';

const mono = "'JetBrains Mono', monospace";
const sans = 'Arial, sans-serif';

const MAG_STYLE = {
  major: { bg: SCORE_COLORS.red, color: '#fff' },
  moderate: { bg: SCORE_COLORS.yellow, color: '#fff' },
  routine: { bg: '#555', color: '#aaa' },
};

const DIR_ARROW = { up: '▲', down: '▼', flat: '—' };

function changePct(value, prior) {
  if (typeof value !== 'number' || typeof prior !== 'number' || prior === 0) return null;
  return (value - prior) / Math.abs(prior);
}

export default function Macro({ data, sectorFilter, onTickerClick }) {
  const [showAll, setShowAll] = useState(false);
  const [expandedRow, setExpandedRow] = useState(null);

  const { groups, latestDate } = useMemo(() => {
    if (!data?.market_data?.length) return { groups: {}, latestDate: null };
    const dates = data.market_data.map((m) => m.data_date).filter(Boolean);
    const latest = dates.sort().pop();
    const filtered = data.market_data.filter((m) => m.data_date === latest);
    const g = {};
    filtered.forEach((m) => {
      const cat = m.category || 'other';
      if (!g[cat]) g[cat] = [];
      g[cat].push(m);
    });
    return { groups: g, latestDate: latest };
  }, [data]);

  const filteredGroups = useMemo(() => {
    const out = {};
    Object.entries(groups).forEach(([cat, rows]) => {
      const f = showAll ? rows : rows.filter((r) => r.magnitude === 'major' || r.magnitude === 'moderate');
      if (f.length) out[cat] = f;
    });
    return out;
  }, [groups, showAll]);

  function getImpacted(move) {
    const connections = data?.connections || [];
    const summaries = data?.connection_summary || [];
    const name = (move.name || '').toLowerCase();
    const cat = (move.category || '').toLowerCase();

    const matched = connections.filter((c) => {
      const headline = (c.news_headline || '').toLowerCase();
      const connType = (c.connection_type || '').toLowerCase();
      const driver = (c.market_driver || '').toLowerCase();
      return headline.includes(name) || connType.includes(name) || driver.includes(name) || headline.includes(cat) || driver.includes(cat);
    });

    const tickerSet = new Set(matched.map((c) => c.ticker).filter(Boolean));
    summaries.forEach((s) => {
      const drivers = (s.key_drivers || '').toLowerCase();
      if (drivers.includes(name) || drivers.includes(cat)) { if (s.ticker) tickerSet.add(s.ticker); }
    });

    const scoreMap = {};
    (data?.scores || []).forEach((s) => { scoreMap[s.ticker] = s; });
    const summaryMap = {};
    summaries.forEach((s) => { summaryMap[s.ticker] = s; });

    const enriched = [...tickerSet].map((ticker) => {
      const score = scoreMap[ticker] || {};
      const summary = summaryMap[ticker] || {};
      return { ticker, ...score, ...summary };
    });

    let list = enriched;
    if (sectorFilter !== 'all') {
      list = list.filter((r) => r.sector?.toLowerCase() === sectorFilter.toLowerCase());
    }

    const direction = (move.direction || '').toLowerCase();
    const negative = [];
    const positive = [];
    list.forEach((item) => {
      const conn = matched.find((c) => c.ticker === item.ticker);
      const impact = (conn?.impact || conn?.direction || '').toLowerCase();
      if (impact.includes('negative') || impact.includes('headwind') || impact.includes('cost')) negative.push(item);
      else if (impact.includes('positive') || impact.includes('tailwind') || impact.includes('benefit')) positive.push(item);
      else { if (direction === 'up') negative.push(item); else positive.push(item); }
    });

    const scoreOrder = { red: 0, yellow: 1, green: 2 };
    const sortFn = (a, b) => (scoreOrder[a.composite_score] ?? 3) - (scoreOrder[b.composite_score] ?? 3);
    negative.sort(sortFn);
    positive.sort(sortFn);
    return { negative, positive };
  }

  const expanded = expandedRow ? getImpacted(expandedRow) : { negative: [], positive: [] };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <span style={{ fontFamily: sans, fontSize: 10, color: BRAND.muted }}>
          {latestDate ? `Data as of ${latestDate}` : ''}
        </span>
        <label style={{ fontFamily: sans, fontSize: 11, color: BRAND.muted, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
          <input type="checkbox" checked={showAll} onChange={(e) => setShowAll(e.target.checked)} />
          Show all
        </label>
      </div>

      {Object.keys(filteredGroups).length === 0 && (
        <div style={{ color: BRAND.muted, fontSize: 12, padding: 20, textAlign: 'center' }}>No market moves to display</div>
      )}

      {Object.entries(filteredGroups).map(([category, moves]) => (
        <div key={category} style={{ marginBottom: 14 }}>
          <div style={{ fontFamily: sans, fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1.2, color: BRAND.gold, padding: '6px 0 4px', borderBottom: `1px solid ${BRAND.border}` }}>
            {category.replace(/_/g, ' ')}
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: sans, fontSize: 11 }}>
            <thead>
              <tr>
                {['Name', 'Value', 'Prior', 'Change%', 'Direction', 'Magnitude'].map((h) => (
                  <th key={h} style={{ textAlign: h === 'Name' ? 'left' : 'right', padding: '4px 6px', fontSize: 9, fontWeight: 600, color: BRAND.sage, textTransform: 'uppercase', borderBottom: `1px solid ${BRAND.border}`, background: BRAND.navyDark }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {moves.map((move, i) => {
                const pct = changePct(move.value, move.prior_value);
                const isExpanded = expandedRow?.name === move.name && expandedRow?.category === move.category;
                return (
                  <ImpactableRow key={`${move.name}-${i}`} move={move} pct={pct} isExpanded={isExpanded} onToggle={() => setExpandedRow(isExpanded ? null : move)} impacted={isExpanded ? expanded : null} onTickerClick={onTickerClick} rowIndex={i} />
                );
              })}
            </tbody>
          </table>
        </div>
      ))}
    </div>
  );
}

function ImpactableRow({ move, pct, isExpanded, onToggle, impacted, onTickerClick, rowIndex }) {
  const dir = (move.direction || 'flat').toLowerCase();
  const mag = (move.magnitude || 'routine').toLowerCase();
  const magStyle = MAG_STYLE[mag] || MAG_STYLE.routine;
  const pctColor = dir === 'up' ? SCORE_COLORS.green : dir === 'down' ? SCORE_COLORS.red : BRAND.muted;

  return (
    <>
      <tr
        onClick={onToggle}
        style={{ background: rowIndex % 2 === 0 ? BRAND.card : BRAND.altRow, cursor: 'pointer' }}
        onMouseEnter={(e) => (e.currentTarget.style.background = BRAND.hover)}
        onMouseLeave={(e) => (e.currentTarget.style.background = rowIndex % 2 === 0 ? BRAND.card : BRAND.altRow)}
      >
        <td style={{ padding: '5px 6px', fontWeight: 600, color: BRAND.text, borderBottom: `1px solid ${BRAND.border}` }}>
          {isExpanded ? '▾ ' : '▸ '}{move.name}
        </td>
        <td style={{ fontFamily: mono, textAlign: 'right', padding: '5px 6px', borderBottom: `1px solid ${BRAND.border}`, color: BRAND.text }}>
          {typeof move.value === 'number' ? move.value.toFixed(2) : move.value ?? '—'}
        </td>
        <td style={{ fontFamily: mono, textAlign: 'right', padding: '5px 6px', color: BRAND.textSecondary, borderBottom: `1px solid ${BRAND.border}` }}>
          {typeof move.prior_value === 'number' ? move.prior_value.toFixed(2) : move.prior_value ?? '—'}
        </td>
        <td style={{ fontFamily: mono, textAlign: 'right', padding: '5px 6px', color: pctColor, fontWeight: 600, borderBottom: `1px solid ${BRAND.border}` }}>
          {pct !== null ? `${pct >= 0 ? '+' : ''}${(pct * 100).toFixed(1)}%` : '—'}
        </td>
        <td style={{ textAlign: 'right', padding: '5px 6px', fontSize: 13, color: pctColor, borderBottom: `1px solid ${BRAND.border}` }}>
          {DIR_ARROW[dir] || '—'}
        </td>
        <td style={{ textAlign: 'right', padding: '5px 6px', borderBottom: `1px solid ${BRAND.border}` }}>
          <span style={{ display: 'inline-block', background: magStyle.bg, color: magStyle.color, fontSize: 9, fontWeight: 700, textTransform: 'uppercase', borderRadius: 3, padding: '1px 6px' }}>
            {mag}
          </span>
        </td>
      </tr>
      {isExpanded && impacted && (
        <tr>
          <td colSpan={6} style={{ background: BRAND.navyDark, padding: '10px 14px', borderBottom: `1px solid ${BRAND.border}` }}>
            {impacted.negative.length === 0 && impacted.positive.length === 0 ? (
              <div style={{ fontSize: 11, color: BRAND.muted, fontStyle: 'italic', textAlign: 'center', padding: 8 }}>No direct credit connections mapped</div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <ImpactColumn title="Negative Impact" titleColor={SCORE_COLORS.red} items={impacted.negative} onTickerClick={onTickerClick} />
                <ImpactColumn title="Positive Impact" titleColor={SCORE_COLORS.green} items={impacted.positive} onTickerClick={onTickerClick} />
              </div>
            )}
          </td>
        </tr>
      )}
    </>
  );
}

function ImpactColumn({ title, titleColor, items, onTickerClick }) {
  const mono = "'JetBrains Mono', monospace";
  return (
    <div>
      <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: titleColor, letterSpacing: 0.6, marginBottom: 6, fontFamily: 'Arial, sans-serif' }}>
        {title}
      </div>
      {items.length === 0 && <div style={{ fontSize: 10, color: BRAND.muted }}>None</div>}
      {items.map((item, i) => (
        <div key={item.ticker || i} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '3px 0', borderBottom: i < items.length - 1 ? `1px solid ${BRAND.border}` : 'none', flexWrap: 'wrap' }}>
          <span onClick={(e) => { e.stopPropagation(); onTickerClick?.(item.ticker); }} style={{ fontFamily: mono, fontWeight: 700, fontSize: 11, color: BRAND.white, cursor: 'pointer' }} onMouseEnter={(e) => { e.target.style.color = BRAND.sage; e.target.style.textDecoration = 'underline'; }} onMouseLeave={(e) => { e.target.style.color = BRAND.white; e.target.style.textDecoration = 'none'; }}>
            {item.ticker}
          </span>
          {item.sector && <SectorTag sector={item.sector} />}
          <ScoreBadge score={item.composite_score || 'no_data'} size="sm" />
          {typeof item.debt_to_ev_value === 'number' && (
            <span style={{ fontFamily: mono, fontSize: 10, color: colorForDev(item.debt_to_ev_value) }}>{item.debt_to_ev_value.toFixed(2)}</span>
          )}
          {item.equity_convergence && (
            <span style={{ fontSize: 9, color: item.equity_convergence.toLowerCase().includes('convergent') ? SCORE_COLORS.red : BRAND.muted, fontWeight: 600 }}>
              {item.equity_convergence}
            </span>
          )}
        </div>
      ))}
    </div>
  );
}
