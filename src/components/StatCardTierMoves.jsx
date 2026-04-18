import { useMemo } from 'react';
import { BRAND, SCORE_COLORS } from '../utils/colors';

const sans = 'Arial, sans-serif';
const mono = "'JetBrains Mono', monospace";

const TIER_RANK = { green: 0, yellow: 1, red: 2 };

function classifyMove(prior, current) {
  const a = TIER_RANK[prior];
  const b = TIER_RANK[current];
  if (a === undefined || b === undefined) return null;
  if (b > a) return 'downgrade';
  if (b < a) return 'upgrade';
  return null;
}

export default function StatCardTierMoves({ currentScores, scoreHistoryByTicker }) {
  const { downgrades, upgrades, hasPrior } = useMemo(() => {
    let d = 0;
    let u = 0;
    let anyPrior = false;
    if (!currentScores || !scoreHistoryByTicker) return { downgrades: 0, upgrades: 0, hasPrior: false };

    for (const row of currentScores) {
      const ticker = row?.ticker;
      const currentLabel = row?.fundamental_label;
      const currentDate = row?.score_date;
      if (!ticker || !currentLabel || !currentDate) continue;

      const history = scoreHistoryByTicker[ticker] || [];
      let priorLabel = null;
      for (let i = history.length - 1; i >= 0; i--) {
        const h = history[i];
        if (h?.score_date && h.score_date < currentDate && h.fundamental_label) {
          priorLabel = h.fundamental_label;
          break;
        }
      }
      if (priorLabel) {
        anyPrior = true;
        const move = classifyMove(priorLabel, currentLabel);
        if (move === 'downgrade') d += 1;
        else if (move === 'upgrade') u += 1;
      }
    }
    return { downgrades: d, upgrades: u, hasPrior: anyPrior };
  }, [currentScores, scoreHistoryByTicker]);

  return (
    <div
      style={{
        background: BRAND.card,
        border: `1px solid ${BRAND.border}`,
        borderRadius: 5,
        padding: '10px 14px',
      }}
    >
      <div
        style={{
          fontSize: 9,
          textTransform: 'uppercase',
          letterSpacing: 1.2,
          color: BRAND.muted,
          fontWeight: 600,
          fontFamily: sans,
          marginBottom: 6,
        }}
      >
        Tier moves today
      </div>

      {!hasPrior ? (
        <>
          <div style={{ fontSize: 22, fontWeight: 700, fontFamily: mono, color: BRAND.textSecondary, lineHeight: 1.2 }}>—</div>
          <div style={{ fontSize: 10, color: BRAND.textSecondary, fontFamily: sans, marginTop: 2 }}>
            Awaiting prior run
          </div>
        </>
      ) : (
        <>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 14 }}>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: 22, fontWeight: 700, fontFamily: mono, color: SCORE_COLORS.red, lineHeight: 1.1 }}>
                {downgrades}
              </span>
              <span style={{ fontSize: 9, color: BRAND.muted, fontFamily: sans, textTransform: 'uppercase', letterSpacing: 0.8 }}>
                down
              </span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: 22, fontWeight: 700, fontFamily: mono, color: SCORE_COLORS.green, lineHeight: 1.1 }}>
                {upgrades}
              </span>
              <span style={{ fontSize: 9, color: BRAND.muted, fontFamily: sans, textTransform: 'uppercase', letterSpacing: 0.8 }}>
                up
              </span>
            </div>
          </div>
          <div style={{ fontSize: 10, color: BRAND.textSecondary, fontFamily: sans, marginTop: 4 }}>
            vs prior run
          </div>
        </>
      )}
    </div>
  );
}
