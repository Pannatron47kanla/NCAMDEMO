import { AuditScreen as Audit } from '../modules/audit';
import { useStore } from '../shared/web/useStore';
import type { ScreenContext } from './screens';

/** Audit screen: reads the registry's assets and opens the audit report document. */
export function AuditScreen({ modules, go }: ScreenContext) {
  const assets = useStore(modules.registry.assets);
  return <Audit audit={modules.audit} assets={assets} now={modules.clock.now()} onPrint={() => go('print', { print: { kind: 'audit', ids: [], loanId: '', back: 'audit' } })} />;
}
