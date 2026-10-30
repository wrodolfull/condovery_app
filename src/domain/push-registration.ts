/**
 * A session-scoped gate for Expo device registration.
 * Identical app foreground events coalesce rather than enqueue HTTP writes.
 */
export class PushRegistrationGate {
  private pending: Promise<void> | null = null;
  private nextAllowedAt = 0;
  constructor(
    private readonly now: () => number = Date.now,
    private readonly refreshMs = 15 * 60 * 1000,
    private readonly retryMs = 60 * 1000,
  ) {}

  run(operation: () => Promise<void>, force = false): Promise<void> {
    if (this.pending) return this.pending;
    if (!force && this.now() < this.nextAllowedAt) return Promise.resolve();
    const current = operation();
    // Set pending synchronously before awaiting, even if operation rejects.
    this.pending = current.then(
      () => { this.nextAllowedAt = this.now() + this.refreshMs; },
      error => {
        this.nextAllowedAt = this.now() + this.retryMs;
        throw error;
      },
    ).finally(() => { this.pending = null; });
    return this.pending;
  }
}
