import { useState, useEffect } from 'react';
import ScoreBadge from '../components/ScoreBadge';
import SectorTag from '../components/SectorTag';
import SeverityDot from '../components/SeverityDot';
import AnalystTeamBlock from '../components/AnalystTeamBlock';
import { BRAND, SCORE_COLORS } from '../utils/colors';
import { formatDate, colorForDev, colorForFund, colorForMaturity } from '../utils/format';

const mono = "'JetBrains Mono', monospace";
const sans = 'Arial, sans-serif';

const sectionHeader = {
  fontSize: 9,
  fontWeight: 700,
  fontFamily: sans,
  textTransform: 'uppercase',
  letterSpacing: 1,
  color: BRAND.gold,
  marginBottom: 8,
};

const sectionWrap = {
  padding: '12px 0',
  borderBottom: `1px solid ${BRAND.border}`,
};

function formatLargeNumber(val) {
  if (val == null) return null;
  const n = typeof val === 'number' ? val : parseFloat(val);
  if (isNaN(n)) return null;
  if (Math.abs(n) >= 1000) return `$${(n / 1000).toFixed(1)}B`;
  return `$${Math.round(n).toLocaleString()}M`;
}

function returnColor(val) {
  if (val == null) return BRAND.muted;
  return val >= 0 ? SCORE_COLORS.green : SCORE_COLORS.red;
}

function formatReturn(val) {
  if (val == null) return '—';
  const pct = (val * 100).toFixed(1);
  return val > 0 ? `+${pct}%` : `${pct}%`;
}

function liqBadgeColor(assessment) {
  if (!assessment) return BRAND.muted;
  const a = assessment.toLowerCase();
  if (a.includes('strong')) return SCORE_COLORS.green;
  if (a.includes('weak')) return SCORE_COLORS.red;
  return SCORE_COLORS.yellow;
}

function tryParse(val) {
  if (Array.isArray(val)) return val;
  if (typeof val !== 'string') return null;
  try { return JSON.parse(val); } catch { return null; }
}

function find(arr, ticker) {
  if (!arr) return null;
  return arr.find((x) => x.ticker === ticker) || null;
}

function filterBy(arr, ticker) {
  if (!arr) return [];
  return arr.filter((x) => x.ticker === ticker);
}

function SubRow({ label, value, badge, color }) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '3px 0',
        fontSize: 11,
      }}
    >
      <span style={{ color: BRAND.muted }}>{label}</span>
      <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        {value != null && (
          <span style={{ fontFamily: mono, fontSize: 11, color: color || BRAND.text }}>
            {value}
          </span>
        )}
        {badge && <ScoreBadge score={badge} size="sm" />}
      </span>
    </div>
  );
}

function MiniStat({ label, value }) {
  if (value == null) return null;
  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ fontSize: 8, textTransform: 'uppercase', letterSpacing: 0.8, color: BRAND.muted, fontWeight: 600, marginBottom: 2 }}>
        {label}
      </div>
      <div style={{ fontFamily: mono, fontSize: 13, fontWeight: 700, color: BRAND.text }}>
        {value}
      </div>
    </div>
  );
}

// Wave 6: Fundamental Score (v2) block. Renders the composite + 5-bucket
// breakdown + score_momentum trajectory when scoreV2 is present. Empty
// state surfaces the engine-migration gap explicitly (Wave 7 candidate)
// rather than silently hiding — the gap is itself a useful signal to the
// desk.
const V2_LABEL_COLOR = {
  green: SCORE_COLORS.green,
  yellow: SCORE_COLORS.yellow,
  red: SCORE_COLORS.red,
};

const V2_BUCKETS = [
  { key: 'bucket_leverage',      label: 'Leverage' },
  { key: 'bucket_market_risk',   label: 'Market risk' },
  { key: 'bucket_cash_flow',     label: 'Cash flow' },
  { key: 'bucket_profitability', label: 'Profitability' },
  { key: 'bucket_default_risk',  label: 'Default risk' },
];

function bucketColor(val) {
  if (val == null) return BRAND.muted;
  // Buckets are 0-10ish in the v2 engine; >=7 green, 4-7 yellow, <4 red.
  if (val >= 7) return SCORE_COLORS.green;
  if (val >= 4) return SCORE_COLORS.yellow;
  return SCORE_COLORS.red;
}

function FundamentalScoreV2Block({ scoreV2, momentum }) {
  if (!scoreV2) {
    return (
      <div style={sectionWrap}>
        <div style={sectionHeader}>Fundamental Score (v2)</div>
        <div
          style={{
            padding: '8px 10px',
            background: BRAND.altRow,
            borderRadius: 4,
            fontFamily: sans,
            fontSize: 10.5,
            color: BRAND.muted,
            lineHeight: 1.5,
          }}
        >
          Fundamental scoring v2 unavailable for this issuer — engine
          migration to xbrl_financials pending (Wave 7). Showing v1
          scores below.
        </div>
      </div>
    );
  }
  const label = scoreV2.fundamental_label || 'no_data';
  const labelColor = V2_LABEL_COLOR[label.toLowerCase()] || BRAND.muted;
  return (
    <div style={sectionWrap}>
      <div
        style={{
          ...sectionHeader,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'baseline',
        }}
      >
        <span>Fundamental Score (v2)</span>
        <span
          style={{
            fontFamily: sans,
            fontSize: 9,
            color: BRAND.muted,
            textTransform: 'uppercase',
            letterSpacing: 0.6,
          }}
        >
          {scoreV2.peer_group || scoreV2.sector || ''}
        </span>
      </div>

      {/* Composite + label */}
      <div
        style={{
          display: 'flex',
          gap: 14,
          alignItems: 'center',
          marginBottom: 10,
        }}
      >
        <div
          style={{
            fontFamily: mono,
            fontSize: 22,
            fontWeight: 700,
            color: BRAND.text,
            lineHeight: 1,
          }}
        >
          {typeof scoreV2.fundamental_score === 'number'
            ? scoreV2.fundamental_score.toFixed(1)
            : '—'}
        </div>
        <span
          style={{
            display: 'inline-block',
            fontFamily: sans,
            fontSize: 9.5,
            fontWeight: 700,
            letterSpacing: 0.7,
            textTransform: 'uppercase',
            color: BRAND.card,
            background: labelColor,
            padding: '3px 9px',
            borderRadius: 3,
          }}
        >
          {label}
        </span>
      </div>

      {/* 5-bucket breakdown */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(5, 1fr)',
          gap: 6,
          marginBottom: momentum ? 10 : 0,
        }}
      >
        {V2_BUCKETS.map((b) => {
          const val = scoreV2[b.key];
          const dotColor = bucketColor(val);
          return (
            <div
              key={b.key}
              style={{
                background: BRAND.altRow,
                padding: '6px 4px',
                borderRadius: 3,
                textAlign: 'center',
              }}
              title={`${b.label}: ${val == null ? 'no data' : val}`}
            >
              <div
                style={{
                  fontSize: 8,
                  textTransform: 'uppercase',
                  letterSpacing: 0.6,
                  color: BRAND.muted,
                  fontWeight: 600,
                  marginBottom: 4,
                }}
              >
                {b.label}
              </div>
              <div
                style={{
                  fontFamily: mono,
                  fontSize: 12,
                  fontWeight: 700,
                  color: dotColor,
                }}
              >
                {val == null ? '—' : Number(val).toFixed(1)}
              </div>
            </div>
          );
        })}
      </div>

      {/* Score momentum trajectory */}
      {momentum && (
        <div
          style={{
            background: BRAND.altRow,
            borderRadius: 3,
            padding: '6px 10px',
            display: 'flex',
            flexDirection: 'column',
            gap: 4,
          }}
        >
          <div
            style={{
              fontSize: 8,
              textTransform: 'uppercase',
              letterSpacing: 0.7,
              color: BRAND.muted,
              fontWeight: 700,
            }}
          >
            Momentum (30d / 90d / 180d)
          </div>
          <div
            style={{
              fontFamily: mono,
              fontSize: 11,
              color: BRAND.text,
              display: 'flex',
              gap: 12,
            }}
          >
            <span>Δ {formatDelta(momentum.score_delta_30d)}</span>
            <span>Δ {formatDelta(momentum.score_delta_90d)}</span>
            <span>Δ {formatDelta(momentum.score_delta_180d)}</span>
          </div>
          {momentum.narrative_snippet && (
            <div
              style={{
                fontFamily: sans,
                fontSize: 10.5,
                color: BRAND.textSecondary,
                lineHeight: 1.4,
                marginTop: 2,
              }}
            >
              {momentum.narrative_snippet}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function formatDelta(v) {
  if (v == null) return '—';
  const n = Number(v);
  if (isNaN(n)) return '—';
  const sign = n > 0 ? '+' : '';
  return `${sign}${n.toFixed(1)}`;
}

// Wave 6: Coverage memo block. Renders the analyst's deep-dive memo
// body with status pill + initiated/refreshed dates. Memo body is
// collapsed by default (1k+ words is too long to scan) — click to expand.
const MEMO_STATUS_COLOR = {
  initiated: SCORE_COLORS.green,
  refreshed: '#5294d0',
  refresh_due: SCORE_COLORS.yellow,
  stale: SCORE_COLORS.red,
  queued: BRAND.muted,
};

function CoverageMemoBlock({ memo }) {
  const [open, setOpen] = useState(false);
  if (!memo) return null;
  const status = memo.memo_status || 'unknown';
  const statusColor = MEMO_STATUS_COLOR[status] || BRAND.muted;
  const wordCount = memo.memo_md
    ? memo.memo_md.trim().split(/\s+/).length
    : 0;
  return (
    <div style={sectionWrap}>
      <div
        style={{
          ...sectionHeader,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'baseline',
          marginBottom: 6,
        }}
      >
        <span>
          Memo —{' '}
          <span style={{ color: BRAND.muted, fontWeight: 400 }}>
            initiated {memo.initiated_date || '—'} by {memo.analyst_initials || '—'}
          </span>
        </span>
        <span
          style={{
            display: 'inline-block',
            fontFamily: sans,
            fontSize: 9,
            fontWeight: 700,
            color: BRAND.card,
            background: statusColor,
            textTransform: 'uppercase',
            letterSpacing: 0.7,
            padding: '2px 8px',
            borderRadius: 3,
          }}
        >
          {status.replace(/_/g, ' ')}
        </span>
      </div>
      <div
        style={{
          fontFamily: sans,
          fontSize: 10,
          color: BRAND.muted,
          marginBottom: 8,
        }}
      >
        Last refreshed {memo.last_refreshed_date || '—'} ·{' '}
        {memo.quarters_covered || 'no quarters listed'}
        {wordCount > 0 ? ` · ${wordCount.toLocaleString()} words` : ''}
      </div>
      {memo.memo_md ? (
        open ? (
          <div
            style={{
              fontFamily: sans,
              fontSize: 11.5,
              color: BRAND.text,
              lineHeight: 1.6,
              background: BRAND.altRow,
              borderRadius: 4,
              padding: '12px 14px',
              whiteSpace: 'pre-wrap',
            }}
          >
            {memo.memo_md}
            <div style={{ marginTop: 12 }}>
              <button
                type="button"
                onClick={() => setOpen(false)}
                style={{
                  all: 'unset',
                  cursor: 'pointer',
                  fontFamily: sans,
                  fontSize: 10,
                  color: BRAND.gold,
                  textDecoration: 'underline',
                }}
              >
                Collapse memo
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setOpen(true)}
            style={{
              all: 'unset',
              cursor: 'pointer',
              fontFamily: sans,
              fontSize: 11,
              color: BRAND.gold,
              textDecoration: 'underline',
            }}
          >
            Read full memo ({wordCount.toLocaleString()} words)
          </button>
        )
      ) : (
        <div
          style={{
            fontFamily: sans,
            fontSize: 10.5,
            color: BRAND.muted,
            fontStyle: 'italic',
          }}
        >
          Memo body not available in snapshot.
        </div>
      )}
    </div>
  );
}

export default function IssuerDetail({ ticker, data, onClose, embedded = false }) {
  const [expanded, setExpanded] = useState(embedded); // embedded mode starts wide
  const [activeTab, setActiveTab] = useState('profile');

  // Reset to profile tab whenever the ticker changes — landing on a name
  // should default to the original quant-pipeline view; analyst digest is
  // a click-in for names that have it.
  useEffect(() => { setActiveTab('profile'); }, [ticker]);

  if (!ticker || !data) return null;

  const score = find(data.scores, ticker) || {};
  const debtEv = find(data.debt_ev, ticker);
  const equity = find(data.equity_daily, ticker);
  const synthesis = find(data.synthesis, ticker);
  const profile = find(data.profiles, ticker);
  const capStruct = find(data.capital_structures, ticker);
  const transcript = find(data.transcript_signals, ticker);
  const flags = filterBy(data.equity_flags, ticker);
  const connections = filterBy(data.connection_summary, ticker);
  const catalysts = filterBy(data.catalysts, ticker);

  // Wave 6: fundamental_scores_v2 lookup. Engine still reads stale
  // fmp_financials so coverage is ~24%; many tickers will have no row.
  // Render gracefully — the empty state is itself a signal to the user
  // that Wave 7 (xbrl_financials migration) is the queued fix.
  const scoreV2 = find(data.fundamental_scores_v2, ticker);
  const momentum = find(data.score_momentum, ticker);

  // Tab gating: "Analyst Digest" tab only appears when the ticker has
  // analyst-team content (any of the 12 demo names). Non-demo names see
  // the panel exactly as it was before — single-pane Issuer Profile.
  const hasAnalystContent = Boolean(
    data?.has_analyst_team &&
    data?.analyst_team?.issuer_detail?.[ticker]
  );

  // Two render modes:
  //   embedded=true  → page-style; no overlay, no fixed positioning, no slide-over
  //                    (used by /issuer/:ticker route)
  //   embedded=false → modal slide-over (default; used when opened from clicks
  //                    in PMDashboard / other views via selectedTicker state)
  const panelStyle = embedded
    ? {
        background: BRAND.card,
        border: `1px solid ${BRAND.border}`,
        borderRadius: 5,
        fontFamily: sans,
        padding: '20px 24px',
        boxSizing: 'border-box',
        position: 'relative',
      }
    : {
        position: 'fixed',
        right: 0,
        top: 0,
        bottom: 0,
        width: expanded ? 'min(900px, 95vw)' : 'min(520px, 90vw)',
        background: BRAND.card,
        borderLeft: `2px solid ${BRAND.sage}`,
        boxShadow: '-4px 0 20px rgba(0,0,0,0.15)',
        zIndex: 1000,
        overflowY: 'auto',
        fontFamily: sans,
        padding: '16px 18px',
        boxSizing: 'border-box',
        transition: 'width 0.25s ease',
      };

  return (
    <>
      {/* Overlay — only in modal mode */}
      {!embedded && (
        <div
          onClick={onClose}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.6)',
            zIndex: 999,
          }}
        />
      )}

      {/* Panel */}
      <div style={panelStyle}>
        {/* Header buttons — modal mode shows expand+close; embedded mode shows only back */}
        {!embedded ? (
        <div style={{ position: 'absolute', top: 12, right: 14, display: 'flex', gap: 6 }}>
          <button
            onClick={() => setExpanded(!expanded)}
            title={expanded ? 'Collapse' : 'Expand'}
            style={{
              background: 'none',
              border: 'none',
              color: BRAND.muted,
              cursor: 'pointer',
              lineHeight: 1,
              padding: 2,
            }}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
              {expanded ? (
                <>
                  <polyline points="6,2 10,2 10,6" />
                  <polyline points="10,14 6,14 6,10" />
                  <line x1="10" y1="2" x2="14" y2="0" />
                  <line x1="6" y1="14" x2="2" y2="16" />
                </>
              ) : (
                <>
                  <polyline points="10,2 14,2 14,6" />
                  <polyline points="6,14 2,14 2,10" />
                  <line x1="14" y1="2" x2="10" y2="6" />
                  <line x1="2" y1="14" x2="6" y2="10" />
                </>
              )}
            </svg>
          </button>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: 18,
              color: BRAND.muted,
              cursor: 'pointer',
              lineHeight: 1,
              padding: 0,
            }}
          >
            ✕
          </button>
        </div>
        ) : (
          // Embedded mode — small "back" affordance only when onClose handler given
          onClose && (
            <div style={{ position: 'absolute', top: 14, right: 18 }}>
              <button
                onClick={onClose}
                title="Back"
                style={{
                  background: 'none',
                  border: 'none',
                  color: BRAND.muted,
                  cursor: 'pointer',
                  fontFamily: sans,
                  fontSize: 11,
                  textTransform: 'uppercase',
                  letterSpacing: 0.6,
                  padding: 0,
                }}
                onMouseEnter={(e) => { e.currentTarget.style.color = BRAND.gold; }}
                onMouseLeave={(e) => { e.currentTarget.style.color = BRAND.muted; }}
              >
                ← Back
              </button>
            </div>
          )
        )}

        {/* HEADER */}
        <div style={{ marginBottom: 14, paddingRight: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span style={{ fontFamily: mono, fontWeight: 700, fontSize: 20, color: BRAND.white }}>
              {ticker}
            </span>
            {score.sector && <SectorTag sector={score.sector} />}
            <ScoreBadge score={score.composite_score || 'no_data'} size="lg" />
          </div>
          <div style={{ fontSize: 10, color: BRAND.muted, marginTop: 4 }}>
            {[score.coverage_tier, score.peer_group].filter(Boolean).join(' · ')}
          </div>
          {debtEv && (formatLargeNumber(debtEv.market_cap) || formatLargeNumber(debtEv.enterprise_value)) && (
            <div style={{ fontFamily: mono, fontSize: 11, color: BRAND.muted, marginTop: 3 }}>
              {[
                formatLargeNumber(debtEv.market_cap) ? `Mkt Cap ${formatLargeNumber(debtEv.market_cap)}` : null,
                formatLargeNumber(debtEv.enterprise_value) ? `EV ${formatLargeNumber(debtEv.enterprise_value)}` : null,
              ].filter(Boolean).join(' · ')}
            </div>
          )}
        </div>

        {/* TAB BAR — only renders when the ticker has analyst-team content.
            Otherwise the panel looks exactly as it did pre-Phase B.5. */}
        {hasAnalystContent && (
          <div
            style={{
              display: 'flex',
              gap: 0,
              borderBottom: `1px solid ${BRAND.border}`,
              marginBottom: 12,
              marginTop: 4,
            }}
          >
            {[
              { key: 'profile', label: 'Issuer Profile' },
              { key: 'digest', label: 'Analyst Digest' },
            ].map((t) => {
              const active = activeTab === t.key;
              return (
                <button
                  key={t.key}
                  onClick={() => setActiveTab(t.key)}
                  style={{
                    background: 'none',
                    border: 'none',
                    borderBottom: active ? `2px solid ${BRAND.gold}` : '2px solid transparent',
                    color: active ? BRAND.gold : BRAND.muted,
                    fontWeight: active ? 600 : 400,
                    fontFamily: sans,
                    fontSize: 11,
                    padding: '7px 14px',
                    cursor: 'pointer',
                    letterSpacing: 0.3,
                  }}
                >
                  {t.label}
                </button>
              );
            })}
          </div>
        )}

        {/* DIGEST TAB CONTENT */}
        {hasAnalystContent && activeTab === 'digest' && (
          <>
            {/* WAVE 6: MEMO block — sits above the existing issuer_detail
                section blocks. Renders coverage_memos.memo_md with status
                pill + last refresh date. Hidden if no memo on file for
                this ticker (most names — the targeted memo program is
                ~50/quarter per CLAUDE.md). */}
            <CoverageMemoBlock
              memo={find(data.coverage_memos, ticker)}
            />
            <AnalystTeamBlock ticker={ticker} data={data} expanded={expanded} />
          </>
        )}

        {/* PROFILE TAB CONTENT (default; also shown when there is no
            analyst content for this ticker, so non-demo names render the
            full original panel without tabs). */}
        {(!hasAnalystContent || activeTab === 'profile') && (
        <div>
        {/* WAVE 6: FUNDAMENTAL SCORE (v2) — composite + 5-bucket breakdown
            with score_momentum trajectory. Renders an empty state for
            issuers without v2 data (currently ~76% of universe — engine
            migration to xbrl_financials is queued as Wave 7). The empty
            state is intentional: it makes the data gap visible to the
            desk rather than silently falling back to v1. */}
        <FundamentalScoreV2Block scoreV2={scoreV2} momentum={momentum} />

        {/* SECTION 1: Score Breakdown */}
        <div style={sectionWrap}>
          <div style={sectionHeader}>Score Breakdown</div>

          {/* 3-box row */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 10 }}>
            {[
              { label: 'Quant', key: 'quantitative' },
              { label: 'Qual', key: 'qualitative' },
              { label: 'Composite', key: 'composite_score' },
            ].map((b) => (
              <div
                key={b.key}
                style={{
                  textAlign: 'center',
                  background: BRAND.altRow,
                  borderRadius: 4,
                  padding: '8px 4px',
                }}
              >
                <div style={{ fontSize: 8, textTransform: 'uppercase', letterSpacing: 0.8, color: BRAND.muted, fontWeight: 600, marginBottom: 4 }}>
                  {b.label}
                </div>
                <ScoreBadge score={score[b.key] || 'no_data'} size="lg" />
              </div>
            ))}
          </div>

          {/* Sub-score rows */}
          <SubRow
            label="Fundamental"
            value={typeof score.fundamental === 'number' ? score.fundamental.toFixed(2) : null}
            badge={score.fundamental_score}
          />
          <SubRow
            label="Debt/EV"
            value={typeof score.dev === 'number' ? score.dev.toFixed(2) : null}
            badge={score.dev_score}
            color={typeof score.dev === 'number' ? colorForDev(score.dev) : undefined}
          />
          <SubRow
            label="Liquidity"
            badge={score.liquidity || score.liquidity_score}
          />
          <SubRow
            label="Maturity"
            value={score.maturity}
            badge={score.maturity_score}
            color={typeof score.maturity === 'number' ? colorForMaturity(score.maturity) : undefined}
          />
          <SubRow label="Risk" badge={score.risk || score.risk_score} />
          <SubRow label="Tone" badge={score.tone || score.tone_score} />
          <SubRow label="Allocation" badge={score.allocation || score.allocation_score} />

          {/* Flag summary */}
          {score.flag_summary && (
            <div
              style={{
                background: BRAND.altRow,
                borderRadius: 4,
                padding: '6px 10px',
                marginTop: 8,
                fontSize: 10,
                color: BRAND.muted,
                lineHeight: 1.5,
              }}
            >
              {score.flag_summary}
            </div>
          )}
        </div>

        {/* EQUITY SNAPSHOT */}
        {equity && (
          <div style={sectionWrap}>
            <div style={sectionHeader}>Equity Snapshot</div>
            {/* Row 1: Price, 52wk Range, % Range, Volatility */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr 1fr 1fr', gap: 8, marginBottom: 8 }}>
              <div>
                <div style={{ fontSize: 8, textTransform: 'uppercase', letterSpacing: 0.8, color: BRAND.muted, fontWeight: 600, marginBottom: 2 }}>Price</div>
                <div style={{ fontFamily: mono, fontSize: 14, fontWeight: 700, color: BRAND.text }}>
                  ${typeof equity.close === 'number' ? equity.close.toFixed(2) : equity.close}
                </div>
              </div>
              <div>
                <div style={{ fontSize: 8, textTransform: 'uppercase', letterSpacing: 0.8, color: BRAND.muted, fontWeight: 600, marginBottom: 2 }}>52wk Range</div>
                <div style={{ fontFamily: mono, fontSize: 11, color: BRAND.text }}>
                  ${typeof equity.week_52_low === 'number' ? equity.week_52_low.toFixed(2) : equity.week_52_low} — ${typeof equity.week_52_high === 'number' ? equity.week_52_high.toFixed(2) : equity.week_52_high}
                </div>
                {equity.week_52_low != null && equity.week_52_high != null && equity.close != null && (
                  <div style={{ position: 'relative', height: 6, background: BRAND.border, borderRadius: 3, marginTop: 4 }}>
                    <div
                      style={{
                        position: 'absolute',
                        top: -1,
                        left: `${Math.min(100, Math.max(0, ((equity.close - equity.week_52_low) / (equity.week_52_high - equity.week_52_low)) * 100))}%`,
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        background: BRAND.white,
                        transform: 'translateX(-4px)',
                      }}
                    />
                  </div>
                )}
              </div>
              <div>
                <div style={{ fontSize: 8, textTransform: 'uppercase', letterSpacing: 0.8, color: BRAND.muted, fontWeight: 600, marginBottom: 2 }}>% of 52wk</div>
                <div style={{ fontFamily: mono, fontSize: 12, fontWeight: 700, color: BRAND.text }}>
                  {equity.pct_52w_range != null ? `${(equity.pct_52w_range * 100).toFixed(0)}%` : '—'}
                </div>
              </div>
              <div>
                <div style={{ fontSize: 8, textTransform: 'uppercase', letterSpacing: 0.8, color: BRAND.muted, fontWeight: 600, marginBottom: 2 }}>20d Vol</div>
                <div style={{ fontFamily: mono, fontSize: 12, fontWeight: 700, color: BRAND.text }}>
                  {equity.vol_20d != null ? `${(equity.vol_20d * 100).toFixed(1)}%` : '—'}
                </div>
              </div>
            </div>
            {/* Row 2: Returns */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
              {[
                ['1d Return', equity.return_1d],
                ['5d Return', equity.return_5d],
                ['20d Return', equity.return_20d],
              ].map(([label, val]) => (
                <div key={label} style={{ textAlign: 'center', background: BRAND.altRow, borderRadius: 4, padding: '6px 4px' }}>
                  <div style={{ fontSize: 8, textTransform: 'uppercase', letterSpacing: 0.8, color: BRAND.muted, fontWeight: 600, marginBottom: 2 }}>{label}</div>
                  <div style={{ fontFamily: mono, fontSize: 12, fontWeight: 700, color: returnColor(val) }}>
                    {formatReturn(val)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* SECTION 2: Credit Synthesis */}
        {synthesis && (
          <div style={sectionWrap}>
            <div style={sectionHeader}>Credit Synthesis</div>
            <div style={{ fontSize: 12, lineHeight: 1.6, color: BRAND.text, whiteSpace: 'pre-wrap' }}>
              {synthesis.synthesis_text || synthesis.narrative}
            </div>
            {synthesis.synthesis_date && (
              <div style={{ fontSize: 10, color: BRAND.muted, marginTop: 6 }}>
                {formatDate(synthesis.synthesis_date)}
              </div>
            )}
          </div>
        )}

        {/* SECTION 3: Business Profile */}
        {profile && (
          <div style={sectionWrap}>
            <div style={sectionHeader}>Business Profile</div>
            {profile.business_description && (
              <div style={{ fontSize: 11, lineHeight: 1.5, color: BRAND.text, marginBottom: 8 }}>
                {profile.business_description}
              </div>
            )}

            {/* BUSINESS MIX — Segment Revenue Split */}
            {(() => {
              const segments = tryParse(profile.segments);
              if (!segments?.length) return null;
              return (
                <div style={{ marginBottom: 10 }}>
                  <div style={{ fontSize: 9, fontWeight: 600, color: BRAND.muted, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 6 }}>
                    Segment Revenue Split
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {segments.map((seg, i) => {
                      const pct = seg.revenue_pct || 0;
                      return (
                        <div key={i}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                            <span style={{ fontSize: 11, color: BRAND.text, minWidth: expanded ? 140 : 100, flexShrink: 0 }}>{seg.name}</span>
                            <div style={{ flex: 1, position: 'relative', height: expanded ? 28 : 24, background: BRAND.altRow, borderRadius: 3, overflow: 'hidden', transition: 'height 0.25s ease' }}>
                              <div
                                style={{
                                  width: `${Math.min(100, pct)}%`,
                                  height: '100%',
                                  background: BRAND.sage,
                                  borderRadius: 3,
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'flex-end',
                                  paddingRight: 6,
                                  boxSizing: 'border-box',
                                  transition: 'width 0.3s ease',
                                }}
                              >
                                {pct > 12 && (
                                  <span style={{ fontFamily: mono, fontSize: 10, fontWeight: 700, color: '#fff' }}>
                                    {pct}%
                                  </span>
                                )}
                              </div>
                              {pct <= 12 && (
                                <span style={{ position: 'absolute', left: `${pct + 2}%`, top: '50%', transform: 'translateY(-50%)', fontFamily: mono, fontSize: 10, fontWeight: 700, color: BRAND.text }}>
                                  {pct}%
                                </span>
                              )}
                            </div>
                          </div>
                          {(seg.margin_profile || seg.cyclicality) && (
                            <div style={{ fontSize: 9, color: BRAND.muted, marginLeft: 108 }}>
                              {[
                                seg.margin_profile ? `Margin: ${seg.margin_profile}` : null,
                                seg.cyclicality ? `Cyclicality: ${seg.cyclicality}` : null,
                              ].filter(Boolean).join(' | ')}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })()}

            {/* BUSINESS MIX — Geographic Mix Bar */}
            {(() => {
              let geo = profile.geographic_mix;
              if (typeof geo === 'string') {
                try { geo = JSON.parse(geo); } catch { geo = null; }
              }
              if (!geo || typeof geo !== 'object') return null;
              const us = geo.us_pct || 0;
              const emerging = geo.emerging_markets_pct || 0;
              const intl = (geo.international_pct || 0) - emerging;
              const total = us + Math.max(0, intl) + emerging;
              if (total === 0) return null;
              const GEO_LAYERS = [
                { label: 'US', pct: us, color: BRAND.text },
                { label: 'International', pct: Math.max(0, intl), color: BRAND.sage },
                { label: 'Emerging Markets', pct: emerging, color: '#e67e22' },
              ].filter((g) => g.pct > 0);
              return (
                <div style={{ marginBottom: 10 }}>
                  <div style={{ fontSize: 9, fontWeight: 600, color: BRAND.muted, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 6 }}>
                    Geographic Mix
                  </div>
                  <div style={{ height: 24, borderRadius: 4, overflow: 'hidden', display: 'flex', marginBottom: 6 }}>
                    {GEO_LAYERS.map((g) => (
                      <div
                        key={g.label}
                        style={{
                          width: `${(g.pct / total) * 100}%`,
                          background: g.color,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: 8,
                          fontWeight: 700,
                          color: '#fff',
                          overflow: 'hidden',
                          whiteSpace: 'nowrap',
                          transition: 'width 0.3s ease',
                        }}
                      >
                        {(g.pct / total) * 100 > 18 ? `${g.pct}%` : ''}
                      </div>
                    ))}
                  </div>
                  <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                    {GEO_LAYERS.map((g) => (
                      <div key={g.label} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10 }}>
                        <div style={{ width: 10, height: 10, borderRadius: 2, background: g.color }} />
                        <span style={{ color: BRAND.muted }}>{g.label}</span>
                        <span style={{ fontFamily: mono, color: BRAND.text }}>{g.pct}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4 }}>
              {[
                ['Commodity Exposure', profile.commodity_exposure],
                ['Capex Intensity', profile.capex_intensity],
                ['Cyclicality', profile.business_cyclicality],
                ['Competitive Position', profile.competitive_position],
              ]
                .filter(([, v]) => v != null)
                .map(([label, val]) => (
                  <div key={label} style={{ fontSize: 10, padding: '2px 0' }}>
                    <span style={{ color: BRAND.muted, fontWeight: 600 }}>{label}: </span>
                    <span style={{ color: BRAND.text }}>{val}</span>
                  </div>
                ))}
            </div>
            {(() => {
              const markets = tryParse(profile.end_markets);
              if (!markets?.length) return null;
              return (
                <div style={{ fontSize: 10, marginTop: 6 }}>
                  <span style={{ color: BRAND.muted, fontWeight: 600 }}>End Markets: </span>
                  <span style={{ color: BRAND.text }}>
                    {markets.map((m) => (typeof m === 'string' ? m : m.name || m.market)).join(', ')}
                  </span>
                </div>
              );
            })()}
          </div>
        )}

        {/* SECTION 4: Capital Structure */}
        {capStruct && (
          <div style={sectionWrap}>
            <div style={sectionHeader}>Capital Structure</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 10 }}>
              <MiniStat label="Total Debt" value={capStruct.total_debt != null ? `$${capStruct.total_debt}M` : null} />
              <MiniStat label="Net Debt" value={capStruct.net_debt != null ? `$${capStruct.net_debt}M` : null} />
              <MiniStat label="LTM EBITDA" value={capStruct.ltm_ebitda != null ? `$${capStruct.ltm_ebitda}M` : null} />
              <MiniStat label="Net Leverage" value={capStruct.net_leverage != null ? `${capStruct.net_leverage}x` : null} />
              <MiniStat label="Gross Leverage" value={capStruct.gross_leverage != null ? `${capStruct.gross_leverage}x` : null} />
              <MiniStat label="Int. Coverage" value={capStruct.interest_coverage != null ? `${capStruct.interest_coverage}x` : null} />
            </div>
            {(capStruct.nearest_maturity_year || capStruct.nearest_maturity_amount) && (
              <div style={{ fontSize: 10, marginBottom: 4 }}>
                <span style={{ color: BRAND.muted, fontWeight: 600 }}>Nearest Maturity: </span>
                <span style={{ fontFamily: mono, color: BRAND.text }}>
                  {capStruct.nearest_maturity_year}{capStruct.nearest_maturity_amount != null ? ` — $${capStruct.nearest_maturity_amount}M` : ''}
                </span>
              </div>
            )}
            {capStruct.liquidity_assessment && (
              <div style={{ fontSize: 10, marginBottom: 4 }}>
                <span style={{ color: BRAND.muted, fontWeight: 600 }}>Liquidity: </span>
                <span style={{ color: BRAND.text }}>{capStruct.liquidity_assessment}</span>
              </div>
            )}
            {(() => {
              const tranches = tryParse(capStruct.debt_tranches);
              if (!tranches?.length) return null;
              return (
                <div style={{ marginTop: 6 }}>
                  <div style={{ fontSize: 9, fontWeight: 600, color: BRAND.muted, textTransform: 'uppercase', marginBottom: 4 }}>
                    Debt Tranches
                  </div>
                  {tranches.map((t, i) => (
                    <div
                      key={i}
                      style={{
                        fontSize: 10,
                        padding: '2px 0',
                        borderBottom: i < tranches.length - 1 ? `1px solid ${BRAND.border}` : 'none',
                        display: 'flex',
                        justifyContent: 'space-between',
                        color: BRAND.text,
                      }}
                    >
                      <span>{t.description || t.name || t.type}</span>
                      <span style={{ fontFamily: mono }}>
                        {t.amount != null ? `$${t.amount}M` : ''} {t.maturity || t.year || ''}
                      </span>
                    </div>
                  ))}
                </div>
              );
            })()}
          </div>
        )}

        {/* LIQUIDITY VISUAL */}
        {capStruct && (capStruct.cash_and_equivalents != null || capStruct.revolver_capacity != null) && (() => {
          const cash = capStruct.cash_and_equivalents || 0;
          const revolverCap = capStruct.revolver_capacity || 0;
          const revolverDrawn = capStruct.revolver_drawn || 0;
          const availRevolver = Math.max(0, revolverCap - revolverDrawn);
          const totalLiq = cash + availRevolver;
          const total = cash + availRevolver + revolverDrawn;

          return (
            <div style={sectionWrap}>
              <div style={sectionHeader}>Liquidity</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 10 }}>
                <MiniStat label="Cash" value={`$${Math.round(cash)}M`} />
                <MiniStat label="Avail. Revolver" value={`$${Math.round(availRevolver)}M`} />
                <MiniStat label="Total Liquidity" value={`$${Math.round(totalLiq)}M`} />
              </div>

              {/* Stacked bar */}
              {total > 0 && (
                <div style={{ position: 'relative', height: 20, borderRadius: 4, overflow: 'hidden', display: 'flex', marginBottom: 6 }}>
                  {cash > 0 && (
                    <div
                      style={{
                        width: `${(cash / total) * 100}%`,
                        background: SCORE_COLORS.green,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 8,
                        fontWeight: 700,
                        color: '#fff',
                        overflow: 'hidden',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {(cash / total) * 100 > 15 ? 'Cash' : ''}
                    </div>
                  )}
                  {availRevolver > 0 && (
                    <div
                      style={{
                        width: `${(availRevolver / total) * 100}%`,
                        background: '#2196f3',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 8,
                        fontWeight: 700,
                        color: '#fff',
                        overflow: 'hidden',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {(availRevolver / total) * 100 > 15 ? 'Revolver' : ''}
                    </div>
                  )}
                  {revolverDrawn > 0 && (
                    <div
                      style={{
                        width: `${(revolverDrawn / total) * 100}%`,
                        background: '#555',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 8,
                        fontWeight: 700,
                        color: '#fff',
                        overflow: 'hidden',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {(revolverDrawn / total) * 100 > 15 ? 'Drawn' : ''}
                    </div>
                  )}
                </div>
              )}

              {capStruct.liquidity_assessment && (
                <span
                  style={{
                    display: 'inline-block',
                    fontSize: 9,
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    borderRadius: 9999,
                    padding: '2px 8px',
                    background: liqBadgeColor(capStruct.liquidity_assessment),
                    color: '#fff',
                  }}
                >
                  {capStruct.liquidity_assessment}
                </span>
              )}
            </div>
          );
        })()}

        {/* COVENANT SUMMARY */}
        {(() => {
          const covenants = tryParse(capStruct?.covenant_mentions);
          if (!covenants?.length) return null;
          return (
            <div style={sectionWrap}>
              <div style={sectionHeader}>Covenant Summary</div>
              <ol style={{ margin: 0, paddingLeft: 18, fontSize: 11, lineHeight: 1.5, color: BRAND.text }}>
                {covenants.map((c, i) => (
                  <li key={i} style={{ marginBottom: 2 }}>
                    {typeof c === 'string' ? c : c.description || c.text || JSON.stringify(c)}
                  </li>
                ))}
              </ol>
            </div>
          );
        })()}

        {/* DEBT MATURITY SCHEDULE */}
        {(() => {
          const tranches = tryParse(capStruct?.debt_tranches);
          if (!tranches?.length) return null;
          const byYear = {};
          tranches.forEach((t) => {
            const yr = t.maturity_year || t.maturity || t.year;
            if (!yr) return;
            const year = typeof yr === 'number' ? yr : parseInt(yr);
            if (isNaN(year)) return;
            byYear[year] = (byYear[year] || 0) + (t.amount_mm || t.amount || 0);
          });
          const years = Object.keys(byYear).map(Number).sort();
          if (!years.length) return null;
          const maxVal = Math.max(...years.map((y) => byYear[y]));
          const currentYear = new Date().getFullYear();
          const chartH = 160;
          return (
            <div style={sectionWrap}>
              <div style={sectionHeader}>Debt Maturity Schedule</div>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: expanded ? 12 : 8, height: chartH, paddingTop: 18 }}>
                {years.map((yr) => {
                  const amt = byYear[yr];
                  const barH = maxVal > 0 ? (amt / maxVal) * (chartH - 30) : 0;
                  const isNearTerm = yr <= currentYear + 1;
                  const barW = expanded ? 60 : 40;
                  return (
                    <div key={yr} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: `0 0 ${barW}px` }}>
                      <span style={{ fontFamily: mono, fontSize: 10, color: BRAND.text, marginBottom: 2 }}>
                        {formatLargeNumber(amt)}
                      </span>
                      <div
                        style={{
                          width: barW,
                          height: barH,
                          background: isNearTerm ? 'rgba(192,57,43,0.8)' : BRAND.sage,
                          borderRadius: '4px 4px 0 0',
                          transition: 'height 0.3s ease',
                        }}
                      />
                      <span style={{ fontFamily: mono, fontSize: 10, color: BRAND.muted, marginTop: 4 }}>
                        {yr}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })()}

        {/* CAPITAL STRUCTURE WATERFALL */}
        {(() => {
          const tranches = tryParse(capStruct?.debt_tranches);
          const hasBreakdown = tranches?.length > 0;
          const totalDebt = capStruct?.total_debt || 0;
          if (!totalDebt && !hasBreakdown) return null;

          if (!hasBreakdown) {
            const securedDebt = capStruct?.secured_debt || 0;
            const unsecuredDebt = capStruct?.unsecured_debt || 0;
            if (!securedDebt && !unsecuredDebt) {
              return (
                <div style={sectionWrap}>
                  <div style={sectionHeader}>Capital Structure</div>
                  <div style={{ height: expanded ? 40 : 32, borderRadius: 4, overflow: 'hidden', background: BRAND.navy, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 8, transition: 'height 0.25s ease' }}>
                    <span style={{ fontSize: 9, fontWeight: 700, color: '#fff' }}>Total Debt (breakdown not available)</span>
                  </div>
                  <div style={{ fontSize: 11, fontFamily: mono, color: BRAND.text, textAlign: 'center' }}>
                    {formatLargeNumber(totalDebt)}
                  </div>
                </div>
              );
            }
          }

          const layers = { secured: 0, senior_unsecured: 0, other: 0 };
          if (hasBreakdown) {
            tranches.forEach((t) => {
              const sen = (t.seniority || t.type || '').toLowerCase();
              const amt = t.amount_mm || t.amount || 0;
              if (sen.includes('secured') && !sen.includes('unsecured')) layers.secured += amt;
              else if (sen.includes('unsecured') || sen.includes('senior')) layers.senior_unsecured += amt;
              else layers.other += amt;
            });
          } else {
            layers.secured = capStruct?.secured_debt || 0;
            layers.senior_unsecured = capStruct?.unsecured_debt || 0;
          }

          const layerTotal = layers.secured + layers.senior_unsecured + layers.other;
          if (layerTotal === 0) return null;

          const LAYER_CONFIG = [
            { key: 'secured', label: 'Secured Debt', color: BRAND.text },
            { key: 'senior_unsecured', label: 'Unsecured Debt', color: BRAND.sage },
            { key: 'other', label: 'Other Debt', color: BRAND.muted },
          ];
          const activeLayers = LAYER_CONFIG.filter((l) => layers[l.key] > 0);

          return (
            <div style={sectionWrap}>
              <div style={sectionHeader}>Capital Structure</div>
              {/* Stacked horizontal bar */}
              <div style={{ height: expanded ? 40 : 32, borderRadius: 4, overflow: 'hidden', display: 'flex', marginBottom: 8, transition: 'height 0.25s ease' }}>
                {activeLayers.map((l) => (
                  <div
                    key={l.key}
                    style={{
                      width: `${(layers[l.key] / layerTotal) * 100}%`,
                      background: l.color,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 8,
                      fontWeight: 700,
                      color: '#fff',
                      overflow: 'hidden',
                      whiteSpace: 'nowrap',
                      transition: 'width 0.3s ease',
                    }}
                  >
                    {(layers[l.key] / layerTotal) * 100 > 20 ? l.label : ''}
                  </div>
                ))}
              </div>
              {/* Legend */}
              <div style={{ display: 'flex', gap: 14, marginBottom: 10, flexWrap: 'wrap' }}>
                {activeLayers.map((l) => (
                  <div key={l.key} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10 }}>
                    <div style={{ width: 10, height: 10, borderRadius: 2, background: l.color }} />
                    <span style={{ color: BRAND.muted }}>{l.label}</span>
                    <span style={{ fontFamily: mono, color: BRAND.text }}>{formatLargeNumber(layers[l.key])}</span>
                  </div>
                ))}
              </div>
              {/* Breakdown table */}
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                <thead>
                  <tr>
                    {['Layer', 'Amount', '% of Total'].map((h) => (
                      <th key={h} style={{ textAlign: h === 'Layer' ? 'left' : 'right', padding: '3px 6px', fontSize: 9, fontWeight: 600, color: BRAND.muted, textTransform: 'uppercase', borderBottom: `1px solid ${BRAND.border}` }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {activeLayers.map((l) => (
                    <tr key={l.key}>
                      <td style={{ padding: '4px 6px', borderLeft: `3px solid ${l.color}`, color: BRAND.text }}>
                        {l.label}
                      </td>
                      <td style={{ padding: '4px 6px', textAlign: 'right', fontFamily: mono, color: BRAND.text }}>
                        {formatLargeNumber(layers[l.key])}
                      </td>
                      <td style={{ padding: '4px 6px', textAlign: 'right', fontFamily: mono, color: BRAND.muted }}>
                        {(layers[l.key] / layerTotal * 100).toFixed(0)}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        })()}

        {/* SECTION 5: Transcript Signals */}
        {transcript && (
          <div style={sectionWrap}>
            <div style={sectionHeader}>Transcript Signals</div>
            {[
              ['Management Tone', transcript.management_tone],
              ['Guidance Direction', transcript.guidance_direction],
              ['Key Themes', transcript.key_themes],
              ['Capital Allocation', transcript.capital_allocation_policy],
            ]
              .filter(([, v]) => v != null)
              .map(([label, val]) => (
                <div key={label} style={{ fontSize: 11, padding: '3px 0', lineHeight: 1.5 }}>
                  <span style={{ color: BRAND.muted, fontWeight: 600 }}>{label}: </span>
                  <span style={{ color: BRAND.text }}>
                    {Array.isArray(val) ? val.join(', ') : val}
                  </span>
                </div>
              ))}
            {transcript.credit_relevant_summary && (
              <div style={{ fontSize: 11, lineHeight: 1.5, color: BRAND.text, marginTop: 6, whiteSpace: 'pre-wrap' }}>
                {transcript.credit_relevant_summary}
              </div>
            )}
          </div>
        )}

        {/* SECTION 6: Equity Flags */}
        {flags.length > 0 && (
          <div style={sectionWrap}>
            <div style={sectionHeader}>Equity Flags</div>
            {flags.map((f, i) => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 6,
                  padding: '4px 0',
                  borderBottom: i < flags.length - 1 ? `1px solid ${BRAND.border}` : 'none',
                }}
              >
                <SeverityDot severity={f.severity || 'medium'} />
                <div style={{ fontSize: 11, color: BRAND.text, lineHeight: 1.4 }}>
                  <span style={{ fontWeight: 600 }}>{f.flag_type}</span>
                  {f.peer_group_context && (
                    <span style={{ color: BRAND.muted }}> — {f.peer_group_context}</span>
                  )}
                  {f.date && (
                    <span style={{ fontFamily: mono, fontSize: 10, color: BRAND.muted, marginLeft: 6 }}>
                      {formatDate(f.date)}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* SECTION 7: Macro Connections */}
        {connections.length > 0 && (
          <div style={sectionWrap}>
            <div style={sectionHeader}>Macro Connections</div>
            {connections.map((c, i) => {
              const isConvergent = (c.equity_convergence || '').toLowerCase().includes('convergent');
              return (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '4px 0',
                    borderBottom: i < connections.length - 1 ? `1px solid ${BRAND.border}` : 'none',
                    flexWrap: 'wrap',
                  }}
                >
                  <SeverityDot severity={c.severity || 'medium'} />
                  <span
                    style={{
                      fontSize: 9,
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      borderRadius: 3,
                      padding: '1px 6px',
                      background: isConvergent ? 'rgba(192,57,43,0.12)' : 'rgba(16,44,66,0.08)',
                      color: isConvergent ? SCORE_COLORS.red : BRAND.text,
                      border: isConvergent ? '1px solid rgba(192,57,43,0.3)' : `1px solid ${BRAND.border}`,
                    }}
                  >
                    {c.equity_convergence || 'N/A'}
                  </span>
                  <span style={{ fontSize: 11, color: BRAND.text }}>
                    {c.dominant_driver}
                  </span>
                </div>
              );
            })}
          </div>
        )}

        {/* SECTION 8: Catalysts */}
        {catalysts.length > 0 && (
          <div style={{ ...sectionWrap, borderBottom: 'none' }}>
            <div style={sectionHeader}>Catalysts</div>
            {catalysts.map((c, i) => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 6,
                  padding: '4px 0',
                  borderBottom: i < catalysts.length - 1 ? `1px solid ${BRAND.border}` : 'none',
                }}
              >
                {c.date && (
                  <span style={{ fontFamily: mono, fontSize: 10, color: BRAND.muted, minWidth: 44 }}>
                    {formatDate(c.date)}
                  </span>
                )}
                <SeverityDot severity={c.urgency || 'low'} />
                <span style={{ fontSize: 11, color: BRAND.text, lineHeight: 1.4 }}>
                  {c.description}
                </span>
              </div>
            ))}
          </div>
        )}
        </div>
        )}
      </div>
    </>
  );
}
