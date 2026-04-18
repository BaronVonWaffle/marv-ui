import { useMemo, useState } from 'react';
import { BRAND } from '../utils/colors';

const sans = 'Arial, sans-serif';

const SECTIONS = [
  {
    title: 'Two-Axis Credit Scoring Framework',
    body: `Every name receives two independent axis scores that combine into a composite signal.

Axis 1 — Quantitative: Fundamental metrics, Debt/EV, and Maturity profile scored against ML Industry Level 3 peers.

Axis 2 — Qualitative: Liquidity, Risk Factors, Management Tone, and Capital Allocation scored from SEC filings and earnings transcripts via Claude extraction.

Composite Logic:
• RED — Either axis is red, OR both axes are yellow with 2+ red sub-scores
• YELLOW — Any sub-score is yellow, no axis is red
• GREEN — Both axes are green`,
  },
  {
    title: 'Quantitative Score (Axis 1)',
    body: `Three sub-scores combine into the quantitative axis.

Fundamental Score (METRIC_REGISTRY weights):
• Leverage — 30%
• Coverage — 25%
• Profitability — 20%
• Equity Warning — 15%
• Default Risk — 10%
All metrics computed as z-scores vs ML Industry Level 3 peer group medians.

Debt/EV:
Total debt divided by enterprise value. Thresholds calibrated per peer group and IG/HY tier. Higher D/EV indicates greater credit stress relative to market capitalization.

Maturity Profile:
• RED — Nearest maturity ≤ 1 year
• YELLOW — Nearest maturity ≤ 2 years
• GREEN — Nearest maturity > 2 years`,
  },
  {
    title: 'Qualitative Score (Axis 2)',
    body: `Four sub-scores derived from SEC filings and earnings transcripts via Claude structured extraction.

Liquidity:
Cash position plus undrawn revolver capacity. Assessed against near-term obligations and operational burn rate.

Risk Factors:
Severity and escalation of risk factors disclosed in 10-K filings. Tracks quarter-over-quarter changes in risk language intensity.

Tone:
Management tone and guidance direction extracted from earnings call transcripts. Captures forward-looking sentiment, hedging language, and confidence signals.

Capital Allocation:
Bondholder-friendliness assessment of capex plans, M&A activity, dividend policy, and share repurchase programs. Debt-funded acquisitions and shareholder-first policies score negatively.`,
  },
  {
    title: 'Equity Monitoring & Flags',
    body: `Daily peer-relative equity z-scores computed at 1-day, 5-day, and 20-day windows.

Flag Types:
• Outperform — z-score > +1.5 vs peer group
• Underperform — z-score < -1.5 vs peer group
• Sustained Decline — 20-day return < -10%
• Absolute Drop — 1-day return < -3%

Convergence Analysis:
Equity flags are cross-referenced against active macro connections to determine signal quality.
• Convergent — Equity move confirms an active macro driver (highest conviction)
• Unexplained — Equity move with no mapped macro driver (potential driver gap, requires investigation)`,
  },
  {
    title: 'Macro-to-Name Connection Engine',
    body: `Maps sector-level macro events to individual issuers using structured extraction data including commodity exposure percentages, cost pass-through ability, and contract structures.

Each connection includes:
• Market driver (e.g., "HRC Steel +8.2%")
• Transmission mechanism (e.g., "40% raw material cost, 60-day lag, partial pass-through")
• Estimated P&L impact direction and magnitude

Severity Levels: HIGH / MEDIUM / LOW

Convergence Status:
• CONVERGENT — Macro driver and equity signal align, reinforcing the thesis
• AHEAD_OF_MARKET — Macro driver identified before equity reaction
• DIVERGENT — Macro driver suggests one direction, equity moves opposite (potential opportunity or model error)`,
  },
  {
    title: 'Morning Brief',
    body: `Opus-generated 300-600 word narrative synthesizing overnight developments for each coverage sector.

Inputs:
• Active macro-to-name connections and severity changes
• New or escalated equity flags
• Scoring changes (composite, axis, or sub-score moves)
• Identified driver gaps (equity moves without macro explanation)
• Upcoming catalysts within 5 business days

Quiet-Day Logic:
When no material developments are detected, a shortened note is produced confirming stability and highlighting the next expected catalyst.

Delivery: 6:30 AM ET via formatted HTML email to coverage team distribution list.`,
  },
  {
    title: 'Data Sources',
    body: `SEC Filings — sec-api.io (10-K, 10-Q, 8-K full text and exhibit retrieval)

Financials — Financial Modeling Prep Ultimate tier (/stable/ endpoints for income statement, balance sheet, cash flow, ratios, enterprise value)

Extraction — Claude Sonnet 4 with structured JSON schemas for liquidity, risk factors, tone, and capital allocation

Brief Generation — Claude Opus for narrative synthesis and morning brief composition

Equity Prices — FMP daily and intraday quotes, peer group relative performance

News & Events — Anthropic web search tool for real-time event detection and catalyst monitoring`,
  },
  {
    title: 'Cost Structure',
    body: `Daily Operations (~$2.50-3.50/day):
• Equity price pulls and peer z-score computation
• News and event scanning
• Macro-to-name connection updates
• Morning brief generation

Twice-Weekly:
• Catalyst calendar refresh and urgency re-scoring

Weekly:
• Full quantitative scoring refresh (fundamental z-scores, D/EV, maturity)

Monthly:
• SEC filing extraction cycle (new 10-K/10-Q processing)

Monday Full Refresh (~$6-8):
• Complete pipeline re-run including all scoring axes, connection re-mapping, and brief generation with weekly context window`,
  },
];

export default function Methodology({ data }) {
  const [openIndex, setOpenIndex] = useState(0);

  const v2Coverage = useMemo(() => {
    const v1 = data?.scores || [];
    const v2 = data?.fundamental_scores_v2 || [];
    const v2Set = new Set();
    for (const r of v2) if (r?.ticker) v2Set.add(r.ticker);
    let missing = 0;
    for (const r of v1) if (r?.ticker && !v2Set.has(r.ticker)) missing += 1;
    return { missing, total: v1.length };
  }, [data]);

  const allSections = useMemo(() => {
    const v2Body = (
      `V2 Coverage. The V2 fundamental score requires the FMP-safe factor set across 5 buckets: ` +
      `Leverage, Market Risk, Cash Flow, Profitability, Default Risk. Tickers missing required factor ` +
      `data fall back to V1 composite scoring. Currently ${v2Coverage.missing} of ${v2Coverage.total} ` +
      `names are on V1 fallback.\n\n` +
      `V2 uses geometric aggregation with forced 20/55/25 Green/Yellow/Red distribution. V1 used additive ` +
      `weighted averaging without forced distribution. V2 coverage expands as factor completeness improves upstream.`
    );
    return [
      ...SECTIONS,
      { title: 'V2 Coverage', body: v2Body, anchorId: 'v2-coverage' },
    ];
  }, [v2Coverage]);

  function toggle(i) {
    setOpenIndex(openIndex === i ? -1 : i);
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {allSections.map((section, i) => {
        const open = openIndex === i;
        return (
          <div
            key={i}
            id={section.anchorId || undefined}
            style={{ background: BRAND.card, border: `1px solid ${BRAND.border}`, borderRadius: 5, overflow: 'hidden' }}
          >
            <div
              onClick={() => toggle(i)}
              style={{
                background: BRAND.navyDark,
                color: BRAND.gold,
                fontFamily: sans,
                fontSize: 12,
                fontWeight: 700,
                padding: '9px 14px',
                cursor: 'pointer',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                userSelect: 'none',
              }}
            >
              {section.title}
              <span style={{ fontSize: 10, opacity: 0.7 }}>{open ? '▲' : '▼'}</span>
            </div>
            {open && (
              <div style={{ padding: '12px 14px', fontFamily: sans, fontSize: 12, lineHeight: 1.6, color: BRAND.text, whiteSpace: 'pre-wrap' }}>
                {section.body}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
