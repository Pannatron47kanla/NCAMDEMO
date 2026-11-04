/**
 * A business rule was broken. The `code` is what domain tests assert; each context's
 * `interface/web/messages.ts` turns it (with `params`) into the exact Thai text.
 */
export class DomainError extends Error {
  constructor(readonly code: string, readonly params?: Record<string, string | number>) {
    super(code);
    this.name = 'DomainError';
  }
}
