import { useMemo } from 'react';
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

// Same position-detection logic as CrossCurrents.jsx — kept inline so this
// component stays self-contained and small.
function detectPosition(contentMd) {
  if (!contentMd) return 'unknown';
  const head = contentMd.slice(0, 300).toLowerCase();
  const dissentIdx = head.search(/\bdissents?\b/);
  const concurIdx = head.search(/\bconcurs?\b/);
  const watchingIdx = head.search(/\bwatching\b/);
  const candidates = [
    dissentIdx >= 0 ? { idx: dissentIdx, pos: 'dissent' } : null,
    concurIdx >= 0 ? { idx: concurIdx, pos: 'concur' } : null,
    watchingIdx >= 0 ? { idx: watchingIdx, pos: 'watching' } : null,
  ].filter(Boolean).sort((a, b) => a.idx - b.idx);
  return candidates[0]?.pos || 'unknown';
}

function extractPunch(contentMd, maxLen = 130) {
  if (!contentMd) return '';
  let text = contentMd.replace(/\n+—\s*[A-Z]\.[A-Z]\.\s*$/m, '').trim();
  const firstPara = text.split(/\n\n+/)[0].trim();
  if (firstPara.length <= maxLen) return firstPara;
  const cut = firstPara.slice(0, maxLen);
  const lastPeriod = cut.lastIndexOf('. ');
  if (lastPeriod > maxLen * 0.6) return cut.slice(0, lastPeriod + 1);
  return cut.trimEnd() + '…';
}

function DissentRow({ stance, onTickerClick }) {
  return (
    <button
      onClick={() => onTickerClick?.(stance.ticker)}
      style={{
        all: 'unset',
        display: 'flex',
        flexDirection: 'column',
        gap: 3,
        background: BRAND.altRow,
        borderLeft: `3px solid ${BRAND.gold}`,
        borderRadius: 3,
        padding: '8px 11px',
        cursor: 'pointer',
        width: '100%',
        boxSizing: 'border-box',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = BRAND.cardHover;
        e.currentTarget.style.borderLeftColor = SCORE_COLORS.yellow;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = BRAND.altRow;
        e.currentTarget.style.borderLeftColor = BRAND.gold;
      }}
    >
      <span style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
        <span style={{ fontFamily: mono, fontSize: 11, fontWeight: 700, color: BRAND.gold, letterSpacing: 0.3 }}>
          ◆ {stance.ticker}
        </span>
        <span style={{ fontFamily: mono, fontSize: 9, color: BRAND.muted, textTransform: 'uppercase', letterSpacing: 0.5 }}>
          {stance.analyst}
        </span>
      </span>
      <span style={{ fontFamily: sans, fontSize: 10.5, color: BRAND.textSecondary, lineHeight: 1.45 }}>
        {stance.punch}
      </span>
    </button>
  );
}

export default function CrossCurrentsMini({ data, onTickerClick, onSeeAll, maxDissents = 3 }) {
  const at = data?.analyst_team;

  const stances = useMemo(() => {
    const out = [];
    const issuerDetail = at?.issuer_detail || {};
    for (const [ticker, sections] of Object.entries(issuerDetail)) {
      const vs = sections?.vs_house_view;
      if (!vs) continue;
      const pos = detectPosition(vs.content_md);
      if (pos !== 'dissent') continue;
      out.push({
        ticker,
        analyst: vs.last_updated_by,
        punch: extractPunch(vs.content_md),
      });
    }
    return out;
  }, [at]);

  const totalDissents = stances.length;
  const visible = stances.slice(0, maxDissents);

  // Synthesis status — Wave 4 long format. Falls back to legacy net_read.
  const cc = at?.cross_currents;
  const synthesisPending = !cc;

  return (
    <div>
      <div style={sectionLabel}>Cross-Currents — Dissents</div>
      <div
        style={{
          background: BRAND.card,
          border: `1px solid ${BRAND.border}`,
          borderRadius: 5,
          padding: '12px 14px',
        }}
      >
        {/* Top headline row */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: visible.length ? 10 : 0 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
            <span
              style={{
                fontFamily: sans,
                fontSize: 22,
                fontWeight: 700,
                color: totalDissents > 0 ? BRAND.gold : BRAND.muted,
                lineHeight: 1,
              }}
            >
              {totalDissents}
            </span>
            <span
              style={{
                fontFamily: sans,
                fontSize: 10,
                color: BRAND.textSecondary,
                textTransform: 'uppercase',
                letterSpacing: 0.9,
              }}
            >
              {totalDissents === 1 ? 'flagged dissent' : 'flagged dissents'}
            </span>
          </div>
          {synthesisPending && totalDissents > 0 && (
            <span
              style={{
                fontFamily: sans,
                fontSize: 9,
                color: BRAND.muted,
                fontStyle: 'italic',
                letterSpacing: 0.3,
              }}
            >
              T.W. synthesis pending
            </span>
          )}
        </div>

        {/* Top dissents */}
        {visible.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {visible.map((s) => (
              <DissentRow key={s.ticker} stance={s} onTickerClick={onTickerClick} />
            ))}
          </div>
        ) : (
          <div
            style={{
              fontFamily: sans,
              fontSize: 10.5,
              color: BRAND.muted,
              fontStyle: 'italic',
              padding: '4px 0',
            }}
          >
            All analysts concurring with House View this shift.
          </div>
        )}

        {/* See all link */}
        {(totalDissents > maxDissents || onSeeAll) && (
          <button
            onClick={() => onSeeAll?.()}
            style={{
              all: 'unset',
              cursor: 'pointer',
              fontFamily: sans,
              fontSize: 10,
              color: BRAND.gold,
              letterSpacing: 0.5,
              marginTop: 10,
              textTransform: 'uppercase',
              fontWeight: 600,
            }}
            onMouseEnter={(e) => { e.currentTarget.style.textDecoration = 'underline'; }}
            onMouseLeave={(e) => { e.currentTarget.style.textDecoration = 'none'; }}
          >
            See full Cross-Currents in The Pod →
          </button>
        )}
      </div>
    </div>
  );
}
