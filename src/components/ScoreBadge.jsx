import { SCORE_COLORS } from '../utils/colors';

export default function ScoreBadge({ score, size = 'sm' }) {
  const bg = SCORE_COLORS[score] || SCORE_COLORS.no_data;
  const isSmall = size === 'sm';

  return (
    <span
      style={{
        display: 'inline-block',
        background: bg,
        color: '#FFFFFF',
        textTransform: 'uppercase',
        fontWeight: 700,
        fontFamily: 'Arial, sans-serif',
        fontSize: isSmall ? 10 : 12,
        padding: isSmall ? '2px 7px' : '3px 10px',
        borderRadius: 9999,
        lineHeight: 1.3,
      }}
    >
      {score === 'no_data' ? 'N/A' : score}
    </span>
  );
}
