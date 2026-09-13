// One retry inside a single deadline, including response-body delivery.
// Caller cancellation (including Budget's whole-turn deadline) always wins.
export function isQuotaFailure(status: number, body: string): boolean {
  return status === 429 && /insufficient[_ -]quota|billing|quota.{0,30}exceed|insufficient.{0,20}credit|credit.{0,20}(exhaust|balance)/i.test(body);
}

export async function fetchOpenAI(url: string, init: RequestInit): Promise<Response> {
  const controller = new AbortController();
  const abort = () => controller.abort();
  const caller = init.signal;
  if (caller?.aborted) abort();
  caller?.addEventListener('abort', abort, { once: true });
  const timeout = setTimeout(abort, 25_000);
  try {
    for (let attempt = 0; ; attempt++) {
      controller.signal.throwIfAborted();
      try {
        const response = await fetch(url, { ...init, signal: controller.signal });
        const bytes = await response.arrayBuffer();
        const body = new TextDecoder().decode(bytes);
        const transient = response.status >= 500 || (response.status === 429 && !isQuotaFailure(response.status, body));
        if (!transient || attempt === 1) return new Response(bytes, {status:response.status, statusText:response.statusText, headers:response.headers});
      } catch (error) {
        if (controller.signal.aborted) throw new DOMException('Request aborted', 'AbortError');
        if (attempt === 1 || !(error instanceof TypeError)) throw error;
      }
      await new Promise<void>((resolve, reject) => {
        const onAbort = () => { clearTimeout(timer); reject(new DOMException('Request aborted', 'AbortError')); };
        const timer = setTimeout(() => {controller.signal.removeEventListener('abort', onAbort);resolve();}, 500);
        controller.signal.addEventListener('abort', onAbort, {once:true});
        if (controller.signal.aborted) onAbort();
      });
    }
  } finally {
    clearTimeout(timeout);
    caller?.removeEventListener('abort', abort);
  }
}
