import { useState } from 'react';
import { BRAND } from '../utils/colors';

export default function StatCard({ label, value, color, subtitle, tooltip }) {
  const [showTip, setShowTip] = useState(false);

  return (
    <div
      style={{
        background: BRAND.card,
        border: `1px solid ${BRAND.border}`,
        borderRadius: 5,
        padding: '10px 14px',
        position: 'relative',
      }}
      onMouseEnter={() => setShowTip(true)}
      onMouseLeave={() => setShowTip(false)}
    >
      <div
        style={{
          fontSize: 9,
          textTransform: 'uppercase',
          letterSpacing: 1.2,
          color: BRAND.muted,
          fontWeight: 600,
          fontFamily: 'Arial, sans-serif',
          marginBottom: 4,
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontSize: 22,
          fontWeight: 700,
          fontFamily: "'JetBrains Mono', monospace",
          color: color || BRAND.text,
          lineHeight: 1.2,
        }}
      >
        {value}
      </div>
      {subtitle && (
        <div
          style={{
            fontSize: 10,
            color: BRAND.textSecondary,
            fontFamily: 'Arial, sans-serif',
            marginTop: 2,
          }}
        >
          {subtitle}
        </div>
      )}
      {tooltip && showTip && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            left: '50%',
            transform: 'translateX(-50%)',
            marginTop: 6,
            background: '#1a1a1a',
            color: '#fff',
            fontSize: 11,
            fontFamily: 'Arial, sans-serif',
            lineHeight: 1.4,
            padding: '6px 10px',
            borderRadius: 4,
            maxWidth: 220,
            whiteSpace: 'normal',
            pointerEvents: 'none',
            zIndex: 50,
            boxShadow: '0 2px 8px rgba(0,0,0,0.4)',
          }}
        >
          {tooltip}
        </div>
      )}
    </div>
  );
}
