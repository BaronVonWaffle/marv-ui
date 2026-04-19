import { useMemo } from 'react';
import { BRAND, SCORE_COLORS } from '../utils/colors';
import MiniSparkline from './MiniSparkline';

const sans = 'Arial, sans-serif';
const mono = "'JetBrains Mono', monospace";

function formatBpsSigned(value) {
  if (value == null || Number.isNaN(value)) return '—';
  const sign = value > 0 ? '+' : '';
  return `${sign}${value.toFixed(1)}`;
}

function formatZ(value) {
  if (value == null || Number.isNaN(value)) return '—';
  const sign = value > 0 ? '+' : '';
  return `${sign}${value.toFixed(2)}`;
}

const lagsBadgeStyle = {
  display: 'inline-block',
  fontSize: 8,
  fontFamily: sans,
  fontWeight: 700,
  letterSpacing: 0.6,
  padding: '1px 4px',
  borderRadius: 3,
  background: SCORE_COLORS.yellow,
  color: BRAND.navyDark,
  marginLeft: 4,
  verticalAlign: 'middle',
};

export default function SectorSpreadStrip({ data, issuers, sectorFilter }) {
  const sectors = useMemo(() => {
    if (!Array.isArray(issuers)) return [];
    const set = new Set();
    for (const row of issuers) {
      if (row?.sector) set.add(row.sector);
    }
    return Array.from(set).sort();
  }, [issuers]);

  // Aggregate sector_spread_metrics + sector_divergence by sector.
  // Per sector: 30d history sorted asc, MAX(date) row from each table.
  const bySector = useMemo(() => {
    const out = {};
    const ssm = Array.isArray(data?.sector_spread_metrics)
      ? data.sector_spread_metrics
      : [];
    const sdv = Array.isArray(data?.sector_divergence)
      ? data.sector_divergence
      : [];

    for (const r of ssm) {
      if (!r?.sector || !r?.date) continue;
      if (!out[r.sector]) out[r.sector] = { history: [] };
      out[r.sector].history.push(r);
    }
    for (const sector in out) {
      out[sector].history.sort((a, b) => a.date.localeCompare(b.date));
      out[sector].latest = out[sector].history[out[sector].history.length - 1];
    }

    const divLatest = {};
    for (const r of sdv) {
      if (!r?.sector || !r?.date) continue;
      if (!divLatest[r.sector] || r.date > divLatest[r.sector].date) {
        divLatest[r.sector] = r;
      }
    }
    for (const sector in out) {
      out[sector].divergence = divLatest[sector] || null;
    }

    return out;
  }, [data]);

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
      {visible.map((sector) => {
        const entry = bySector[sector];
        const latest = entry?.latest;
        const divergence = entry?.divergence;
        const history = entry?.history || [];

        const oas = latest?.current_oas;
        const d5 = latest?.oas_5d_bps;
        const z = latest?.oas_zscore_90d;
        const lagsActive = divergence?.credit_lags_flag === true;

        const d5Color =
          d5 == null || d5 === 0
            ? BRAND.textSecondary
            : d5 > 0
              ? SCORE_COLORS.red
              : SCORE_COLORS.green;

        return (
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
              {lagsActive && (
                <span style={lagsBadgeStyle} title="credit_lags signal active">
                  LAGS
                </span>
              )}
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
              <span
                style={{
                  fontSize: 14,
                  fontFamily: mono,
                  color: oas == null ? BRAND.textSecondary : BRAND.text,
                  fontWeight: 700,
                }}
              >
                {oas == null ? '—' : oas.toFixed(0)}
              </span>
              <span style={{ fontSize: 10, fontFamily: mono, color: d5Color }}>
                {formatBpsSigned(d5)}
              </span>
            </div>
            <div
              style={{
                fontSize: 9,
                fontFamily: mono,
                color: BRAND.textSecondary,
                marginTop: 2,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 4,
              }}
            >
              <span>z = {formatZ(z)}</span>
              <MiniSparkline
                values={history.map((r) => r.current_oas)}
                width={52}
                height={14}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
