/*
 * startup-watchdog.js
 *
 * Goal: catch “white screen” / failed-JS-load cases where React never boots.
 * Runs before the Vite module loads, so it can still show an error UI if the
 * main bundle/chunks fail to download/execute.
 *
 * IMPORTANT:
 * - No secrets / no PII.
 * - Console-only + localStorage snapshot for easy copy/paste.
 */

(function () {
  const WATCHDOG_MS = 8000;
  const ROOT_ID = 'root';

  function safeStringify(obj) {
    try {
      return JSON.stringify(obj);
    } catch {
      return String(obj);
    }
  }

  function getScriptResources() {
    try {
      const entries = performance.getEntriesByType?.('resource') || [];
      return entries
        .filter((e) => e.initiatorType === 'script')
        .map((e) => ({
          name: e.name,
          initiatorType: e.initiatorType,
          duration: Math.round(e.duration),
          transferSize: e.transferSize,
          encodedBodySize: e.encodedBodySize,
          decodedBodySize: e.decodedBodySize
        }));
    } catch {
      return [];
    }
  }

  function setDebugSnapshot(snapshot) {
    try {
      localStorage.setItem('ppai_startup_debug', safeStringify(snapshot));
    } catch {
      // ignore
    }
  }

  // Capture resource loading errors (e.g., failed script/module fetch)
  window.addEventListener(
    'error',
    function (event) {
      const target = event && event.target;
      const isResourceError = target && (target.tagName === 'SCRIPT' || target.tagName === 'LINK');
      if (!isResourceError) return;

      const snapshot = {
        kind: 'resource-error',
        at: new Date().toISOString(),
        tag: target.tagName,
        src: target.src || target.href || null
      };

      console.error('[startup-watchdog] Resource load error', snapshot);
      setDebugSnapshot(snapshot);
    },
    true
  );

  // Capture chunk load failures surfaced as promise rejections
  window.addEventListener('unhandledrejection', function (event) {
    const reason = event && event.reason;
    const snapshot = {
      kind: 'unhandledrejection',
      at: new Date().toISOString(),
      reason: typeof reason === 'string' ? reason : safeStringify(reason)
    };

    console.error('[startup-watchdog] Unhandled promise rejection (startup)', snapshot);
    setDebugSnapshot(snapshot);
  });

  function showBootFailureUI(debug) {
    const root = document.getElementById(ROOT_ID);
    if (!root) return;

    root.innerHTML = `
      <div style="min-height:100vh;display:flex;align-items:center;justify-content:center;padding:24px;font-family:Inter,system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;background:#fff;">
        <div style="max-width:520px;width:100%;text-align:center;">
          <h1 style="margin:0 0 8px;font-size:22px;color:#111827;">PitchPerfect AI</h1>
          <h2 style="margin:0 0 12px;font-size:18px;color:#b91c1c;">App failed to load</h2>
          <p style="margin:0 0 16px;font-size:14px;color:#4b5563;">
            This is usually caused by a network/cache issue or a failed JavaScript chunk download.
          </p>

          <div style="display:flex;gap:12px;justify-content:center;margin-bottom:16px;flex-wrap:wrap;">
            <button id="ppai_reload" style="background:#2563eb;color:#fff;border:none;border-radius:8px;padding:10px 14px;font-weight:600;cursor:pointer;">Reload</button>
            <a href="/" style="display:inline-block;background:#e5e7eb;color:#111827;text-decoration:none;border-radius:8px;padding:10px 14px;font-weight:600;">Go home</a>
          </div>

          <details style="text-align:left;background:#f9fafb;border:1px solid #e5e7eb;border-radius:10px;padding:12px;">
            <summary style="cursor:pointer;font-weight:600;color:#111827;">Debug info (copy/paste to support)</summary>
            <pre style="margin:10px 0 0;white-space:pre-wrap;word-break:break-word;font-size:12px;color:#374151;">${safeStringify(debug)}</pre>
          </details>
        </div>
      </div>
    `;

    const reloadBtn = document.getElementById('ppai_reload');
    if (reloadBtn) reloadBtn.addEventListener('click', function () {
      window.location.reload();
    });
  }

  window.setTimeout(function () {
    const root = document.getElementById(ROOT_ID);
    if (!root) return;

    // If React booted, it should have replaced the fallback content.
    // Heuristic: still contains “Loading JavaScript...” text or has only the fallback markup.
    const html = (root.innerText || '').toLowerCase();
    const stillLoading = html.includes('loading javascript');

    if (!stillLoading) return;

    const debug = {
      kind: 'startup-timeout',
      at: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: location.href,
      scripts: getScriptResources(),
      lastSnapshot: (function () {
        try {
          return localStorage.getItem('ppai_startup_debug');
        } catch {
          return null;
        }
      })()
    };

    console.error('[startup-watchdog] React did not boot within timeout', debug);
    setDebugSnapshot(debug);
    showBootFailureUI(debug);
  }, WATCHDOG_MS);
})();
