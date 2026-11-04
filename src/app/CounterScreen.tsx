import { CounterScreen as Counter } from '../modules/circulation';
import { useStore } from '../shared/web/useStore';
import type { ScreenContext } from './screens';

/** Counter screen: reads the registry's assets and wires the slip button to navigation. */
export function CounterScreen({ modules, go }: ScreenContext) {
  const assets = useStore(modules.registry.assets);
  return (
    <Counter
      circulation={modules.circulation}
      assets={assets}
      now={modules.clock.now()}
      onPrintSlip={(loanId) => go('print', { print: { kind: 'slip', ids: [], loanId, back: 'counter' } })}
    />
  );
}
