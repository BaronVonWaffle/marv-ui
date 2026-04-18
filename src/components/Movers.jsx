import { useMemo, useState } from 'react';
import { BRAND, SCORE_COLORS } from '../utils/colors';
import SectorTag from './SectorTag';
import { isSuppressed, tickerDisplay } from '../utils/tickerDisplay';

const sans = 'Arial, sans-serif';
const mono = "'JetBrains Mono', monospace";
const TOP_N = 10;
const INFO = '#3D7A9E';

const card = {
  background: BRAND.card,
  border: `1px solid ${BRAND.border}`,
  borderRadius: 5,
  padding: '10px 14px',
};
const sectionLabel = {
  fontSize: 10,
  fontWeight: 700,
  fontFamily: sans,
  textTransform: 'uppercase',
  color: BRAND.gold,
  letterSpacing: 1.2,
};
const th = {
  textAlign: 'left',
  padding: '4px 6px',
  fontWeight: 600,
  fontSize: 9,
  color: BRAND.sage,
  textTransform: 'uppercase',
  borderBottom: `1px solid ${BRAND.border}`,
  background: BRAND.navyDark,
  letterSpacing: 0.6,
};
const td = { padding: '4px 6px', verticalAlign: 'middle' };

const pill = (active) => ({
  fontFamily: sans,
  fontSize: 10,
  padding: '2px 8px',
  borderRadius: 10,
  border: `1px solid ${active ? BRAND.sage : BRAND.border}`,
  background: active ? BRAND.sage : 'transparent',
  color: active ? BRAND.navyDark : BRAND.textSecondary,
  cursor: 'pointer',
  fontWeight: 600,
});

function pctCell(val, bold) {
  if (val == null || isNaN(val)) return <span style={{ fontFamily: mono, fontSize: 11, color: BRAND.textSecondary }}>—</span>;
  const n = Number(val);
  const color = n >= 0 ? SCORE_COLORS.green : SCORE_COLORS.red;
  const sign = n > 0 ? '+' : '';
  return (
    <span style={{ fontFamily: mono, fontSize: 11, color, fontWeight: bold ? 700 : 400 }}>
      {sign}{(n * 100).toFixed(1)}%
    </span>
  );
}

function TickerCell({ ticker, tickerStatus, today, onClick }) {
  const disp = tickerDisplay(ticker, tickerStatus, today);
  return (
    <span>
      <span
        onClick={() => onClick?.(ticker)}
        style={{ fontFamily: mono, fontWeight: 500, color: INFO, cursor: 'pointer' }}
        onMouseEnter={(e) => (e.currentTarget.style.textDecoration = 'underline')}
        onMouseLeave={(e) => (e.currentTarget.style.textDecoration = 'none')}
      >
        {disp.primary}
      </span>
      {disp.suffix && (
        <span style={{ fontFamily: sans, fontSize: 9, color: BRAND.textSecondary, marginLeft: 4 }}>
          {disp.suffix}
        </span>
      )}
    </span>
  );
}

function MoversTable({
  title, rows, returnField, tickerStatus, today, onTickerClick, toggle,
}) {
  return (
    <div style={card}>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 6 }}>
        <div style={sectionLabel}>{title}</div>
        {toggle && <div style={{ marginLeft: 'auto' }}>{toggle}</div>}
      </div>
      {rows.length === 0 ? (
        <div style={{ fontSize: 11, color: BRAND.textSecondary, padding: '12px 0', textAlign: 'center', fontFamily: sans }}>
          No data
        </div>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={th}>Ticker</th>
              <th style={th}>Sector</th>
              <th style={{ ...th, textAlign: 'right' }}>Return</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr
                key={r.ticker}
                style={{
                  borderBottom: `1px solid ${BRAND.border}`,
                  background: i % 2 === 0 ? BRAND.card : BRAND.altRow,
                }}
              >
                <td style={td}>
                  <TickerCell ticker={r.ticker} tickerStatus={tickerStatus} today={today} onClick={onTickerClick} />
                </td>
                <td style={td}>{r.sector && <SectorTag sector={r.sector} />}</td>
                <td style={{ ...td, textAlign: 'right' }}>{pctCell(r[returnField], true)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default function Movers({ data, sectorFilter, tickerStatus, onTickerClick }) {
  const [timeframe, setTimeframe] = useState('1d');

  const all = useMemo(() => {
    const rows = data?.equity_daily || [];
    return rows.filter((r) => r?.ticker && !isSuppressed(r.ticker, tickerStatus));
  }, [data, tickerStatus]);

  const scoped = useMemo(() => {
    if (!sectorFilter || sectorFilter === 'all') return all;
    return all.filter((r) => (r.sector || '').toLowerCase() === sectorFilter.toLowerCase());
  }, [all, sectorFilter]);

  const returnField = `return_${timeframe}`;

  const { gainers, losers } = useMemo(() => {
    const withRet = scoped.filter((r) => r[returnField] != null && !isNaN(Number(r[returnField])));
    const sortedDesc = [...withRet].sort((a, b) => Number(b[returnField]) - Number(a[returnField]));
    const gain = sortedDesc.slice(0, TOP_N);
    const lose = sortedDesc.slice(-TOP_N).reverse();
    return { gainers: gain, losers: lose };
  }, [scoped, returnField]);

  const today = data?.snapshot_generated_at?.slice(0, 10)
    || data?.generated_at?.slice(0, 10)
    || null;

  const toggle = (
    <div style={{ display: 'inline-flex', gap: 4 }}>
      {['1d', '5d', '20d'].map((m) => (
        <button key={m} onClick={() => setTimeframe(m)} style={pill(m === timeframe)}>
          {m}
        </button>
      ))}
    </div>
  );

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
      <MoversTable
        title="Top gainers"
        rows={gainers}
        returnField={returnField}
        tickerStatus={tickerStatus}
        today={today}
        onTickerClick={onTickerClick}
        toggle={toggle}
      />
      <MoversTable
        title="Top losers"
        rows={losers}
        returnField={returnField}
        tickerStatus={tickerStatus}
        today={today}
        onTickerClick={onTickerClick}
      />
    </div>
  );
}
