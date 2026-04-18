import { useMemo } from 'react';
import { BRAND } from '../utils/colors';

const sans = 'Arial, sans-serif';
const mono = "'JetBrains Mono', monospace";

// Stub — populated by C-A.3 sector_spread_metrics table
export default function SectorSpreadStrip({ issuers, sectorFilter }) {
  const sectors = useMemo(() => {
    if (!Array.isArray(issuers)) return [];
    const set = new Set();
    for (const row of issuers) {
      if (row?.sector) set.add(row.sector);
    }
    return Array.from(set).sort();
  }, [issuers]);

  const visible =
    sectorFilter && sectorFilter !== 'all'
      ? sectors.filter((s) => s.toLowerCase() === sectorFilter.toLowerCase())
      : sectors;

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))',
        gap: 6,
      }}
    >
      {visible.map((sector) => (
        <div
          key={sector}
          style={{
            background: BRAND.card,
            border: `1px solid ${BRAND.border}`,
            borderRadius: 4,
            padding: '6px 8px',
          }}
        >
          <div
            style={{
              fontSize: 9,
              textTransform: 'uppercase',
              letterSpacing: 0.8,
              color: BRAND.textSecondary,
              fontFamily: sans,
              fontWeight: 600,
              marginBottom: 3,
            }}
          >
            {sector}
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
            <span style={{ fontSize: 14, fontFamily: mono, color: BRAND.textSecondary, fontWeight: 700 }}>—</span>
            <span style={{ fontSize: 10, fontFamily: mono, color: BRAND.textSecondary }}>—</span>
          </div>
          <div style={{ fontSize: 9, fontFamily: mono, color: BRAND.textSecondary, marginTop: 2 }}>
            z = —
          </div>
        </div>
      ))}
    </div>
  );
}
