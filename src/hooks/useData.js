import { useState, useEffect, useMemo, useCallback } from 'react';

/**
 * Build a {ticker: row} object from an array of rows.
 * Last row wins if duplicates (shouldn't happen after v2 latest-per-ticker filter).
 */
function indexByTicker(rows) {
  if (!Array.isArray(rows)) return {};
  const out = {};
  for (const r of rows) {
    if (r && r.ticker) out[r.ticker] = r;
  }
  return out;
}

/**
 * Build a {ticker: [row, row, ...]} object for history tables.
 * Preserves row order (rows are already sorted by ticker, date asc in export).
 */
function groupByTicker(rows) {
  if (!Array.isArray(rows)) return {};
  const out = {};
  for (const r of rows) {
    if (!r || !r.ticker) continue;
    (out[r.ticker] ||= []).push(r);
  }
  return out;
}

export default function useData() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    Promise.all([
      fetch(import.meta.env.BASE_URL + 'data/pipeline_snapshot.json').then((r) => {
        if (!r.ok) throw new Error(`pipeline_snapshot: ${r.status}`);
        return r.json();
      }),
      fetch(import.meta.env.BASE_URL + 'data/research_manifest.json')
        .then((r) => (r.ok ? r.json() : []))
        .catch(() => []),
    ])
      .then(([pipeline, research]) => {
        setData({ ...pipeline, research });
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  // v2 table lookups — memoized so referential identity is stable across renders.
  const fundamentalScoresV2 = useMemo(
    () => indexByTicker(data?.fundamental_scores_v2), [data]);
  const equitySignals = useMemo(
    () => indexByTicker(data?.equity_signals), [data]);
  const spreadData = useMemo(
    () => indexByTicker(data?.spread_data), [data]);
  const relativeValue = useMemo(
    () => indexByTicker(data?.relative_value), [data]);
  const scoreHistoryV2 = useMemo(
    () => groupByTicker(data?.score_history_v2), [data]);
  const scoreMomentum = useMemo(
    () => indexByTicker(data?.score_momentum), [data]);

  // ticker_status comes from the snapshot as {ticker: {status, equity_ticker, reason, as_of}}.
  // Tickers not present are implicitly active — getEquityStatus enforces that.
  const tickerStatus = useMemo(() => data?.ticker_status || {}, [data]);

  const getEquityStatus = useCallback(
    (ticker) => tickerStatus[ticker]?.status || 'active',
    [tickerStatus]
  );

  return {
    data,
    loading,
    error,
    // v2 table lookups
    fundamentalScoresV2,
    equitySignals,
    spreadData,
    relativeValue,
    scoreHistoryV2,
    scoreMomentum,
    tickerStatus,
    // metadata
    snapshotGeneratedAt: data?.snapshot_generated_at || data?.generated_at || null,
    v2TablesIncluded: data?.v2_tables_included || [],
    spreadDataAsOf: data?.spread_data_as_of || null,
    spreadDataAgeDays: data?.spread_data_age_days ?? null,
    scoreMomentumAsOf: data?.score_momentum_as_of || null,
    snapshotIncludesStaleWarning: !!data?.snapshot_includes_stale_warning,
    staleTables: data?.stale_tables || [],
    // helpers
    getEquityStatus,
  };
}
