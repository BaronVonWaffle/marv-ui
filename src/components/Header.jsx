import { BRAND } from '../utils/colors';

export default function Header({ nameCount, sectorFilter, onSectorFilterChange, sectors }) {
  return (
    <>
      <div
        style={{
          background: BRAND.navyDark,
          width: '100%',
          height: 46,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div
          style={{
            maxWidth: 1100,
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 16px',
            boxSizing: 'border-box',
          }}
        >
          {/* Left: icon + titles */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontWeight: 700,
                fontSize: 18,
                letterSpacing: 3,
                color: BRAND.sage,
              }}
            >
              MARV
            </span>
            <div>
              <div
                style={{
                  color: BRAND.white,
                  fontFamily: 'Arial, sans-serif',
                  fontWeight: 700,
                  fontSize: 14,
                  lineHeight: '14px',
                }}
              >
                Market Analysis &amp; Relative Value
              </div>
              <div
                style={{
                  color: BRAND.sage,
                  fontFamily: 'Arial, sans-serif',
                  fontSize: 9.5,
                  fontWeight: 400,
                  textTransform: 'uppercase',
                  letterSpacing: 1.6,
                  lineHeight: '10px',
                }}
              >
                SUMRIDGE PARTNERS
              </div>
            </div>
          </div>

          {/* Right: name count + sector filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span
              style={{
                color: BRAND.sage,
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 12,
              }}
            >
              {nameCount} names
            </span>
            <select
              value={sectorFilter}
              onChange={(e) => onSectorFilterChange(e.target.value)}
              style={{
                background: BRAND.card,
                color: BRAND.text,
                border: `1px solid ${BRAND.border}`,
                borderRadius: 3,
                padding: '3px 6px',
                fontFamily: 'Arial, sans-serif',
                fontSize: 12,
                outline: 'none',
                cursor: 'pointer',
              }}
            >
              <option value="all">All Sectors</option>
              {(sectors || []).map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Sage-to-gold accent bar */}
      <div
        style={{
          height: 3,
          background: `linear-gradient(90deg, ${BRAND.sage}, ${BRAND.gold})`,
        }}
      />
    </>
  );
}
