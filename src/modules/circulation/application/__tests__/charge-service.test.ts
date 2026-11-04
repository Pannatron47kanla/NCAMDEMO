import { describe, expect, it } from 'vitest';
import { DomainError } from '../../../../shared/domain-error';
import { setup } from './helpers';

/** Returns the seed loan (3 days late) so that charge CH1 of 15 baht exists. */
function withCharge() {
  const env = setup();
  env.counter.setMode('return');
  env.counter.scan(env.registry.catalog.findById('A2')!.code);
  env.counter.confirmReturn();
  return env;
}

function payError(env: ReturnType<typeof setup>, id: string): unknown {
  try { env.circulation.cashier.pay(id); } catch (e) { return e; }
  return undefined;
}

describe('charge payment', () => {
  it('AC20: paying with an empty receipt throws RECEIPT_REQUIRED and changes nothing', () => {
    const env = withCharge();
    const { cashier, charges } = env.circulation;
    const error = payError(env, 'CH1');
    expect(error).toBeInstanceOf(DomainError);
    expect((error as DomainError).code).toBe('RECEIPT_REQUIRED');
    cashier.setReceipt('CH1', '   ');
    expect((payError(env, 'CH1') as DomainError).code).toBe('RECEIPT_REQUIRED');
    expect(charges.get()[0]!.paid).toBe(false);
    expect(cashier.state.get().paidN).toBe(0);
  });

  it('AC20: paying with a receipt marks the charge paid with the trimmed number and counts it once', () => {
    const env = withCharge();
    const { cashier, charges } = env.circulation;
    cashier.setReceipt('CH1', ' ร.77/69 ');
    expect(cashier.state.get().receipts['CH1']).toBe(' ร.77/69 ');
    cashier.pay('CH1');
    expect(charges.get()[0]).toMatchObject({ paid: true, receipt: 'ร.77/69' });
    expect(cashier.state.get().paidN).toBe(1);
    cashier.pay('CH1');
    expect(cashier.state.get().paidN).toBe(1);
  });

  it('AC20: paying an unknown charge does nothing', () => {
    const env = withCharge();
    env.circulation.cashier.pay('CH99');
    expect(env.circulation.cashier.state.get().paidN).toBe(0);
  });
});
