import { useState } from 'react';
import { BRAND, SCORE_COLORS } from '../utils/colors';
import renderMarkdown from '../utils/markdownLite.jsx';

const sans = 'Arial, sans-serif';
const mono = "'JetBrains Mono', monospace";

// -----------------------------------------------------------------------
// AnalystTeamBlock — drops into IssuerDetail right under the ticker header.
//
// Layout: single column when the panel is collapsed (~520px); 2-column
// (main + right sidebar) when the panel is expanded (~900px). The
// sidebar holds analyst_notes_sidebar + any read_through_notes targeting
// this ticker — charter §4.1 + user spec explicitly ask for these in a
// right column, not inline.
//
// Section order (main column, per charter §4.1):
//   1. [Callout]  vs_house_view  (special — dissent flagged visually)
//   2. credit_view
//   3. what_changed_this_week
//   4. thesis
//   5. key_risks
//   6. catalyst_calendar
//   7. capital_structure_snapshot
//   8. recent_news_take
//   9. peer_relval_context
// Then: earnings updates (accumulating, collapsible per quarter)
// Then: story arc reviews (accumulating, collapsible per review)
//
// Sidebar: analyst_notes_sidebar section + read_through_notes filtered to
// target_ticker = current ticker.
// -----------------------------------------------------------------------

// Per-analyst color stripe matching ActivityFeed convention.
const ANALYST_COLORS = {
  'T.W.': '#c8a44e',
  'A.V.': '#5eb4a9',
  'J.R.': '#5294d0',
  'S.K.': '#a48dc8',
};

const SECTION_LABELS = {
  credit_view: 'Credit View',
  what_changed_this_week: 'What Changed This Week',
  thesis: 'Thesis',
  key_risks: 'Key Risks',
  catalyst_calendar: 'Catalyst Calendar',
  capital_structure_snapshot: 'Capital Structure Snapshot',
  recent_news_take: 'Recent News + Analyst Take',
  peer_relval_context: 'Peer / Rel-Val Context',
  analyst_notes_sidebar: 'Analyst Notes',
};

const MAIN_SECTION_ORDER = [
  'credit_view',
  'what_changed_this_week',
  'thesis',
  'key_risks',
  'catalyst_calendar',
  'capital_structure_snapshot',
  'recent_news_take',
  'peer_relval_context',
];

function formatDate(tsStr) {
  if (!tsStr) return null;
  const iso = tsStr.includes('T') ? tsStr : tsStr.replace(' ', 'T');
  const d = new Date(iso);
  if (isNaN(d)) return null;
  const month = d.toLocaleString('en-US', { month: 'short' });
  const day = d.getDate();
  const year = d.getFullYear();
  return `${month} ${day}, ${year}`;
}

function detectDissent(vsHouseViewMd) {
  if (!vsHouseViewMd) return null;
  const head = vsHouseViewMd.slice(0, 300).toLowerCase();
  const m_d = head.search(/\bdissents?\b/);
  const m_c = head.search(/\bconcurs?\b/);
  const m_w = head.search(/\bwatching\b/);
  const candidates = [
    m_d >= 0 ? { idx: m_d, pos: 'dissent' } : null,
    m_c >= 0 ? { idx: m_c, pos: 'concur' } : null,
    m_w >= 0 ? { idx: m_w, pos: 'watching' } : null,
  ].filter(Boolean).sort((a, b) => a.idx - b.idx);
  return candidates[0]?.pos || null;
}

// -----------------------------------------------------------------------
// Regime banner — passive read of T.W.'s House View. At the very top of
// the Issuer Detail page, always present when house_view is populated.
// -----------------------------------------------------------------------

function RegimeBanner({ houseView }) {
  if (!houseView) return null;
  const published = formatDate(houseView.published_at);

  // Extract first sentence of positioning_md for the one-line summary.
  let summary = '';
  const body = houseView.positioning_md || '';
  const firstPeriod = body.indexOf('. ');
  if (firstPeriod > 0) {
    summary = body.slice(0, firstPeriod + 1);
  } else if (body) {
    summary = body.slice(0, 140) + (body.length > 140 ? '…' : '');
  }

  return (
    <div
      style={{
        background: BRAND.altRow,
        borderLeft: `3px solid ${BRAND.gold}`,
        borderRadius: 3,
        padding: '9px 12px',
        marginBottom: 12,
        fontFamily: sans,
      }}
    >
      <div
        style={{
          fontSize: 9,
          color: BRAND.gold,
          textTransform: 'uppercase',
          letterSpacing: 1,
          fontWeight: 700,
          marginBottom: 3,
        }}
      >
        Macro Regime · T.W. as of {published || '—'}
      </div>
      <div style={{ fontSize: 11.5, color: BRAND.text, lineHeight: 1.5 }}>
        <strong style={{ color: BRAND.text, fontWeight: 700 }}>
          {houseView.regime || '—'}
        </strong>
        <span style={{ color: BRAND.muted }}> · </span>
        <span style={{ color: BRAND.textSecondary }}>
          {houseView.conviction || '—'} conviction
        </span>
        {summary && (
          <>
            <span style={{ color: BRAND.muted }}> — </span>
            <span style={{ color: BRAND.textSecondary, fontSize: 11 }}>
              {summary}
            </span>
          </>
        )}
      </div>
    </div>
  );
}

// -----------------------------------------------------------------------
// vs-House-View callout — the sector analyst's per-name position. Dissent
// is visually flagged with amber left border + "DISSENT" badge.
// -----------------------------------------------------------------------

function VsHouseViewCallout({ section }) {
  if (!section || !section.content_md) return null;
  const position = detectDissent(section.content_md);
  const isDissent = position === 'dissent';
  const analyst = section.last_updated_by;
  const accent = isDissent ? BRAND.gold : (ANALYST_COLORS[analyst] || BRAND.sage);

  return (
    <div
      style={{
        background: BRAND.altRow,
        borderLeft: `3px solid ${accent}`,
        borderRadius: 3,
        padding: '10px 12px',
        marginBottom: 14,
        fontFamily: sans,
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          marginBottom: 6,
        }}
      >
        <span
          style={{
            fontSize: 9,
            color: accent,
            textTransform: 'uppercase',
            letterSpacing: 1,
            fontWeight: 700,
          }}
        >
          vs. House View · {analyst || 'Sector analyst'}
        </span>
        {isDissent && (
          <span
            style={{
              fontFamily: mono,
              fontSize: 9,
              color: BRAND.card,
              background: BRAND.gold,
              padding: '1px 6px',
              borderRadius: 2,
              letterSpacing: 0.6,
              fontWeight: 700,
            }}
          >
            DISSENT
          </span>
        )}
      </div>
      <div style={{ fontSize: 11.5, color: BRAND.text, lineHeight: 1.55 }}>
        {renderMarkdown(section.content_md, { paraSize: 11.5, bulletSize: 11 })}
      </div>
    </div>
  );
}

// -----------------------------------------------------------------------
// AnalystSection — renders a single issuer_detail section with title,
// markdown body, and attribution footer.
// -----------------------------------------------------------------------

function AnalystSection({ sectionName, section }) {
  if (!section || !section.content_md) return null;
  const title = SECTION_LABELS[sectionName] || sectionName;
  const analyst = section.last_updated_by;
  const updated = formatDate(section.last_updated);

  return (
    <div
      style={{
        padding: '14px 0',
        borderBottom: `1px solid ${BRAND.border}`,
      }}
    >
      <div
        style={{
          fontSize: 10,
          fontWeight: 700,
          fontFamily: sans,
          textTransform: 'uppercase',
          color: BRAND.gold,
          letterSpacing: 1.1,
          marginBottom: 8,
        }}
      >
        {title}
      </div>
      <div>{renderMarkdown(section.content_md, { paraSize: 11.5, bulletSize: 11 })}</div>
      <div
        style={{
          fontFamily: mono,
          fontSize: 9,
          color: BRAND.muted,
          marginTop: 4,
          letterSpacing: 0.3,
        }}
      >
        Updated by {analyst || '—'} {updated ? `· ${updated}` : ''}
        {section.version_id > 1 ? ` · v${section.version_id}` : ''}
      </div>
    </div>
  );
}

// -----------------------------------------------------------------------
// EarningsUpdatesBlock — accumulating list, newest on top. Each quarter
// collapses/expands independently. Shows 4-section content + vs-last-
// quarter delta + chat blurb.
// -----------------------------------------------------------------------

function EarningsUpdateCard({ update, defaultOpen }) {
  const [open, setOpen] = useState(defaultOpen);
  const analyst = update.analyst_initials;
  const published = formatDate(update.published_at);
  const header = `Q${update.quarter} ${update.year} — print ${published || '—'}`;

  return (
    <div
      style={{
        borderLeft: `3px solid ${ANALYST_COLORS[analyst] || BRAND.sage}`,
        background: BRAND.altRow,
        borderRadius: 3,
        marginBottom: 8,
        overflow: 'hidden',
      }}
    >
      <button
        onClick={() => setOpen(!open)}
        style={{
          all: 'unset',
          cursor: 'pointer',
          width: '100%',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '8px 12px',
          boxSizing: 'border-box',
          fontFamily: sans,
        }}
      >
        <span style={{ fontSize: 11, color: BRAND.text, fontWeight: 600 }}>
          {header}
          <span style={{ color: BRAND.muted, fontWeight: 400, marginLeft: 8 }}>
            · {analyst}
          </span>
        </span>
        <span style={{ color: BRAND.muted, fontSize: 11, fontFamily: mono }}>
          {open ? '−' : '+'}
        </span>
      </button>
      {open && (
        <div style={{ padding: '0 14px 12px 14px' }}>
          {update.section_1_print_summary_md && (
            <div style={{ marginTop: 8 }}>
              {renderMarkdown(update.section_1_print_summary_md, { paraSize: 11, bulletSize: 10.5 })}
            </div>
          )}
          {update.section_2_thesis_check_md && (
            <div style={{ marginTop: 4 }}>
              {renderMarkdown(update.section_2_thesis_check_md, { paraSize: 11, bulletSize: 10.5 })}
            </div>
          )}
          {update.section_3_capital_structure_check_md && (
            <div style={{ marginTop: 4 }}>
              {renderMarkdown(update.section_3_capital_structure_check_md, { paraSize: 11, bulletSize: 10.5 })}
            </div>
          )}
          {update.section_4_forward_view_md && (
            <div style={{ marginTop: 4 }}>
              {renderMarkdown(update.section_4_forward_view_md, { paraSize: 11, bulletSize: 10.5 })}
            </div>
          )}

          {update.prior_quarter_delta_md && (
            <div
              style={{
                marginTop: 10,
                padding: '8px 10px',
                background: BRAND.card,
                borderRadius: 3,
                border: `1px solid ${BRAND.border}`,
              }}
            >
              <div
                style={{
                  fontSize: 9,
                  color: BRAND.gold,
                  textTransform: 'uppercase',
                  letterSpacing: 1,
                  fontWeight: 700,
                  marginBottom: 4,
                  fontFamily: sans,
                }}
              >
                vs. Last Quarter Delta
              </div>
              {renderMarkdown(update.prior_quarter_delta_md, { paraSize: 10.5, bulletSize: 10.5 })}
            </div>
          )}

          {update.chat_blurb_text && (
            <div
              style={{
                marginTop: 10,
                padding: '8px 10px',
                background: BRAND.card,
                borderRadius: 3,
                border: `1px dashed ${BRAND.border}`,
                fontFamily: mono,
                fontSize: 10.5,
                color: BRAND.textSecondary,
                lineHeight: 1.55,
                whiteSpace: 'pre-wrap',
              }}
            >
              <div
                style={{
                  fontSize: 9,
                  color: BRAND.gold,
                  textTransform: 'uppercase',
                  letterSpacing: 1,
                  fontWeight: 700,
                  marginBottom: 4,
                  fontFamily: sans,
                }}
              >
                Chat blurb
              </div>
              {update.chat_blurb_text}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function EarningsUpdatesBlock({ updates }) {
  if (!Array.isArray(updates) || updates.length === 0) return null;
  // Sort newest first by published_at (fallback to year,quarter)
  const sorted = [...updates].sort((a, b) => {
    if (a.published_at && b.published_at) {
      return a.published_at < b.published_at ? 1 : -1;
    }
    if (a.year !== b.year) return b.year - a.year;
    return b.quarter - a.quarter;
  });

  return (
    <div
      style={{
        padding: '14px 0',
        borderBottom: `1px solid ${BRAND.border}`,
      }}
    >
      <div
        style={{
          fontSize: 10,
          fontWeight: 700,
          fontFamily: sans,
          textTransform: 'uppercase',
          color: BRAND.gold,
          letterSpacing: 1.1,
          marginBottom: 8,
        }}
      >
        Earnings Updates{' '}
        <span style={{ color: BRAND.muted, textTransform: 'none', letterSpacing: 0.5, fontWeight: 500 }}>
          ({sorted.length})
        </span>
      </div>
      {sorted.map((u, idx) => (
        <EarningsUpdateCard
          key={`${u.ticker}-${u.year}-Q${u.quarter}-${u.published_at}`}
          update={u}
          defaultOpen={idx === 0}
        />
      ))}
    </div>
  );
}

// -----------------------------------------------------------------------
// StoryArcReviewsBlock — accumulating list, newest on top. Each review
// collapses/expands independently. Shows all 7 narrative sub-sections.
// -----------------------------------------------------------------------

function StoryArcCard({ review, defaultOpen }) {
  const [open, setOpen] = useState(defaultOpen);
  const analyst = review.analyst_initials;
  const date = formatDate(review.review_date);
  const qr = review.quarters_covered_start && review.quarters_covered_end
    ? `${review.quarters_covered_start} → ${review.quarters_covered_end}`
    : null;
  const badge = review.review_type === 'full' ? 'FULL' : 'NO MATERIAL DRIFT';

  const subsections = [
    ['Narrative Continuity', review.narrative_continuity_md],
    ['Narrative Changes', review.narrative_changes_md],
    ['Narrative Disappearances', review.narrative_disappearances_md],
    ['Narrative Reframes', review.narrative_reframes_md],
    ['Thesis Evolution', review.thesis_evolution_md],
    ['Analyst Self-Critique', review.analyst_self_critique_md],
    ['Implications for Credit', review.implications_for_credit_md],
  ];

  return (
    <div
      style={{
        borderLeft: `3px solid ${ANALYST_COLORS[analyst] || BRAND.sage}`,
        background: BRAND.altRow,
        borderRadius: 3,
        marginBottom: 8,
        overflow: 'hidden',
      }}
    >
      <button
        onClick={() => setOpen(!open)}
        style={{
          all: 'unset',
          cursor: 'pointer',
          width: '100%',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '8px 12px',
          boxSizing: 'border-box',
          fontFamily: sans,
        }}
      >
        <span style={{ fontSize: 11, color: BRAND.text, fontWeight: 600 }}>
          Story Arc · {date || '—'}
          {qr && (
            <span style={{ color: BRAND.muted, fontWeight: 400, marginLeft: 8, fontFamily: mono }}>
              {qr}
            </span>
          )}
          <span
            style={{
              fontFamily: mono,
              fontSize: 8.5,
              color: BRAND.muted,
              letterSpacing: 0.6,
              marginLeft: 8,
              padding: '1px 4px',
              border: `1px solid ${BRAND.border}`,
              borderRadius: 2,
            }}
          >
            {badge}
          </span>
          <span style={{ color: BRAND.muted, fontWeight: 400, marginLeft: 8 }}>
            · {analyst}
          </span>
        </span>
        <span style={{ color: BRAND.muted, fontSize: 11, fontFamily: mono }}>
          {open ? '−' : '+'}
        </span>
      </button>
      {open && (
        <div style={{ padding: '0 14px 12px 14px' }}>
          {subsections.map(([label, md]) =>
            md ? (
              <div key={label} style={{ marginTop: 10 }}>
                <div
                  style={{
                    fontSize: 9,
                    color: BRAND.gold,
                    textTransform: 'uppercase',
                    letterSpacing: 1,
                    fontWeight: 700,
                    marginBottom: 5,
                    fontFamily: sans,
                  }}
                >
                  {label}
                </div>
                {renderMarkdown(md, { paraSize: 11, bulletSize: 10.5 })}
              </div>
            ) : null
          )}
        </div>
      )}
    </div>
  );
}

function StoryArcReviewsBlock({ reviews }) {
  if (!Array.isArray(reviews) || reviews.length === 0) return null;
  const sorted = [...reviews].sort((a, b) =>
    (a.review_date || '') < (b.review_date || '') ? 1 : -1
  );

  return (
    <div
      style={{
        padding: '14px 0',
        borderBottom: `1px solid ${BRAND.border}`,
      }}
    >
      <div
        style={{
          fontSize: 10,
          fontWeight: 700,
          fontFamily: sans,
          textTransform: 'uppercase',
          color: BRAND.gold,
          letterSpacing: 1.1,
          marginBottom: 8,
        }}
      >
        Story Arc Reviews{' '}
        <span style={{ color: BRAND.muted, textTransform: 'none', letterSpacing: 0.5, fontWeight: 500 }}>
          ({sorted.length})
        </span>
      </div>
      {sorted.map((r, idx) => (
        <StoryArcCard
          key={`${r.ticker}-${r.review_date}`}
          review={r}
          defaultOpen={idx === 0}
        />
      ))}
    </div>
  );
}

// -----------------------------------------------------------------------
// Sidebar components (right column when panel expanded, below main when
// panel collapsed): analyst_notes_sidebar section + read_through_notes
// targeting this ticker.
// -----------------------------------------------------------------------

function SidebarAnalystNotes({ section }) {
  if (!section || !section.content_md) return null;
  const analyst = section.last_updated_by;
  const accent = ANALYST_COLORS[analyst] || BRAND.sage;

  return (
    <div
      style={{
        background: BRAND.altRow,
        borderLeft: `3px solid ${accent}`,
        borderRadius: 3,
        padding: '10px 12px',
        marginBottom: 12,
      }}
    >
      <div
        style={{
          fontSize: 9,
          color: accent,
          textTransform: 'uppercase',
          letterSpacing: 1,
          fontWeight: 700,
          marginBottom: 6,
          fontFamily: sans,
        }}
      >
        Analyst Notes · {analyst}
      </div>
      {renderMarkdown(section.content_md, { paraSize: 10.5, bulletSize: 10 })}
    </div>
  );
}

function SidebarReadThroughs({ notes }) {
  if (!Array.isArray(notes) || notes.length === 0) return null;
  return (
    <div
      style={{
        background: BRAND.altRow,
        borderLeft: `3px solid ${BRAND.sage}`,
        borderRadius: 3,
        padding: '10px 12px',
        marginBottom: 12,
      }}
    >
      <div
        style={{
          fontSize: 9,
          color: BRAND.sage,
          textTransform: 'uppercase',
          letterSpacing: 1,
          fontWeight: 700,
          marginBottom: 8,
          fontFamily: sans,
        }}
      >
        Read-Through Notes ({notes.length})
      </div>
      {notes.map((n) => (
        <div
          key={n.note_id}
          style={{
            marginBottom: 10,
            paddingBottom: 10,
            borderBottom: `1px dashed ${BRAND.border}`,
          }}
        >
          <div
            style={{
              fontFamily: mono,
              fontSize: 9.5,
              color: BRAND.muted,
              letterSpacing: 0.3,
              marginBottom: 4,
            }}
          >
            From <strong style={{ color: ANALYST_COLORS[n.analyst_initials] || BRAND.text }}>
              {n.source_ticker}
            </strong>{' '}
            · {n.analyst_initials} · {formatDate(n.published_at) || '—'}
          </div>
          <div
            style={{
              fontFamily: sans,
              fontSize: 10.5,
              color: BRAND.text,
              lineHeight: 1.55,
            }}
          >
            {renderMarkdown(n.note_md, { paraSize: 10.5, bulletSize: 10 })}
          </div>
        </div>
      ))}
    </div>
  );
}

// -----------------------------------------------------------------------
// Orchestrator
// -----------------------------------------------------------------------

export default function AnalystTeamBlock({ ticker, data, expanded }) {
  const at = data?.analyst_team;
  if (!at) return null;

  const sections = at.issuer_detail?.[ticker];
  const hasSections = sections && Object.keys(sections).length > 0;

  const earningsUpdates = (at.earnings_updates || []).filter((u) => u.ticker === ticker);
  const storyArcs = (at.story_arc_reviews || []).filter((r) => r.ticker === ticker);
  const readThroughs = (at.read_through_notes || []).filter(
    (n) => n.target_ticker === ticker
  );

  const hasAnyAnalystContent =
    hasSections || earningsUpdates.length > 0 || storyArcs.length > 0 || readThroughs.length > 0;

  if (!hasAnyAnalystContent) return null;

  // Main column: vs_house_view callout, then 8 sections in order, then
  // earnings updates, then story arcs.
  const mainColumn = (
    <div>
      {sections?.vs_house_view && <VsHouseViewCallout section={sections.vs_house_view} />}
      {MAIN_SECTION_ORDER.map((sn) =>
        sections?.[sn] ? (
          <AnalystSection key={sn} sectionName={sn} section={sections[sn]} />
        ) : null
      )}
      <EarningsUpdatesBlock updates={earningsUpdates} />
      <StoryArcReviewsBlock reviews={storyArcs} />
    </div>
  );

  // Sidebar: analyst_notes_sidebar + read-through notes.
  const sidebar = (
    <div>
      {sections?.analyst_notes_sidebar && (
        <SidebarAnalystNotes section={sections.analyst_notes_sidebar} />
      )}
      <SidebarReadThroughs notes={readThroughs} />
    </div>
  );

  const hasSidebar =
    Boolean(sections?.analyst_notes_sidebar) || readThroughs.length > 0;

  return (
    <div
      style={{
        marginBottom: 14,
        padding: '14px 16px',
        background: BRAND.card,
        border: `1px solid ${BRAND.border}`,
        borderRadius: 5,
      }}
    >
      {/* Section label */}
      <div
        style={{
          fontSize: 11,
          fontWeight: 700,
          fontFamily: sans,
          textTransform: 'uppercase',
          color: BRAND.sage,
          letterSpacing: 1.2,
          marginBottom: 8,
          paddingBottom: 8,
          borderBottom: `1px solid ${BRAND.border}`,
        }}
      >
        Desk Intelligence — Senior Analyst Team
      </div>

      {/* Regime banner always on top, full width */}
      <RegimeBanner houseView={at.house_view} />

      {/* Main + sidebar layout */}
      {expanded && hasSidebar ? (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 280px',
            gap: 16,
            alignItems: 'start',
          }}
        >
          {mainColumn}
          {sidebar}
        </div>
      ) : (
        <div>
          {mainColumn}
          {hasSidebar && (
            <div style={{ marginTop: 14, paddingTop: 14, borderTop: `1px solid ${BRAND.border}` }}>
              {sidebar}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
