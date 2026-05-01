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

const CONVICTION_ORDER = { high: 0, medium: 1, low: 2 };

function DirectionBadge({ direction }) {
  const isShort = direction?.toLowerCase() === 'short';
  return (
    <span
      style={{
        display: 'inline-block',
        background: isShort ? SCORE_COLORS.red : SCORE_COLORS.green,
        color: '#fff',
        fontSize: 8.5,
        fontWeight: 700,
        textTransform: 'uppercase',
        borderRadius: 9999,
        padding: '1px 6px',
        letterSpacing: 0.4,
      }}
    >
      {isShort ? 'Short' : 'Long'}
    </span>
  );
}

function ConvictionDots({ conviction }) {
  const filled =
    conviction === 'high' ? 3 : conviction === 'medium' ? 2 : conviction === 'low' ? 1 : 0;
  return (
    <span style={{ display: 'inline-flex', gap: 2 }}>
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          style={{
            width: 5,
            height: 5,
            borderRadius: '50%',
            background: i < filled ? BRAND.gold : 'transparent',
            border: `1px solid ${i < filled ? BRAND.gold : BRAND.muted}`,
          }}
        />
      ))}
    </span>
  );
}

export default function TopIdeasTop5Panel({ data, onTickerClick }) {
  const ideas = useMemo(() => {
    // Phase 3 will source from data.top_ideas_latest. For Phase 1, fall back
    // to the legacy manual top_ideas.json while the new pipeline ships.
    const newSrc = data?.top_ideas_latest;
    const legacySrc = data?.top_ideas;
    const src = (Array.isArray(newSrc) && newSrc.length > 0) ? newSrc : legacySrc;
    if (!Array.isArray(src) || src.length === 0) return [];
    return [...src]
      .sort((a, b) => (CONVICTION_ORDER[a.conviction] ?? 3) - (CONVICTION_ORDER[b.conviction] ?? 3))
      .slice(0, 5);
  }, [data]);

  const isPlaceholder = ideas.length === 0;
  const sourceTag = data?.top_ideas_latest?.length ? 'team-aggregated' : 'manual';

  return (
    <div>
      <div style={sectionLabel}>
        Top Ideas — Top 5
        <span style={{ color: BRAND.muted, fontWeight: 500, marginLeft: 8, textTransform: 'none', letterSpacing: 0.5 }}>
          {isPlaceholder ? '' : sourceTag}
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
        {isPlaceholder ? (
          <div style={{ padding: 16, fontFamily: sans, fontSize: 10.5, color: BRAND.muted, fontStyle: 'italic', lineHeight: 1.4 }}>
            Top Ideas pipeline pending — bottom-up team aggregation ships in Phase 3.
            Until then, manual ideas appear here when populated.
          </div>
        ) : (
          ideas.map((idea, i) => (
            <button
              key={idea.ticker || i}
              onClick={() => onTickerClick?.(idea.ticker)}
              style={{
                all: 'unset',
                display: 'flex',
                flexDirection: 'column',
                gap: 5,
                padding: '10px 14px',
                width: '100%',
                boxSizing: 'border-box',
                cursor: 'pointer',
                background: i % 2 === 0 ? BRAND.card : BRAND.altRow,
                borderBottom: i < ideas.length - 1 ? `1px solid ${BRAND.border}` : 'none',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = BRAND.cardHover;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = i % 2 === 0 ? BRAND.card : BRAND.altRow;
              }}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <span style={{ fontFamily: mono, fontWeight: 700, fontSize: 12, color: BRAND.text }}>
                  {idea.ticker}
                </span>
                <DirectionBadge direction={idea.direction} />
                <ConvictionDots conviction={idea.conviction} />
                {idea.sector && <SectorTag sector={idea.sector} />}
                {idea.analyst_initials && (
                  <span
                    style={{
                      fontFamily: mono,
                      fontSize: 9.5,
                      color: BRAND.muted,
                      letterSpacing: 0.4,
                      marginLeft: 'auto',
                    }}
                  >
                    {idea.analyst_initials}
                  </span>
                )}
              </span>
              {(idea.thesis_md || idea.thesis) && (
                <span
                  style={{
                    fontFamily: sans,
                    fontSize: 10.5,
                    color: BRAND.textSecondary,
                    lineHeight: 1.45,
                    overflow: 'hidden',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                  }}
                >
                  {(idea.thesis_md || idea.thesis).slice(0, 200)}
                  {(idea.thesis_md || idea.thesis).length > 200 ? '…' : ''}
                </span>
              )}
            </button>
          ))
        )}
      </div>
    </div>
  );
}
