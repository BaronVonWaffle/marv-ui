import { Suspense, lazy } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import IssuerSearchBox from '../components/IssuerSearchBox';
import { BRAND } from '../utils/colors';

// Lazy-loaded — IssuerDetail is 1075 LOC; lazy chunk avoids inflating the
// initial bundle for users who land on / and never visit an issuer page.
const IssuerDetail = lazy(() => import('../panels/IssuerDetail'));

const sans = 'Arial, sans-serif';

/**
 * /issuer/:ticker? route component.
 *
 * - With :ticker: renders IssuerDetail in embedded mode (full-page,
 *   no modal chrome).
 * - Without :ticker: renders a centered search prompt so users can pick a
 *   name without back-navigating.
 *
 * Modal usage of IssuerDetail (clicks within other views) is preserved in
 * App.jsx via selectedTicker state — that path uses the same lazy chunk
 * and renders with embedded=false (default).
 */
export default function IssuerRoute({ data }) {
  const { ticker } = useParams();
  const navigate = useNavigate();

  if (!ticker) {
    return (
      <div
        style={{
          padding: '60px 20px',
          textAlign: 'center',
          fontFamily: sans,
        }}
      >
        <div
          style={{
            fontSize: 11,
            color: BRAND.gold,
            textTransform: 'uppercase',
            letterSpacing: 1.2,
            marginBottom: 10,
            fontWeight: 700,
          }}
        >
          Issuer search
        </div>
        <div style={{ fontSize: 13, color: BRAND.textSecondary, marginBottom: 16 }}>
          Type a ticker — pod-covered names appear first.
        </div>
        <div style={{ display: 'inline-block' }}>
          <IssuerSearchBox data={data} />
        </div>
      </div>
    );
  }

  return (
    <Suspense
      fallback={
        <div
          style={{
            padding: 40,
            textAlign: 'center',
            fontFamily: sans,
            fontSize: 12,
            color: BRAND.muted,
          }}
        >
          Loading {ticker}…
        </div>
      }
    >
      <IssuerDetail
        ticker={ticker.toUpperCase()}
        data={data}
        embedded={true}
        onClose={() => navigate(-1)}
      />
    </Suspense>
  );
}
