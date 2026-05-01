import { useMemo } from 'react';
import SectorTag from './SectorTag';
import { BRAND, SCORE_COLORS } from '../utils/colors';

const sans = 'Arial, sans-serif';
const mono = "'JetBrains Mono', monospace";

const sectionLabel = {
  fontSize: 10,
  fontWeight: 700,
  fontFamily: sans,
  textTransform: 'uppercase',
  color: BRAND.gold,
  letterSpacing: 1.2,
  marginBottom: 6,
};

const REASON_GLYPH = {
  filing: '▤',
  earnings: '$',
  equity: '↕',
  news: '◆',
  '10-Q': '▤',
  '10-K': '▤',
  '8-K': '▤',
};

const REASON_COLOR = {
  filing: '#5eb4a9',
  earnings: BRAND.gold,
  equity: SCORE_COLORS.yellow,
  news: '#a48dc8',
};

function reasonGlyph(reason) {
  if (!reason) return '·';
  return REASON_GLYPH[reason] || '·';
}
function reasonColor(reason) {
  if (!reason) return BRAND.muted;
  return REASON_COLOR[reason] || BRAND.textSecondary;
}

function shortDetail(detail) {
  if (!detail) return '';
  // Detail is pipe-delimited list of "kind: text"; take first segment.
  const first = detail.split('|')[0]?.trim() || '';
  return first.length > 80 ? first.slice(0, 80).trimEnd() + '…' : first;
}

export default function TriageTop5Panel({ data, onTickerClick }) {
  const rows = useMemo(() => {
    const all = data?.daily_triage_today || [];
    return [...all].sort((a, b) => (a.rank || 99) - (b.rank || 99)).slice(0, 5);
  }, [data]);

  return (
    <div>
      <div style={sectionLabel}>
        Daily Triage — Top 5
        <span style={{ color: BRAND.muted, fontWeight: 500, marginLeft: 8, textTransform: 'none', letterSpacing: 0.5 }}>
          highest signal aggregate
        </span>
      </div>
      <div
        style={{
          background: BRAND.card,
          border: `1px solid ${BRAND.border}`,
          borderRadius: 5,
          overflow: 'hidden',
        }}
      >
        {rows.length === 0 ? (
          <div style={{ padding: 16, fontFamily: sans, fontSize: 11, color: BRAND.muted, fontStyle: 'italic' }}>
            No triage today — pipeline runs at 5:30 AM ET.
          </div>
        ) : (
          rows.map((r, i) => (
            <button
              key={r.ticker}
              onClick={() => onTickerClick?.(r.ticker)}
              style={{
                all: 'unset',
                display: 'grid',
                gridTemplateColumns: '24px 60px 1fr auto',
                gap: 10,
                alignItems: 'center',
                padding: '9px 14px',
                width: '100%',
                boxSizing: 'border-box',
                cursor: 'pointer',
                background: i % 2 === 0 ? BRAND.card : BRAND.altRow,
                borderBottom: i < rows.length - 1 ? `1px solid ${BRAND.border}` : 'none',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = BRAND.cardHover;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = i % 2 === 0 ? BRAND.card : BRAND.altRow;
              }}
            >
              <span
                style={{
                  fontFamily: mono,
                  fontSize: 11,
                  color: BRAND.gold,
                  fontWeight: 700,
                  textAlign: 'center',
                }}
              >
                #{r.rank}
              </span>
              <span
                style={{
                  fontFamily: mono,
                  fontSize: 12,
                  color: BRAND.text,
                  fontWeight: 700,
                  letterSpacing: 0.3,
                }}
              >
                {r.ticker}
              </span>
              <span
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 2,
                  overflow: 'hidden',
                }}
              >
                <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontFamily: mono, fontSize: 11, color: reasonColor(r.primary_reason), width: 12 }}>
                    {reasonGlyph(r.primary_reason)}
                  </span>
                  {r.sector && <SectorTag sector={r.sector} />}
                </span>
                <span
                  style={{
                    fontFamily: sans,
                    fontSize: 10,
                    color: BRAND.textSecondary,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                  title={r.reason_detail}
                >
                  {shortDetail(r.reason_detail)}
                </span>
              </span>
              <span
                style={{
                  fontFamily: mono,
                  fontSize: 11,
                  color: BRAND.gold,
                  fontWeight: 700,
                  textAlign: 'right',
                  minWidth: 38,
                }}
              >
                {r.triage_score?.toFixed?.(0) ?? r.triage_score ?? '—'}
              </span>
            </button>
          ))
        )}
      </div>
    </div>
  );
}
