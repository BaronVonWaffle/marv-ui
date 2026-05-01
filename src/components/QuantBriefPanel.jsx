import { useMemo } from 'react';
import { BRAND, SCORE_COLORS } from '../utils/colors';
import renderMarkdown from '../utils/markdownLite.jsx';

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

// FRED series we care about for the morning tape read.
const TAPE_SERIES = [
  { id: 'BAMLH0A0HYM2', label: 'HY OAS',   unit: '%' },
  { id: 'BAMLC0A0CM',   label: 'IG OAS',   unit: '%' },
  { id: 'BAMLH0A1HYBB', label: 'BB OAS',   unit: '%' },
  { id: 'BAMLH0A3HYC',  label: 'CCC OAS',  unit: '%' },
  { id: 'VIXCLS',       label: 'VIX',      unit: '' },
  { id: 'DFII10',       label: '10y Real', unit: '%' },
];

// Reduce a tall-format FRED series array into {series_id: [{obs_date, value}, ...] sorted asc}
function indexFred(rows) {
  const out = {};
  if (!Array.isArray(rows)) return out;
  for (const r of rows) {
    if (!r?.series_id || r?.value == null) continue;
    (out[r.series_id] ||= []).push(r);
  }
  for (const sid of Object.keys(out)) {
    out[sid].sort((a, b) => (a.obs_date < b.obs_date ? -1 : 1));
  }
  return out;
}

// Find latest + lookback (5 trading days back ≈ 7 calendar days)
function pickLatestAndPrior(rows, daysBack = 5) {
  if (!rows || rows.length === 0) return { latest: null, prior: null };
  const latest = rows[rows.length - 1];
  const priorIdx = Math.max(0, rows.length - 1 - daysBack);
  const prior = rows[priorIdx];
  return { latest, prior };
}

function fmtVal(v, unit) {
  if (v == null || isNaN(v)) return '—';
  if (unit === '%') return v.toFixed(2);
  return Math.round(v).toString();
}

function fmtDelta(curr, prev, unit) {
  if (curr == null || prev == null) return null;
  const d = curr - prev;
  const sign = d > 0 ? '+' : '';
  if (unit === '%') return `${sign}${(d * 100).toFixed(0)} bps`;
  return `${sign}${d.toFixed(1)}`;
}

function deltaColor(curr, prev, riskOffWiderIsBad = true) {
  if (curr == null || prev == null) return BRAND.muted;
  const d = curr - prev;
  if (Math.abs(d) < 0.0001) return BRAND.muted;
  // For OAS / VIX, wider is risk-off (red). For real yields it's mixed; default neutral.
  if (riskOffWiderIsBad) return d > 0 ? SCORE_COLORS.red : SCORE_COLORS.green;
  return BRAND.text;
}

function TapeTile({ label, latest, prior, unit }) {
  const v = latest?.value;
  const pv = prior?.value;
  const delta = fmtDelta(v, pv, unit);
  // Real yields aren't a "wider = bad" signal. OAS + VIX are.
  const isRiskOff = label.includes('OAS') || label === 'VIX';
  const dColor = deltaColor(v, pv, isRiskOff);
  return (
    <div
      style={{
        background: BRAND.card,
        border: `1px solid ${BRAND.border}`,
        borderRadius: 4,
        padding: '8px 10px',
        minWidth: 90,
        flex: '1 1 90px',
      }}
    >
      <div
        style={{
          fontFamily: sans,
          fontSize: 9,
          color: BRAND.muted,
          textTransform: 'uppercase',
          letterSpacing: 0.9,
          marginBottom: 3,
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontFamily: mono,
          fontSize: 16,
          fontWeight: 700,
          color: BRAND.text,
          lineHeight: 1.1,
        }}
      >
        {fmtVal(v, unit)}{unit === '%' && v != null ? <span style={{ fontSize: 10, color: BRAND.muted, marginLeft: 2 }}>%</span> : null}
      </div>
      {delta && (
        <div
          style={{
            fontFamily: mono,
            fontSize: 9.5,
            color: dColor,
            marginTop: 2,
            letterSpacing: 0.3,
          }}
        >
          {delta} 5d
        </div>
      )}
    </div>
  );
}

function EtfStrip({ etfRows }) {
  // Per-ticker latest + prior close, summarize direction.
  const rows = useMemo(() => {
    const grouped = {};
    for (const r of etfRows || []) {
      if (!r?.ticker) continue;
      (grouped[r.ticker] ||= []).push(r);
    }
    for (const t of Object.keys(grouped)) {
      grouped[t].sort((a, b) => (a.obs_date < b.obs_date ? -1 : 1));
    }
    const out = [];
    for (const t of ['HYG', 'JNK', 'LQD', 'AGG', 'EMB']) {
      const series = grouped[t];
      if (!series || series.length === 0) continue;
      const latest = series[series.length - 1];
      const prior = series.length > 1 ? series[series.length - 2] : null;
      const close = latest.close_price;
      const pclose = prior?.close_price;
      const pct = pclose ? ((close - pclose) / pclose) * 100 : null;
      out.push({ ticker: t, close, pct });
    }
    return out;
  }, [etfRows]);

  if (rows.length === 0) return null;

  return (
    <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginTop: 10, alignItems: 'baseline' }}>
      <span
        style={{
          fontFamily: sans,
          fontSize: 9,
          color: BRAND.muted,
          textTransform: 'uppercase',
          letterSpacing: 0.9,
        }}
      >
        ETF tape
      </span>
      {rows.map((r) => {
        const dColor = r.pct == null ? BRAND.muted : r.pct > 0 ? SCORE_COLORS.green : r.pct < 0 ? SCORE_COLORS.red : BRAND.muted;
        return (
          <span key={r.ticker} style={{ fontFamily: mono, fontSize: 10.5 }}>
            <span style={{ color: BRAND.text, fontWeight: 700 }}>{r.ticker}</span>{' '}
            <span style={{ color: BRAND.textSecondary }}>{r.close ? r.close.toFixed(2) : '—'}</span>{' '}
            <span style={{ color: dColor }}>
              {r.pct == null ? '' : `${r.pct > 0 ? '+' : ''}${r.pct.toFixed(2)}%`}
            </span>
          </span>
        );
      })}
    </div>
  );
}

export default function QuantBriefPanel({ data }) {
  const fred = useMemo(() => indexFred(data?.fred_credit_metrics), [data]);
  const quantBrief = data?.quant_brief_latest?.[0] || data?.quant_brief_latest;
  const briefMd = quantBrief?.brief_md || quantBrief?.synthesis_md || null;

  const tiles = TAPE_SERIES.map((s) => {
    const { latest, prior } = pickLatestAndPrior(fred[s.id], 5);
    return { ...s, latest, prior };
  }).filter((t) => t.latest); // hide empty series

  return (
    <div>
      <div style={sectionLabel}>Q.T. — Quant Brief</div>
      <div
        style={{
          background: BRAND.card,
          border: `1px solid ${BRAND.border}`,
          borderRadius: 5,
          padding: '14px 16px',
        }}
      >
        {/* Tape tiles */}
        {tiles.length > 0 ? (
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {tiles.map((t) => (
              <TapeTile key={t.id} label={t.label} latest={t.latest} prior={t.prior} unit={t.unit} />
            ))}
          </div>
        ) : (
          <div style={{ fontFamily: sans, fontSize: 10.5, color: BRAND.muted, fontStyle: 'italic' }}>
            FRED tape unavailable — refresh fetch_fred_credit.py
          </div>
        )}

        {/* ETF strip */}
        <EtfStrip etfRows={data?.etf_credit_proxy} />

        {/* Q.T.'s narrative — empty until first morning publish */}
        <div
          style={{
            marginTop: 14,
            paddingTop: 12,
            borderTop: `1px solid ${BRAND.border}`,
          }}
        >
          {briefMd ? (
            <div style={{ fontFamily: sans, fontSize: 11.5, lineHeight: 1.5, color: BRAND.text }}>
              {renderMarkdown(briefMd, { paraSize: 11.5, bulletSize: 11 })}
            </div>
          ) : (
            <div
              style={{
                fontFamily: sans,
                fontSize: 10.5,
                color: BRAND.muted,
                fontStyle: 'italic',
                lineHeight: 1.4,
              }}
            >
              Quant brief pending — Q.T. publishes after market open. Tape tiles above
              show the latest overnight FRED + ETF readings.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
