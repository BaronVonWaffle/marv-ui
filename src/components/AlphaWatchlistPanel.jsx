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

// Tag taxonomy → category color, so the eye can group at a glance.
// Quant=teal, Analyst=gold, Event=red-orange, Fundamental=sage.
const TAG_META = {
  EQ_CREDIT_GAP:      { cat: 'quant',       color: '#5eb4a9', label: 'EQ↔CR GAP' },
  LEVERAGE_BREAK:     { cat: 'quant',       color: '#5eb4a9', label: 'LEV BREAK' },
  RISK_REVERSAL:      { cat: 'quant',       color: '#5eb4a9', label: 'REVERSAL' },
  VOL_REGIME_SHIFT:   { cat: 'quant',       color: '#5eb4a9', label: 'VOL SHIFT' },
  TEAM_CONVERGENCE:   { cat: 'analyst',     color: BRAND.gold, label: 'TEAM' },
  CONTRARIAN_DISSENT: { cat: 'analyst',     color: BRAND.gold, label: 'DISSENT' },
  FRESH_FILE:         { cat: 'event',       color: '#d4874d', label: 'FRESH 10-Q/K' },
  POST_PRINT_DRIFT:   { cat: 'event',       color: '#d4874d', label: 'POST-PRINT' },
  CATALYST_IMMINENT:  { cat: 'event',       color: '#d4874d', label: 'CATALYST' },
  SCORE_BREAK:        { cat: 'fundamental', color: BRAND.sage, label: 'SCORE' },
};

function tagMeta(tag) {
  return TAG_META[tag] || { cat: 'other', color: BRAND.muted, label: tag };
}

function TagChip({ tag, evidence }) {
  const meta = tagMeta(tag);
  return (
    <span
      title={evidence || tag}
      style={{
        fontFamily: mono,
        fontSize: 9,
        fontWeight: 700,
        color: meta.color,
        background: 'transparent',
        border: `1px solid ${meta.color}`,
        borderRadius: 3,
        padding: '1px 5px',
        letterSpacing: 0.5,
        whiteSpace: 'nowrap',
      }}
    >
      {meta.label}
    </span>
  );
}

function parseTagStack(raw) {
  if (Array.isArray(raw)) return raw;
  if (typeof raw === 'string') {
    try { return JSON.parse(raw); } catch (e) { return []; }
  }
  return [];
}

function parseEvidence(raw) {
  if (raw && typeof raw === 'object' && !Array.isArray(raw)) return raw;
  if (typeof raw === 'string') {
    try { return JSON.parse(raw); } catch (e) { return {}; }
  }
  return {};
}

function topEvidenceLine(tags, evidence) {
  if (!tags || tags.length === 0) return '';
  // Priority order — pick the most directional / actionable evidence first.
  const priority = [
    'CONTRARIAN_DISSENT',
    'RISK_REVERSAL',
    'FRESH_FILE',
    'POST_PRINT_DRIFT',
    'CATALYST_IMMINENT',
    'LEVERAGE_BREAK',
    'EQ_CREDIT_GAP',
    'SCORE_BREAK',
    'TEAM_CONVERGENCE',
    'VOL_REGIME_SHIFT',
  ];
  for (const tag of priority) {
    if (tags.includes(tag) && evidence[tag]) return evidence[tag];
  }
  return evidence[tags[0]] || '';
}

export default function AlphaWatchlistPanel({ data, onTickerClick }) {
  const rows = useMemo(() => {
    const all = data?.alpha_watchlist_today || [];
    return [...all]
      .map((r) => ({
        ...r,
        tags: parseTagStack(r.tag_stack),
        evidence: parseEvidence(r.tag_evidence),
      }))
      .sort((a, b) => (a.rank || 99) - (b.rank || 99))
      .slice(0, 5);
  }, [data]);

  return (
    <div>
      <div style={sectionLabel}>
        Alpha Watchlist — Top 5
        <span
          style={{
            color: BRAND.muted,
            fontWeight: 500,
            marginLeft: 8,
            textTransform: 'none',
            letterSpacing: 0.5,
          }}
        >
          names to dig into today
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
          <div
            style={{
              padding: 16,
              fontFamily: sans,
              fontSize: 11,
              color: BRAND.muted,
              fontStyle: 'italic',
            }}
          >
            No alpha watchlist today — pipeline runs at 4:30 AM ET.
          </div>
        ) : (
          rows.map((r, i) => {
            const lead = topEvidenceLine(r.tags, r.evidence);
            return (
              <button
                key={r.ticker}
                onClick={() => {
                  // Pass the strongest tag as ?highlight= so IssuerDetail
                  // can scroll/emphasize the relevant evidence section.
                  const primaryTag = r.tags?.[0];
                  onTickerClick?.(r.ticker, primaryTag ? { highlight: primaryTag } : undefined);
                }}
                style={{
                  all: 'unset',
                  display: 'grid',
                  gridTemplateColumns: '24px 64px 1fr auto',
                  gap: 10,
                  alignItems: 'flex-start',
                  padding: '10px 14px',
                  width: '100%',
                  boxSizing: 'border-box',
                  cursor: 'pointer',
                  background: i % 2 === 0 ? BRAND.card : BRAND.altRow,
                  borderBottom:
                    i < rows.length - 1 ? `1px solid ${BRAND.border}` : 'none',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = BRAND.cardHover;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background =
                    i % 2 === 0 ? BRAND.card : BRAND.altRow;
                }}
              >
                <span
                  style={{
                    fontFamily: mono,
                    fontSize: 11,
                    color: BRAND.gold,
                    fontWeight: 700,
                    textAlign: 'center',
                    paddingTop: 2,
                  }}
                >
                  #{r.rank}
                </span>
                <span
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 2,
                    paddingTop: 1,
                  }}
                >
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
                  {r.primary_analyst_initials ? (
                    <span
                      style={{
                        fontFamily: mono,
                        fontSize: 9,
                        color: BRAND.muted,
                      }}
                    >
                      {r.primary_analyst_initials}
                    </span>
                  ) : (
                    <span
                      style={{
                        fontFamily: mono,
                        fontSize: 9,
                        color: BRAND.muted,
                        fontStyle: 'italic',
                      }}
                    >
                      no coverage
                    </span>
                  )}
                </span>
                <span
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 4,
                    overflow: 'hidden',
                    minWidth: 0,
                  }}
                >
                  <span
                    style={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: 4,
                      alignItems: 'center',
                    }}
                  >
                    {r.sector && <SectorTag sector={r.sector} />}
                    {r.tags?.map((tag) => (
                      <TagChip
                        key={tag}
                        tag={tag}
                        evidence={r.evidence?.[tag]}
                      />
                    ))}
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
                    title={lead}
                  >
                    {lead}
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
                    paddingTop: 2,
                  }}
                >
                  {r.composite_score?.toFixed?.(0) ?? r.composite_score ?? '—'}
                </span>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
