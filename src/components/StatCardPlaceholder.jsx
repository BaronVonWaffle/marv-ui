import { BRAND } from '../utils/colors';

const sans = 'Arial, sans-serif';
const mono = "'JetBrains Mono', monospace";

export default function StatCardPlaceholder({ title = 'Equity reversals', subtext = 'Coming · Session 8' }) {
  return (
    <div
      style={{
        background: BRAND.card,
        border: `0.5px dashed ${BRAND.border}`,
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
          marginBottom: 4,
        }}
      >
        {title}
      </div>
      <div
        style={{
          fontSize: 22,
          fontWeight: 700,
          fontFamily: mono,
          color: BRAND.textSecondary,
          lineHeight: 1.2,
        }}
      >
        —
      </div>
      <div style={{ fontSize: 10, color: BRAND.textSecondary, fontFamily: sans, marginTop: 2 }}>
        {subtext}
      </div>
    </div>
  );
}
