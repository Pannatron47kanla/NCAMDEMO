import { DisposalScreen as Disposal } from '../modules/disposal';
import { useStore } from '../shared/web/useStore';
import type { ScreenContext } from './screens';

/** Disposal plan screen: reads the registry's assets and opens the auction notice and the result report. */
export function DisposalScreen({ modules, go }: ScreenContext) {
  const assets = useStore(modules.registry.assets);
  return <Disposal disposal={modules.disposal} assets={assets} now={modules.clock.now()} onPrint={(kind) => go('print', { print: { kind, ids: [], loanId: '', back: 'disp' } })} />;
}
