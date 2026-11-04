import type { Clock } from '../../shared/clock';
import type { Store } from '../../shared/store';
import { AuditService } from './application/audit-service';
import type { AssetsPort } from './application/ports';
import type { AuditRound } from './domain/round';

export interface AuditPorts {
  assets: AssetsPort;
}

export interface AuditModule {
  /** The audit screen's service. */
  audit: AuditService;
  /** The round as an observable, for screens and for the dashboard, calendar and reports. */
  round: Store<AuditRound>;
}

/** Builds audit from the seed. Every call gives a separate, fresh copy. */
export function createAuditModule(clock: Clock, ports: AuditPorts): AuditModule {
  const audit = new AuditService(clock, ports.assets);
  return { audit, round: audit.round };
}
