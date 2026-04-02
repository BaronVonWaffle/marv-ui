import { SECTOR_COLORS } from '../utils/colors';

function hexToRgba(hex, alpha) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

export default function SectorTag({ sector }) {
  const color = SECTOR_COLORS[sector?.toLowerCase()] || '#808080';

  return (
    <span
      style={{
        display: 'inline-block',
        background: hexToRgba(color, 0.2),
        color: color,
        border: `1px solid ${hexToRgba(color, 0.4)}`,
        borderRadius: 3,
        fontFamily: 'Arial, sans-serif',
        fontSize: 10,
        fontWeight: 600,
        padding: '1px 6px',
        lineHeight: 1.4,
      }}
    >
      {sector}
    </span>
  );
}
