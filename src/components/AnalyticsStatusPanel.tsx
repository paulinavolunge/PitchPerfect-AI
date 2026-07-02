import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle2, XCircle, Download } from 'lucide-react';
import { checkAnalyticsConnection, getLastPageview } from '@/utils/analytics';

function formatRelative(ts: number): string {
  const s = Math.max(0, Math.round((Date.now() - ts) / 1000));
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.round(s / 60)}m ago`;
  if (s < 86400) return `${Math.round(s / 3600)}h ago`;
  return `${Math.round(s / 86400)}d ago`;
}

type Row = { label: string; ok: boolean; detail?: string };

function buildDiagnostics() {
  const status = checkAnalyticsConnection();
  const last = getLastPageview();
  return {
    generatedAt: new Date().toISOString(),
    url: window.location.href,
    hostname: window.location.hostname,
    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
    checks: {
      lovableTagger: status.taggerLoaded,
      ga4Script: status.scriptLoaded,
      gtagFunction: status.ga4Loaded,
      dataLayer: status.gtmLoaded,
      consentGranted: status.consentValid,
      productionHost: status.productionHost,
    },
    lastPageview: last
      ? {
          path: last.path,
          at: last.at,
          atFormatted: new Date(last.at).toISOString(),
          relative: formatRelative(last.at),
        }
      : null,
  };
}

function exportDiagnostics() {
  const payload = buildDiagnostics();
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `pitchperfect-analytics-diagnostics-${new Date().toISOString().slice(0, 19)}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export default function AnalyticsStatusPanel() {
  const [status, setStatus] = useState(() => checkAnalyticsConnection());
  const [last, setLast] = useState(() => getLastPageview());
  const [, tick] = useState(0);

  useEffect(() => {
    const id = window.setInterval(() => {
      setStatus(checkAnalyticsConnection());
      setLast(getLastPageview());
      tick((n) => n + 1);
    }, 2000);
    return () => window.clearInterval(id);
  }, []);

  const rows: Row[] = [
    { label: 'Lovable tagger script (gptengineer.js)', ok: status.taggerLoaded },
    { label: 'GA4 script (gtag/js) loaded', ok: status.scriptLoaded },
    { label: 'gtag() function available', ok: status.ga4Loaded },
    { label: 'dataLayer initialized', ok: status.gtmLoaded },
    { label: 'Analytics consent granted', ok: status.consentValid },
    { label: 'Production host', ok: status.productionHost, detail: window.location.hostname },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Analytics Status</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <ul className="space-y-2">
          {rows.map((r) => (
            <li key={r.label} className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2 text-brand-dark">
                {r.ok ? (
                  <CheckCircle2 className="h-4 w-4 text-green-600" aria-hidden />
                ) : (
                  <XCircle className="h-4 w-4 text-red-600" aria-hidden />
                )}
                {r.label}
              </span>
              {r.detail && <span className="text-xs text-brand-dark/60">{r.detail}</span>}
            </li>
          ))}
        </ul>

        <div className="border-t pt-3 text-sm">
          <div className="font-medium text-brand-dark">Last tracked pageview</div>
          {last ? (
            <div className="text-brand-dark/70 mt-1">
              <div>{last.path}</div>
              <div className="text-xs">
                {new Date(last.at).toLocaleString()} · {formatRelative(last.at)}
              </div>
            </div>
          ) : (
            <div className="text-brand-dark/60 mt-1 text-xs">
              No pageview tracked yet this session. Pageviews are only sent on the production host with consent granted.
            </div>
          )}
        </div>

        <div className="border-t pt-4">
          <Button variant="outline" size="sm" onClick={exportDiagnostics} className="w-full">
            <Download className="h-4 w-4 mr-2" />
            Export diagnostics
          </Button>
          <p className="text-xs text-brand-dark/50 mt-2">
            Downloads a JSON report of the checks above and the last tracked pageview for sharing.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
