import { useMemo, useState } from 'react';
import { BRAND, SCORE_COLORS } from '../utils/colors';
import ScoreBadge from './ScoreBadge';
import SectorTag from './SectorTag';
import {
  detectSpreadSchema,
  evaluateTriggers,
  sortNotables,
  triggerLabel,
} from '../utils/triggers';
import { isSuppressed, tickerDisplay } from '../utils/tickerDisplay';

const sans = 'Arial, sans-serif';
const mono = "'JetBrains Mono', monospace";
const MAX_ROWS = 12;
const AMBER = '#c9a633';
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
const th = (leftAlign) => ({
  textAlign: leftAlign ? 'left' : 'left',
  padding: '4px 8px',
  fontWeight: 600,
  fontSize: 9,
  color: BRAND.sage,
  textTransform: 'uppercase',
  borderBottom: `1px solid ${BRAND.border}`,
  background: BRAND.navyDark,
  letterSpacing: 0.6,
});
const td = { padding: '5px 8px', verticalAlign: 'middle' };

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

function TrajectoryCell({ value }) {
  let color = BRAND.textSecondary;
  if (value === 'Strengthening') color = SCORE_COLORS.green;
  else if (value === 'Weakening') color = SCORE_COLORS.red;
  return <span style={{ fontFamily: sans, fontSize: 11, color }}>{value}</span>;
}

function SpreadCell({ schemaMode, spreadZ }) {
  if (schemaMode === 'disabled' || spreadZ == null) {
    return <span style={{ fontFamily: mono, fontSize: 11, color: BRAND.textSecondary }}>—</span>;
  }
  const threshold = Math.abs(spreadZ) >= 1.5;
  const color = threshold ? (spreadZ > 0 ? SCORE_COLORS.red : SCORE_COLORS.green) : BRAND.text;
  const sign = spreadZ > 0 ? '+' : '';
  return (
    <span style={{ fontFamily: mono, fontSize: 11, color }}>
      {schemaMode === 'timeseries' && (
        <span style={{ color: AMBER, marginRight: 3 }}>●</span>
      )}
      {sign}{spreadZ.toFixed(1)}
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

export default function Notables({
  data,
  fundamentalByTicker,
  historyByTicker,
  equityByTicker,
  tickerStatus,
  sectorFilter,
  onTickerClick,
}) {
  const [compareMode, setCompareMode] = useState('1d');

  const schema = useMemo(() => detectSpreadSchema(data?.spread_data), [data]);

  const tickers = useMemo(() => {
    return Object.keys(fundamentalByTicker || {}).filter((t) => !isSuppressed(t, tickerStatus));
  }, [fundamentalByTicker, tickerStatus]);

  const allNotables = useMemo(() => {
    const rows = evaluateTriggers({
      tickers,
      fundamentalByTicker,
      historyByTicker,
      equityByTicker,
      spreadByTicker: schema.indexedData,
      schemaMode: schema.mode,
      schemaField: schema.field,
      compareMode,
    });
    return sortNotables(rows);
  }, [tickers, fundamentalByTicker, historyByTicker, equityByTicker, schema, compareMode]);

  const filtered = useMemo(() => {
    if (!sectorFilter || sectorFilter === 'all') return allNotables;
    return allNotables.filter((r) => (r.sector || '').toLowerCase() === sectorFilter.toLowerCase());
  }, [allNotables, sectorFilter]);

  const visible = filtered.slice(0, MAX_ROWS);
  const overflow = filtered.length - visible.length;
  const total = filtered.length;

  const today = data?.snapshot_generated_at?.slice(0, 10)
    || data?.generated_at?.slice(0, 10)
    || null;

  const schemaIndicator = (() => {
    if (schema.mode === 'peer') return null;
    if (schema.mode === 'timeseries') {
      return {
        text: 'Spread: time-series',
        tooltip: 'Peer-relative spread z-score unavailable. Using time-series z-score until C-A.3 sector spread metrics are wired.',
      };
    }
    return {
      text: 'Spread: off',
      tooltip: 'Spread z-score unavailable. Notables using TIER_FLIP + DIVERGENCE only. Will activate after C-A.3.',
    };
  })();

  return (
    <div style={card}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
        <div style={sectionLabel}>Notables</div>
        <span style={{ fontFamily: sans, fontSize: 10, color: BRAND.muted }}>
          {total} notable{total === 1 ? '' : 's'} today
        </span>
        {schemaIndicator && (
          <span
            title={schemaIndicator.tooltip}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              fontFamily: sans,
              fontSize: 10,
              color: AMBER,
              cursor: 'help',
            }}
          >
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: AMBER, display: 'inline-block' }} />
            {schemaIndicator.text}
          </span>
        )}
        <div style={{ marginLeft: 'auto', display: 'inline-flex', gap: 4 }}>
          {['1d', '5d'].map((m) => (
            <button key={m} onClick={() => setCompareMode(m)} style={pill(m === compareMode)}>
              {m}
            </button>
          ))}
        </div>
      </div>

      {total === 0 ? (
        <div
          style={{
            textAlign: 'center',
            fontFamily: sans,
            fontSize: 11,
            color: BRAND.textSecondary,
            padding: '16px 0',
          }}
        >
          No notables today
        </div>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={th(true)}>Ticker</th>
              <th style={th(true)}>Sector</th>
              <th style={th(true)}>Fund</th>
              <th style={th(true)}>Equity</th>
              <th style={th(true)}>Spread z</th>
              <th style={th(true)}>Trigger</th>
            </tr>
          </thead>
          <tbody>
            {visible.map((r, i) => (
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
                <td style={td}>
                  <ScoreBadge score={r.currentLabel} />
                </td>
                <td style={td}>
                  <TrajectoryCell value={r.trajectory} />
                </td>
                <td style={td}>
                  <SpreadCell schemaMode={schema.mode} spreadZ={r.spreadZ} />
                </td>
                <td
                  style={{
                    ...td,
                    fontFamily: sans,
                    fontSize: 10,
                    color: BRAND.textSecondary,
                  }}
                >
                  {triggerLabel(r)}
                </td>
              </tr>
            ))}
            {overflow > 0 && (
              <tr>
                <td
                  colSpan={6}
                  style={{
                    padding: '6px 8px',
                    fontFamily: sans,
                    fontSize: 10,
                    color: BRAND.textSecondary,
                    fontStyle: 'italic',
                    textAlign: 'center',
                  }}
                >
                  +{overflow} more in Universe
                </td>
              </tr>
            )}
          </tbody>
        </table>
      )}
    </div>
  );
}
