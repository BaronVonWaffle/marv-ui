import { useMemo } from 'react';
import { BRAND } from '../utils/colors';
import { isSuppressed, tickerDisplay } from '../utils/tickerDisplay';
import { formatDate } from '../utils/format';

const sans = 'Arial, sans-serif';
const mono = "'JetBrains Mono', monospace";
const INFO = '#3D7A9E';
const MAX_ROWS = 10;

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

const AGM_KEYWORDS = ['annual meeting', 'shareholders', 'stockholders', 'agm'];

function parseTickers(raw) {
  if (Array.isArray(raw)) return raw;
  if (typeof raw !== 'string' || !raw.trim()) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function classify(row) {
  const tickers = parseTickers(row?.presenting_tickers);
  if (tickers.length !== 1) return null;
  const name = String(row?.event_name || '').toLowerCase();
  const type = row?.event_type;

  if (type === 'investor_conference' && name.includes('earnings')) {
    return { kind: 'Earnings', ticker: tickers[0] };
  }
  if (type === 'investor_day') {
    if (AGM_KEYWORDS.some((k) => name.includes(k))) return null;
    return { kind: 'Investor Day', ticker: tickers[0] };
  }
  return null;
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

export default function CatalystWatch({ data, sectorFilter, tickerStatus, onTickerClick }) {
  const events = data?.upcoming_events || [];
  const issuers = data?.issuers || [];

  const issuerByTicker = useMemo(() => {
    const out = {};
    for (const r of issuers) if (r?.ticker) out[r.ticker] = r;
    return out;
  }, [issuers]);

  const today = (data?.snapshot_generated_at || data?.generated_at || '').slice(0, 10)
    || new Date().toISOString().slice(0, 10);

  const rows = useMemo(() => {
    const out = [];
    for (const ev of events) {
      const date = ev?.event_date;
      if (!date || date < today) continue;
      const c = classify(ev);
      if (!c) continue;
      const ticker = c.ticker;
      if (isSuppressed(ticker, tickerStatus)) continue;
      const issuer = issuerByTicker[ticker];
      if (!issuer) continue;
      out.push({
        date,
        ticker,
        kind: c.kind,
        sector: issuer.sector,
        name: ev.event_name,
      });
    }
    out.sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : a.ticker.localeCompare(b.ticker)));
    return out;
  }, [events, issuerByTicker, tickerStatus, today]);

  const filtered = useMemo(() => {
    if (!sectorFilter || sectorFilter === 'all') return rows;
    return rows.filter((r) => (r.sector || '').toLowerCase() === sectorFilter.toLowerCase());
  }, [rows, sectorFilter]);

  const visible = filtered.slice(0, MAX_ROWS);

  return (
    <div style={card}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 8 }}>
        <div style={sectionLabel}>Upcoming Catalysts</div>
        <span style={{ fontFamily: sans, fontSize: 10, color: BRAND.textSecondary }}>
          Next {MAX_ROWS} events · earnings + investor days
        </span>
      </div>

      {visible.length === 0 ? (
        <div
          style={{
            fontFamily: sans,
            fontSize: 11,
            color: BRAND.textSecondary,
            textAlign: 'center',
            padding: '14px 0',
          }}
        >
          No catalysts queued
        </div>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: sans, fontSize: 11 }}>
          <tbody>
            {visible.map((r, i) => (
              <tr
                key={`${r.date}-${r.ticker}-${r.kind}`}
                style={{
                  borderBottom: i < visible.length - 1 ? `1px solid ${BRAND.border}` : 'none',
                  background: i % 2 === 0 ? BRAND.card : BRAND.altRow,
                }}
              >
                <td
                  style={{
                    padding: '5px 8px',
                    fontFamily: mono,
                    fontSize: 10,
                    color: BRAND.textSecondary,
                    minWidth: 56,
                    whiteSpace: 'nowrap',
                  }}
                >
                  {formatDate(r.date)}
                </td>
                <td style={{ padding: '5px 8px', minWidth: 80 }}>
                  <TickerCell
                    ticker={r.ticker}
                    tickerStatus={tickerStatus}
                    today={today}
                    onClick={onTickerClick}
                  />
                </td>
                <td
                  style={{
                    padding: '5px 8px',
                    color: BRAND.text,
                    fontFamily: sans,
                    fontSize: 11,
                  }}
                >
                  {r.kind}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
