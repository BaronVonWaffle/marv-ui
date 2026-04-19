import { BRAND } from '../utils/colors';

/**
 * Hand-rolled SVG polyline sparkline. No axes, no tooltips, no markers.
 *
 * Edge cases:
 *   empty/all-null values  -> empty SVG at full size (preserves layout)
 *   single value           -> flat line at vertical midpoint
 *   all-identical values   -> flat line at vertical midpoint
 */
export default function MiniSparkline({
  values,
  width = 60,
  height = 16,
  color,
}) {
  const stroke = color || BRAND.muted;
  const series = Array.isArray(values)
    ? values.filter((v) => typeof v === 'number' && !Number.isNaN(v))
    : [];

  if (series.length === 0) {
    return <svg width={width} height={height} aria-hidden="true" />;
  }

  const min = Math.min(...series);
  const max = Math.max(...series);
  const range = max - min;
  const midY = height / 2;

  let points;
  if (series.length === 1 || range === 0) {
    points = `0,${midY} ${width},${midY}`;
  } else {
    const stepX = width / (series.length - 1);
    points = series
      .map((v, i) => {
        const x = i * stepX;
        const y = height - ((v - min) / range) * height;
        return `${x.toFixed(2)},${y.toFixed(2)}`;
      })
      .join(' ');
  }

  return (
    <svg width={width} height={height} aria-hidden="true">
      <polyline
        points={points}
        fill="none"
        stroke={stroke}
        strokeWidth="1"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  );
}
