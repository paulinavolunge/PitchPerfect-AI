// Public checkout lookup: an explicit allowlist prevents customer-data disclosure.
export interface CheckoutSummary {
  payment_status: string; status: string | null;
  mode: 'payment' | 'subscription' | 'setup'; amount_total: number | null;
}
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};
export function createVerifyStripeSessionHandler(retrieve: (id: string) => Promise<CheckoutSummary>) {
  const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
    status, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
  return async (req: Request): Promise<Response> => {
    if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
    try {
      const { session_id } = await req.json().catch(() => ({}));
      if (!session_id || typeof session_id !== 'string') return json({ error: 'Missing session_id' }, 400);
      const session = await retrieve(session_id);
      return json({
        // Preserve existing unlock semantics; credit fulfillment remains webhook-owned.
        paid: session.payment_status === 'paid' || session.status === 'complete',
        mode: session.mode ?? null,
        amountTotal: session.amount_total ?? null,
        productLabel: session.mode === 'subscription' ? 'Unlimited Pro'
          : session.amount_total === 499 ? 'Starter Pack — 5 rounds'
          : session.amount_total === 999 ? 'Power Pack — 15 rounds' : null,
      });
    } catch {
      return json({ error: 'Verification failed' }, 400);
    }
  };
}
