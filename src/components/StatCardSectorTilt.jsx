import { useMemo } from 'react';
import { BRAND, SCORE_COLORS } from '../utils/colors';

const sans = 'Arial, sans-serif';
const mono = "'JetBrains Mono', monospace";

const C_RED_PRIMARY = '#E24B4A';
const C_RED_TAIL = '#F09595';

function abbrev(sector) {
  if (!sector) return '';
  const s = String(sector).toUpperCase();
  return s.slice(0, 3);
}

export default function StatCardSectorTilt({ currentScores, issuersByTicker, sectorFilter }) {
  const bars = useMemo(() => {
    if (!currentScores || !issuersByTicker) return [];
    const counts = {};
    for (const row of currentScores) {
      if (row?.fundamental_label !== 'red') continue;
      const ticker = row.ticker;
      const sector = row?.sector || issuersByTicker[ticker]?.sector;
      if (!sector) continue;
      counts[sector] = (counts[sector] || 0) + 1;
    }
    return Object.entries(counts)
      .map(([sector, count]) => ({ sector, count }))
      .sort((a, b) => b.count - a.count);
  }, [currentScores, issuersByTicker]);

  const isFiltered = sectorFilter && sectorFilter !== 'all';
  const filteredBars = isFiltered
    ? bars.filter((b) => b.sector?.toLowerCase() === sectorFilter.toLowerCase())
    : bars;

  const totalRed = bars.reduce((s, b) => s + b.count, 0);
  const maxCount = filteredBars.reduce((m, b) => (b.count > m ? b.count : m), 0);

  const showEmpty = isFiltered
    ? filteredBars.length === 0 || filteredBars[0].count === 0
    : totalRed === 0;

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
        Red cohort sector tilt
      </div>

      {showEmpty ? (
        <div
          style={{
            fontSize: 11,
            color: BRAND.textSecondary,
            fontFamily: sans,
            textAlign: 'center',
            padding: '14px 0 8px',
          }}
        >
          No red names today
        </div>
      ) : isFiltered ? (
        <>
          <div style={{ fontSize: 22, fontWeight: 700, fontFamily: mono, color: SCORE_COLORS.red, lineHeight: 1.2 }}>
            {filteredBars[0]?.count ?? 0}
          </div>
          <div style={{ fontSize: 10, color: BRAND.textSecondary, fontFamily: sans, marginTop: 2 }}>
            red names in {sectorFilter}
          </div>
        </>
      ) : (
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 52, marginTop: 2 }}>
          {filteredBars.map((b, i) => {
            const ratio = maxCount > 0 ? b.count / maxCount : 0;
            const h = Math.max(4, Math.round(ratio * 40));
            const color = i === 0 ? C_RED_PRIMARY : C_RED_TAIL;
            return (
              <div
                key={b.sector}
                title={`${b.sector}: ${b.count}`}
                style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, minWidth: 20 }}
              >
                <div style={{ fontSize: 9, fontFamily: mono, color: BRAND.textSecondary, lineHeight: 1 }}>{b.count}</div>
                <div style={{ width: '100%', height: h, background: color, marginTop: 2, borderRadius: 2 }} />
                <div style={{ fontSize: 9, fontFamily: mono, color: BRAND.muted, marginTop: 3, letterSpacing: 0.4 }}>
                  {abbrev(b.sector)}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
