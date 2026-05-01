import { BRAND } from '../utils/colors';
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

// Regime color accents. Risk-On tones green-adjacent; Risk-Off tones red-
// adjacent; Range-Bound / with-caveats tone amber. Subtle — the regime is
// framing, not an alarm.
function regimeAccent(regime) {
  if (!regime) return BRAND.muted;
  const r = regime.toLowerCase();
  if (r.includes('risk-off')) return '#d45d54';
  if (r.includes('range-bound')) return '#c9a633';
  if (r.includes('caveats')) return BRAND.gold;
  if (r.includes('risk-on')) return '#5eb4a9';
  return BRAND.gold;
}

function convictionDot(conviction) {
  // 3-dot pattern — Low/Medium/High filled progressively
  const filled =
    conviction === 'High' ? 3 : conviction === 'Medium' ? 2 : conviction === 'Low' ? 1 : 0;
  const dots = [0, 1, 2].map((i) => i < filled);
  return (
    <span style={{ display: 'inline-flex', gap: 3, alignItems: 'center' }}>
      {dots.map((on, i) => (
        <span
          key={i}
          style={{
            width: 7,
            height: 7,
            borderRadius: '50%',
            background: on ? BRAND.gold : 'transparent',
            border: `1px solid ${on ? BRAND.gold : BRAND.muted}`,
          }}
        />
      ))}
    </span>
  );
}

function formatPublishedAt(ts) {
  if (!ts) return null;
  const iso = ts.includes('T') ? ts : ts.replace(' ', 'T');
  const d = new Date(iso);
  if (isNaN(d)) return null;
  const month = d.toLocaleString('en-US', { month: 'short' });
  const day = d.getDate();
  const year = d.getFullYear();
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `${month} ${day}, ${year} · ${hh}:${mm} ET`;
}

function Section({ label, children }) {
  return (
    <div
      style={{
        padding: '14px 0',
        borderTop: `1px solid ${BRAND.border}`,
      }}
    >
      <div style={sectionLabel}>{label}</div>
      {children}
    </div>
  );
}

export default function HouseView({ data }) {
  const hv = data?.analyst_team?.house_view;
  if (!hv) {
    return (
      <div>
        <div style={sectionLabel}>House View</div>
        <div
          style={{
            background: BRAND.card,
            border: `1px solid ${BRAND.border}`,
            borderRadius: 5,
            padding: '20px',
            fontFamily: sans,
            fontSize: 11,
            color: BRAND.muted,
            fontStyle: 'italic',
          }}
        >
          T.W. has not published a House View yet.
        </div>
      </div>
    );
  }

  const accent = regimeAccent(hv.regime);
  const published = formatPublishedAt(hv.published_at);

  return (
    <div>
      <div style={sectionLabel}>House View</div>
      <div
        style={{
          background: BRAND.card,
          border: `1px solid ${BRAND.border}`,
          borderRadius: 5,
          padding: '22px 26px',
        }}
      >
        {/* Masthead — regime hero + publish metadata */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            gap: 18,
            paddingBottom: 16,
          }}
        >
          <div>
            <div
              style={{
                fontFamily: sans,
                fontSize: 10,
                color: BRAND.muted,
                textTransform: 'uppercase',
                letterSpacing: 1.3,
                marginBottom: 6,
              }}
            >
              Regime
            </div>
            <div
              style={{
                fontFamily: sans,
                fontSize: 26,
                fontWeight: 700,
                color: accent,
                lineHeight: 1.1,
                letterSpacing: 0.3,
              }}
            >
              {hv.regime || '—'}
            </div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                marginTop: 10,
                fontFamily: sans,
                fontSize: 11,
                color: BRAND.textSecondary,
                textTransform: 'uppercase',
                letterSpacing: 0.9,
              }}
            >
              <span>Conviction</span>
              {convictionDot(hv.conviction)}
              <span style={{ color: BRAND.text, fontWeight: 600 }}>
                {hv.conviction || '—'}
              </span>
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div
              style={{
                fontFamily: sans,
                fontSize: 9,
                color: BRAND.muted,
                textTransform: 'uppercase',
                letterSpacing: 1,
                marginBottom: 3,
              }}
            >
              Published
            </div>
            <div
              style={{
                fontFamily: mono,
                fontSize: 10.5,
                color: BRAND.textSecondary,
                letterSpacing: 0.4,
              }}
            >
              {published || '—'}
            </div>
            <div
              style={{
                fontFamily: sans,
                fontSize: 9.5,
                color: BRAND.muted,
                marginTop: 4,
                letterSpacing: 0.3,
              }}
            >
              Version {hv.version_id ?? '—'}
            </div>
          </div>
        </div>

        {/* Body sections — each with gold uppercase section label */}
        {hv.drivers_md && (
          <Section label="What's driving">
            {renderMarkdown(hv.drivers_md, { bulletSize: 11 })}
          </Section>
        )}

        {hv.positioning_md && (
          <Section label="Positioning read">
            {renderMarkdown(hv.positioning_md, { paraSize: 12 })}
          </Section>
        )}

        {hv.catalysts_md && (
          <Section label="Next 5 trading days">
            {renderMarkdown(hv.catalysts_md, { bulletSize: 11 })}
          </Section>
        )}

        {hv.cross_currents_md && (
          <Section label="Cross-currents — where bottom-up is fighting top-down">
            {renderMarkdown(hv.cross_currents_md, { bulletSize: 11 })}
          </Section>
        )}

        {hv.earnings_driven_macro_signals_md && (
          <Section label="Earnings-driven macro signals this week">
            {renderMarkdown(hv.earnings_driven_macro_signals_md, { bulletSize: 11 })}
          </Section>
        )}

        {/* Signature */}
        <div
          style={{
            marginTop: 18,
            paddingTop: 14,
            borderTop: `1px solid ${BRAND.border}`,
            display: 'flex',
            justifyContent: 'flex-end',
          }}
        >
          <div
            style={{
              fontFamily: sans,
              fontSize: 13,
              fontStyle: 'italic',
              color: BRAND.textSecondary,
              letterSpacing: 0.4,
            }}
          >
            — {hv.analyst_initials || 'T.W.'}
          </div>
        </div>
      </div>
    </div>
  );
}
