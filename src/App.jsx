import { useState, useMemo, lazy, Suspense } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import useData from './hooks/useData';
import Header from './components/Header';
import NavTabs from './components/NavTabs';
import PMDashboard from './views/PMDashboard';
import Dashboard from './views/Dashboard';
import ThePod from './views/ThePod';
import Universe from './views/Universe';
import Macro from './views/Macro';
import Alerts from './views/Alerts';
import TopIdeas from './views/TopIdeas';
import Earnings from './views/Earnings';
import Library from './views/Library';
import Methodology from './views/Methodology';
import IssuerRoute from './views/IssuerRoute';
import PlaybookRoute from './views/PlaybookRoute';
import { BRAND } from './utils/colors';

// Lazy: IssuerDetail (1075 LOC) + AnalystPanel (789 LOC) are heavy; keep
// them out of the initial bundle. They load on first open.
const IssuerDetail = lazy(() => import('./panels/IssuerDetail'));
const AnalystPanel = lazy(() => import('./panels/AnalystPanel'));

const sans = 'Arial, sans-serif';

export default function App() {
  const { data, loading, error, tickerStatus } = useData();
  const [sectorFilter, setSectorFilter] = useState('all');
  const [selectedTicker, setSelectedTicker] = useState(null);
  const [selectedAnalyst, setSelectedAnalyst] = useState(null);
  const navigate = useNavigate();

  const sectors = useMemo(() => {
    if (!data?.scores) return [];
    return Array.from(new Set(data.scores.map((s) => s.sector).filter(Boolean))).sort();
  }, [data]);

  if (loading) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          fontFamily: sans,
          color: BRAND.muted,
          background: BRAND.bg,
          gap: 12,
        }}
      >
        <div
          style={{
            width: 24,
            height: 24,
            border: `3px solid ${BRAND.border}`,
            borderTop: `3px solid ${BRAND.sage}`,
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite',
          }}
        />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <span style={{ fontSize: 12 }}>Loading pipeline data...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          fontFamily: sans,
          background: BRAND.bg,
          gap: 8,
        }}
      >
        <div style={{ fontSize: 14, fontWeight: 700, color: BRAND.text }}>
          Failed to load data
        </div>
        <div style={{ fontSize: 12, color: '#c0392b' }}>{error}</div>
      </div>
    );
  }

  // Modal usage of IssuerDetail (clicks inside views) routes through state.
  // Routed usage (/issuer/:ticker) goes through IssuerRoute → embedded=true.
  const onTickerClick = (t) => setSelectedTicker(t);
  const onAnalystClick = (a) => setSelectedAnalyst(a);

  return (
    <div style={{ background: BRAND.bg, minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Header
        nameCount={data?.scores?.length || 0}
        sectorFilter={sectorFilter}
        onSectorFilterChange={setSectorFilter}
        sectors={sectors}
        generatedAt={data?.generated_at}
        searchData={data}
      />
      <NavTabs />

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: 13, width: '100%', boxSizing: 'border-box', flex: 1 }}>
        <Routes>
          <Route
            path="/"
            element={
              <PMDashboard
                data={data}
                tickerStatus={tickerStatus}
                onTickerClick={onTickerClick}
                onNavigate={(viewKey) => {
                  // Backwards-compat: PMDashboard passes legacy view keys.
                  // Map them to routes.
                  const map = {
                    desk_intel: '/pod',
                    topideas: '/top-ideas',
                    earnings: '/earnings',
                    universe: '/universe',
                    macro: '/macro',
                    alerts: '/alerts',
                    library: '/library',
                    methodology: '/methodology',
                    dashboard: '/legacy',
                    pm: '/',
                  };
                  navigate(map[viewKey] || '/');
                }}
              />
            }
          />
          <Route
            path="/pod"
            element={
              <ThePod
                data={data}
                onTickerClick={onTickerClick}
                onAnalystClick={onAnalystClick}
              />
            }
          />
          <Route
            path="/issuer"
            element={<IssuerRoute data={data} />}
          />
          <Route
            path="/issuer/:ticker"
            element={<IssuerRoute data={data} />}
          />
          <Route
            path="/top-ideas"
            element={<TopIdeas data={data} sectorFilter={sectorFilter} />}
          />
          <Route
            path="/earnings"
            element={<Earnings data={data} sectorFilter={sectorFilter} />}
          />
          <Route
            path="/universe"
            element={<Universe data={data} sectorFilter={sectorFilter} onTickerClick={onTickerClick} />}
          />
          <Route
            path="/macro"
            element={<Macro data={data} sectorFilter={sectorFilter} onTickerClick={onTickerClick} />}
          />
          <Route
            path="/alerts"
            element={<Alerts data={data} sectorFilter={sectorFilter} onTickerClick={onTickerClick} />}
          />
          <Route
            path="/library"
            element={<Library data={data} sectorFilter={sectorFilter} />}
          />
          <Route
            path="/methodology"
            element={<Methodology data={data} />}
          />
          <Route
            path="/playbook"
            element={<PlaybookRoute data={data} />}
          />
          <Route
            path="/legacy"
            element={
              <Dashboard
                data={data}
                sectorFilter={sectorFilter}
                onTickerClick={onTickerClick}
              />
            }
          />
          {/* Catch-all: unknown route -> back to PM */}
          <Route
            path="*"
            element={
              <div style={{ padding: '60px 20px', textAlign: 'center', fontFamily: sans }}>
                <div style={{ fontSize: 13, color: BRAND.textSecondary }}>
                  Page not found —{' '}
                  <button
                    onClick={() => navigate('/')}
                    style={{
                      all: 'unset',
                      cursor: 'pointer',
                      color: BRAND.gold,
                      textDecoration: 'underline',
                    }}
                  >
                    return to PM Dashboard
                  </button>
                </div>
              </div>
            }
          />
        </Routes>
      </div>

      {/* Footer */}
      <footer
        style={{
          borderTop: `1px solid ${BRAND.border}`,
          padding: '8px 20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          maxWidth: 1100,
          margin: '0 auto',
          width: '100%',
          boxSizing: 'border-box',
        }}
      >
        <span style={{ fontFamily: sans, fontSize: 9.5, color: BRAND.muted, letterSpacing: 0.5 }}>
          CONFIDENTIAL — INTERNAL USE ONLY
        </span>
        <span style={{ fontFamily: sans, fontSize: 9.5, color: BRAND.muted }}>
          marv.sumridge.io
        </span>
      </footer>

      {/* Modal slide-overs (state-driven; coexist with /issuer/:ticker route) */}
      <Suspense fallback={null}>
        {selectedTicker && (
          <IssuerDetail
            ticker={selectedTicker}
            data={data}
            onClose={() => setSelectedTicker(null)}
          />
        )}
        {selectedAnalyst && (
          <AnalystPanel
            initials={selectedAnalyst}
            data={data}
            onClose={() => setSelectedAnalyst(null)}
            onTickerClick={(t) => {
              setSelectedAnalyst(null);
              setSelectedTicker(t);
            }}
          />
        )}
      </Suspense>
    </div>
  );
}
