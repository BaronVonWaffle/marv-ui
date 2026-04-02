import { SEVERITY_COLORS } from '../utils/colors';

export default function SeverityDot({ severity }) {
  const color = SEVERITY_COLORS[severity] || SEVERITY_COLORS.low;

  return (
    <span
      style={{
        display: 'inline-block',
        width: 7,
        height: 7,
        borderRadius: '50%',
        backgroundColor: color,
        marginRight: 4,
        flexShrink: 0,
      }}
    />
  );
}
