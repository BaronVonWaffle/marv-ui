const TIER_LETTER = { green: 'G', yellow: 'Y', red: 'R' };

export function detectSpreadSchema(spreadData) {
  let indexedData = {};
  let sampleRows = [];

  if (Array.isArray(spreadData)) {
    const pipelineRows = spreadData.filter((r) => r && r.in_pipeline === true);
    for (const r of pipelineRows) {
      if (r.ticker) indexedData[r.ticker] = r;
    }
    sampleRows = pipelineRows.slice(0, 50);
  } else if (spreadData && typeof spreadData === 'object') {
    indexedData = spreadData;
    const values = Object.values(spreadData).filter(Boolean);
    sampleRows = values.slice(0, 50);
  } else {
    console.warn(
      '[Notables] Spread z-scores not computed in upstream pipeline (peer: 0%, timeseries: 0%). ' +
      'Notables running TIER_FLIP + DIVERGENCE only. Will activate after C-A.3 (sector_spread_metrics).'
    );
    return { mode: 'disabled', field: null, indexedData: {} };
  }

  const n = sampleRows.length || 1;
  const peerN = sampleRows.filter((r) => r && r.spread_z_peer != null).length;
  const tsN = sampleRows.filter((r) => r && r.spread_z != null).length;
  const peerPct = peerN / n;
  const tsPct = tsN / n;
  const peerPctLabel = Math.round(peerPct * 100);
  const tsPctLabel = Math.round(tsPct * 100);

  if (peerPct >= 0.5) {
    console.log(`[Notables] Spread schema: peer (coverage ${peerPctLabel}%).`);
    return { mode: 'peer', field: 'spread_z_peer', indexedData };
  }
  if (tsPct >= 0.5) {
    console.warn(
      `[Notables] Peer-relative spread z-score unavailable (coverage ${peerPctLabel}%). ` +
      `Falling back to time-series z-score (coverage ${tsPctLabel}%). ` +
      'Will switch to peer mode after C-A.3 (sector_spread_metrics).'
    );
    return { mode: 'timeseries', field: 'spread_z', indexedData };
  }
  console.warn(
    `[Notables] Spread z-scores not computed in upstream pipeline (peer: ${peerPctLabel}%, ` +
    `timeseries: ${tsPctLabel}%). Notables running TIER_FLIP + DIVERGENCE only. ` +
    'Will activate after C-A.3 (sector_spread_metrics).'
  );
  return { mode: 'disabled', field: null, indexedData };
}

export function equityTrajectory(signalRow) {
  const label = signalRow?.equity_signal_label;
  if (label === 'bullish') return 'Strengthening';
  if (label === 'bearish') return 'Weakening';
  if (label === 'neutral') return 'Stable';
  return 'Insufficient';
}

export function priorFundamentalRow(history, currentDate, mode = '1d') {
  if (!history || !history.length || !currentDate) return null;
  if (mode === '1d') {
    for (let i = history.length - 1; i >= 0; i--) {
      const r = history[i];
      if (r?.score_date && r.score_date < currentDate && r.fundamental_label) return r;
    }
    return null;
  }
  const d = new Date(`${currentDate}T00:00:00Z`);
  if (isNaN(d)) return null;
  d.setUTCDate(d.getUTCDate() - 5);
  const cutoff = d.toISOString().slice(0, 10);
  for (let i = history.length - 1; i >= 0; i--) {
    const r = history[i];
    if (r?.score_date && r.score_date <= cutoff && r.fundamental_label) return r;
  }
  return null;
}

function tierFlipSeverity(prior, current) {
  const pair = `${prior}->${current}`;
  if (pair === 'green->red') return 3;
  if (pair === 'yellow->red' || pair === 'green->yellow') return 2;
  if (pair === 'red->yellow' || pair === 'yellow->green') return 1;
  return 0;
}

export function tierFlipArrow(prior, current) {
  const a = TIER_LETTER[prior] || '?';
  const b = TIER_LETTER[current] || '?';
  return `${a}→${b}`;
}

export function evaluateTriggers({
  tickers,
  fundamentalByTicker,
  historyByTicker,
  equityByTicker,
  spreadByTicker,
  schemaMode,
  schemaField,
  compareMode = '1d',
}) {
  const results = [];
  for (const ticker of tickers) {
    const cur = fundamentalByTicker[ticker];
    if (!cur || !cur.fundamental_label || !cur.score_date) continue;
    const currentLabel = cur.fundamental_label;
    const currentDate = cur.score_date;

    const priorRow = priorFundamentalRow(historyByTicker[ticker] || [], currentDate, compareMode);
    const priorLabel = priorRow?.fundamental_label || null;

    const equityRow = equityByTicker[ticker];
    const trajectory = equityTrajectory(equityRow);
    const divLabel = equityRow?.divergence_label;

    let spreadZ = null;
    if (schemaMode !== 'disabled' && schemaField) {
      const row = spreadByTicker?.[ticker];
      if (row && row[schemaField] != null) spreadZ = row[schemaField];
    }

    const triggers = [];
    let severity = 0;
    let flipArrow = null;
    let divergenceKind = null;

    if (priorLabel && priorLabel !== currentLabel) {
      triggers.push('TIER_FLIP');
      flipArrow = tierFlipArrow(priorLabel, currentLabel);
      severity += tierFlipSeverity(priorLabel, currentLabel) * 3;
    }

    // DIVERGENCE currently fires only on credit_lags. credit_leads deferred pending
    // pipeline-side audit of divergence_score methodology (see: KGS misclassification
    // as credit_leads despite year-long aligned price action).
    if (divLabel === 'credit_lags') {
      triggers.push('DIVERGENCE');
      divergenceKind = divLabel;
      severity += 2;
    }

    if (schemaMode !== 'disabled' && spreadZ != null && Math.abs(spreadZ) >= 1.5) {
      triggers.push('SPREAD');
      severity += Math.abs(spreadZ);
    }

    if (!triggers.length) continue;
    results.push({
      ticker,
      sector: cur.sector,
      currentLabel,
      priorLabel,
      flipArrow,
      trajectory,
      divergenceKind,
      spreadZ,
      triggers,
      severity,
    });
  }
  return results;
}

export function sortNotables(rows) {
  return [...rows].sort((a, b) => {
    if (b.triggers.length !== a.triggers.length) return b.triggers.length - a.triggers.length;
    if (b.severity !== a.severity) return b.severity - a.severity;
    return a.ticker.localeCompare(b.ticker);
  });
}

export function triggerLabel(row) {
  const words = row.triggers.map((t) => {
    if (t === 'TIER_FLIP') return row.flipArrow ? `Tier flip ${row.flipArrow}` : 'Tier flip';
    if (t === 'DIVERGENCE') return 'Divergence';
    if (t === 'SPREAD') return 'Spread';
    return t;
  });
  return words
    .map((w, i) => (i === 0 ? w : w.charAt(0).toLowerCase() + w.slice(1)))
    .join(' + ');
}
