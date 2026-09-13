import type { ActivityAck } from '../../supabase/functions/_shared/budget/session';
export type ActivityMode = 'pause' | 'resume' | 'engaged';
export interface ActivityResponse { ok: boolean; activityAck?: ActivityAck; [key: string]: unknown }
export type ActivityTransport = (action: ActivityMode | 'tick', sequence: number, commandId: string) => Promise<ActivityResponse>;
export class SupersededActivity extends Error {}
/** One sequence per intent; retries keep the exact intent ID/version. No global queue. */
export class BudgetActivityClock {
  private sequence = 0;
  private desired: ActivityMode = 'pause';
  private acknowledged: ActivityAck | null = null;
  private pending: Promise<ActivityAck> | null = null;
  private closed = false;
  constructor(readonly sessionId: string, private transport: ActivityTransport) {}
  close() { this.closed = true; this.sequence++; this.acknowledged = null; }
  async transition(mode: ActivityMode): Promise<ActivityAck> {
    if (this.closed) throw new SupersededActivity('Session closed');
    if (mode === this.desired && this.acknowledged?.sequence === this.sequence) return this.acknowledged;
    if (mode === this.desired && this.pending) return this.pending;
    // After failure, retry the same command rather than allocating another version.
    if (mode !== this.desired || this.sequence === 0) { this.sequence++; this.desired = mode; }
    const sequence = this.sequence;
    const id = `activity-${sequence}`;
    const operation = (async () => {
      let last: unknown;
      for (let attempt = 0; attempt < 3; attempt++) {
        if (this.closed || sequence !== this.sequence) throw new SupersededActivity('New activity intent');
        try {
          const response = await this.transport(mode, sequence, id);
          if (this.closed || sequence !== this.sequence) throw new SupersededActivity('New activity intent');
          const ack = response.activityAck;
          if (!response.ok || !ack || ack.sessionId !== this.sessionId || ack.sequence !== sequence || ack.mode !== mode) throw new Error('Clock acknowledgement unavailable');
          this.acknowledged = ack;
          return ack;
        } catch (error) {
          if (error instanceof SupersededActivity) throw error;
          last = error;
        }
      }
      throw last ?? new Error('Clock pause not acknowledged');
    })();
    this.pending = operation;
    try { return await operation; }
    finally { if (this.pending === operation) this.pending = null; }
  }
  async service<T>(work: (sequence: number) => Promise<T>): Promise<T> {
    const ack = await this.transition('pause');
    if (this.closed || ack.sequence !== this.sequence) throw new SupersededActivity('Session changed');
    return work(ack.sequence);
  }
  async tick(): Promise<ActivityResponse | null> {
    if (this.closed || this.pending || !this.acknowledged || this.desired === 'pause') return null;
    const sequence = this.sequence;
    const response = await this.transport('tick', sequence, `tick-${crypto.randomUUID()}`);
    if (this.closed || sequence !== this.sequence) return null;
    if (!response.ok || response.activityAck?.sessionId !== this.sessionId || response.activityAck.sequence !== sequence) throw new Error('Clock heartbeat not acknowledged');
    return response;
  }
}
