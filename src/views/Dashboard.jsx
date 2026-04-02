import { useMemo } from 'react';
import StatCard from '../components/StatCard';
import SectorTag from '../components/SectorTag';
import SeverityDot from '../components/SeverityDot';
import { BRAND, SCORE_COLORS } from '../utils/colors';
import { formatDate, formatDateWithYear } from '../utils/format';

const mono = "'JetBrains Mono', monospace";
const sans = 'Arial, sans-serif';

const sectionLabel = {
  fontSize: 10,
  fontWeight: 700,
  fontFamily: sans,
  textTransform: 'uppercase',
  color: BRAND.gold,
  letterSpacing: 1.2,
  marginBottom: 6,
};

const card = {
  background: BRAND.card,
  border: `1px solid ${BRAND.border}`,
  borderRadius: 5,
  padding: '10px 14px',
};

function pctCell(val, bold) {
  const n = typeof val === 'number' ? val : parseFloat(val);
  const color = n >= 0 ? SCORE_COLORS.green : SCORE_COLORS.red;
  const sign = n > 0 ? '+' : '';
  return (
    <td
      style={{
        fontFamily: mono,
        fontSize: 11,
        color,
        fontWeight: bold ? 700 : 400,
        textAlign: 'right',
        padding: '4px 6px',
      }}
    >
      {sign}{(n * 100).toFixed(1)}%
    </td>
  );
}

export default function Dashboard({ data, sectorFilter, onTickerClick }) {
  const filtered = useMemo(() => {
    if (!data?.scores) return [];
    if (sectorFilter === 'all') return data.scores;
    return data.scores.filter(
      (s) => s.sector?.toLowerCase() === sectorFilter.toLowerCase()
    );
  }, [data, sectorFilter]);

  const redCount = filtered.filter((s) => s.composite_score === 'red').length;
  const yellowCount = filtered.filter((s) => s.composite_score === 'yellow').length;
  const greenCount = filtered.filter((s) => s.composite_score === 'green').length;

  const convergentCount = useMemo(() => {
    if (!data?.connection_summary) return 0;
    return data.connection_summary.filter((c) =>
      c.equity_convergence?.toLowerCase().includes('convergent')
    ).length;
  }, [data]);

  const equityFlagCount = useMemo(() => {
    if (!data?.equity_movers) return 0;
    const all = [
      ...(data.equity_movers.top_gainers || []),
      ...(data.equity_movers.top_losers || []),
    ];
    return all.length;
  }, [data]);

  const catalystCount = data?.catalysts?.length || 0;

  const calendar = useMemo(() => {
    if (!data?.economic_calendar?.length) return [];
    const today = new Date().toISOString().split('T')[0];
    const sorted = [...data.economic_calendar].sort((a, b) => (a.event_date > b.event_date ? 1 : -1));
    const future = sorted.filter((e) => e.event_date >= today);
    if (future.length >= 5) return future.slice(0, 5);
    const past = sorted.filter((e) => e.event_date < today).reverse();
    return [...future, ...past].slice(0, 5);
  }, [data]);

  const catalysts = useMemo(() => {
    if (!data?.catalysts?.length) return [];
    const today = new Date().toISOString().split('T')[0];
    const sorted = [...data.catalysts].sort((a, b) => (a.catalyst_date > b.catalyst_date ? 1 : -1));
    const future = sorted.filter((c) => c.catalyst_date >= today);
    if (future.length >= 5) return future.slice(0, 5);
    const past = sorted.filter((c) => c.catalyst_date < today).reverse();
    return [...future, ...past].slice(0, 5);
  }, [data]);

  const briefs = useMemo(() => {
    if (!data?.morning_briefs) return [];
    if (sectorFilter === 'all') return data.morning_briefs;
    return data.morning_briefs.filter(
      (b) => b.sector?.toLowerCase() === sectorFilter.toLowerCase()
    );
  }, [data, sectorFilter]);

  const gainers = data?.equity_movers?.top_gainers || [];
  const losers = data?.equity_movers?.top_losers || [];
  const moversDate = data?.equity_movers?.calc_date || (gainers[0]?.calc_date) || null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* SECTION 1: Stat Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))',
          gap: 8,
        }}
      >
        <StatCard label="Red" value={redCount} color={SCORE_COLORS.red} tooltip="Issuers with elevated credit risk — red composite score on quantitative or qualitative axis" />
        <StatCard label="Yellow" value={yellowCount} color={SCORE_COLORS.yellow} tooltip="Issuers with moderate credit concerns — yellow composite score, monitor for deterioration" />
        <StatCard label="Green" value={greenCount} color={SCORE_COLORS.green} tooltip="Issuers with stable credit profiles — green composite score on both axes" />
        <StatCard label="Convergent" value={convergentCount} color={SCORE_COLORS.red} subtitle="macro+equity" tooltip="Macro-to-credit connections where equity price action confirms the fundamental signal" />
        <StatCard label="Equity Flags" value={equityFlagCount} color="#e67e22" subtitle="7 days" tooltip="Peer-relative equity moves exceeding ±1.5σ z-score thresholds in the last 7 days" />
        <StatCard label="Catalysts" value={catalystCount} color="#7c4dff" tooltip="Upcoming events with potential credit impact — earnings, maturities, covenant tests" />
      </div>

      {/* SECTION 2: Equity Movers */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <MoversTable title="Top Gainers (1d)" rows={gainers} onTickerClick={onTickerClick} calcDate={moversDate} />
        <MoversTable title="Top Losers (1d)" rows={losers} onTickerClick={onTickerClick} calcDate={moversDate} />
      </div>

      {/* SECTION 3: Macro Calendar + Catalysts */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <div style={card}>
          <div style={sectionLabel}>Macro Calendar</div>
          {calendar.map((evt, i) => (
            <div
              key={i}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '4px 0',
                borderBottom: i < calendar.length - 1 ? `1px solid ${BRAND.border}` : 'none',
              }}
            >
              <span style={{ fontFamily: mono, fontSize: 10, color: BRAND.muted, minWidth: 44 }}>
                {formatDate(evt.event_date)}
              </span>
              <SeverityDot
                severity={
                  evt.impact_level === 'high' || evt.impact_level === 'High' ? 'high'
                    : evt.impact_level === 'medium' || evt.impact_level === 'Medium' ? 'medium'
                    : 'low'
                }
              />
              <span style={{ fontFamily: sans, fontSize: 11, color: BRAND.text }}>
                {evt.event_name}
              </span>
            </div>
          ))}
          {calendar.length === 0 && (
            <div style={{ fontSize: 11, color: BRAND.muted }}>No events</div>
          )}
        </div>

        <div style={card}>
          <div style={sectionLabel}>Upcoming Catalysts</div>
          {catalysts.map((cat, i) => (
            <div
              key={i}
              style={{
                padding: '5px 0',
                borderBottom: i < catalysts.length - 1 ? `1px solid ${BRAND.border}` : 'none',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontFamily: mono, fontSize: 10, color: BRAND.muted, minWidth: 44 }}>
                  {formatDate(cat.catalyst_date)}
                </span>
                <SeverityDot severity={cat.urgency || 'low'} />
                <span
                  onClick={() => onTickerClick?.(cat.ticker)}
                  style={{ fontFamily: mono, fontWeight: 700, fontSize: 11, color: BRAND.white, cursor: 'pointer' }}
                  onMouseEnter={(e) => { e.target.style.color = BRAND.sage; e.target.style.textDecoration = 'underline'; }}
                  onMouseLeave={(e) => { e.target.style.color = BRAND.white; e.target.style.textDecoration = 'none'; }}
                >
                  {cat.ticker}
                </span>
                {cat.sector && <SectorTag sector={cat.sector} />}
              </div>
              {cat.description && (
                <div style={{ fontFamily: sans, fontSize: 10, color: BRAND.textSecondary, marginTop: 2, marginLeft: 50 }}>
                  {cat.description}
                </div>
              )}
            </div>
          ))}
          {catalysts.length === 0 && (
            <div style={{ fontSize: 11, color: BRAND.muted }}>No catalysts</div>
          )}
        </div>
      </div>

      {/* SECTION 4: Morning Briefs */}
      {briefs.map((brief, i) => (
        <div key={i} style={card}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {brief.sector && <SectorTag sector={brief.sector} />}
              <span style={{ fontFamily: sans, fontSize: 11, fontWeight: 600, color: BRAND.text }}>
                Morning Brief — {formatDateWithYear(brief.brief_date)}
              </span>
              {brief.quiet_day && (
                <span style={{ fontFamily: sans, fontSize: 9, color: BRAND.muted, background: BRAND.altRow, borderRadius: 3, padding: '1px 6px' }}>
                  (Quiet day)
                </span>
              )}
            </div>
            <span style={{ fontFamily: mono, fontSize: 10, color: BRAND.muted }}>
              {brief.connection_count ?? 0}C · {brief.flag_count ?? 0}F
            </span>
          </div>
          <pre
            style={{
              fontFamily: sans,
              fontSize: 12,
              lineHeight: 1.6,
              color: BRAND.text,
              whiteSpace: 'pre-wrap',
              margin: 0,
              background: BRAND.navyDark,
              padding: '8px 10px',
              borderRadius: 4,
            }}
          >
            {brief.brief_text}
          </pre>
        </div>
      ))}
    </div>
  );
}

function MoversTable({ title, rows, onTickerClick, calcDate }) {
  return (
    <div style={card}>
      <div style={sectionLabel}>{title}</div>
      {calcDate && (
        <div style={{ fontSize: 9, color: BRAND.muted, fontFamily: 'Arial, sans-serif', marginTop: -4, marginBottom: 4 }}>
          as of {formatDate(calcDate)}
        </div>
      )}
      <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: sans, fontSize: 11 }}>
        <thead>
          <tr>
            {['Ticker', 'Sect', '1d%', '5d%', '20d%'].map((h) => (
              <th
                key={h}
                style={{
                  textAlign: h === 'Ticker' || h === 'Sect' ? 'left' : 'right',
                  padding: '3px 6px',
                  fontWeight: 600,
                  fontSize: 9,
                  color: BRAND.sage,
                  textTransform: 'uppercase',
                  borderBottom: `1px solid ${BRAND.border}`,
                  background: BRAND.navyDark,
                }}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr
              key={i}
              style={{ borderBottom: `1px solid ${BRAND.border}`, background: i % 2 === 0 ? BRAND.card : BRAND.altRow }}
              onMouseEnter={(e) => (e.currentTarget.style.background = BRAND.hover)}
              onMouseLeave={(e) => (e.currentTarget.style.background = i % 2 === 0 ? BRAND.card : BRAND.altRow)}
            >
              <td
                style={{ padding: '4px 6px', fontFamily: mono, fontWeight: 700, color: BRAND.white, cursor: 'pointer' }}
                onMouseEnter={(e) => { e.target.style.color = BRAND.sage; e.target.style.textDecoration = 'underline'; }}
                onMouseLeave={(e) => { e.target.style.color = BRAND.white; e.target.style.textDecoration = 'none'; }}
                onClick={() => onTickerClick?.(row.ticker)}
              >
                {row.ticker}
              </td>
              <td style={{ padding: '4px 6px' }}>
                {row.sector && <SectorTag sector={row.sector} />}
              </td>
              {pctCell(row.return_1d, true)}
              {pctCell(row.return_5d, false)}
              {pctCell(row.return_20d, false)}
            </tr>
          ))}
          {rows.length === 0 && (
            <tr><td colSpan={5} style={{ padding: 8, color: BRAND.muted, fontSize: 11 }}>No data</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
