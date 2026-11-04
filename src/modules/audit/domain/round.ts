// Annual audit round, ported from mockup lines 1749, 1772, 1908-1926 and 2281-2285.
// Pure functions over a plain state. Nothing here imports another context.

/** The asset ids that make up the audit base (ยอด ณ 30 ก.ย. 69). */
export const AUDIT_SNAPSHOT: readonly string[] = ['A1', 'A2', 'A3', 'A4', 'A5', 'A6', 'A7', 'A8', 'A9', 'A10', 'A11', 'A12', 'A13', 'A14', 'A15', 'A16', 'A17'];

/** The results a committee member can record (mockup OPTS). */
export const AUDIT_OPTIONS: readonly string[] = ['พบ', 'ไม่พบ', 'ชำรุด', 'เสื่อมสภาพ', 'ไม่จำเป็นต้องใช้'];

/** The result that makes the asset lost once confirmed. */
export const NOT_FOUND = 'ไม่พบ';

/** ผลตรวจนับ: one asset's audit result. */
export interface AuditResult {
  r: string;
  /** False while recorded offline and not yet sent to the server. */
  synced: boolean;
  confirmed: boolean;
}

/** An item found that is not in the register. */
export interface UnknownFind {
  code: string;
  note: string;
}

export interface AuditRound {
  offline: boolean;
  res: Record<string, AuditResult>;
  unknown: UnknownFind[];
}

/** The seed: three assets already confirmed as found. */
export function newAuditRound(): AuditRound {
  return {
    offline: false,
    res: {
      A8: { r: 'พบ', synced: true, confirmed: true },
      A9: { r: 'พบ', synced: true, confirmed: true },
      A11: { r: 'พบ', synced: true, confirmed: true },
    },
    unknown: [],
  };
}

export function toggleOffline(round: AuditRound): AuditRound {
  return { ...round, offline: !round.offline };
}

/** Records a result. A confirmed row is locked, so nothing changes. A new result is synced only when online. */
export function setResult(round: AuditRound, id: string, r: string): AuditRound {
  if (round.res[id]?.confirmed) return round;
  return { ...round, res: { ...round.res, [id]: { r, synced: !round.offline, confirmed: false } } };
}

/** Sends every offline result to the server. */
export function sync(round: AuditRound): AuditRound {
  const res: Record<string, AuditResult> = {};
  Object.keys(round.res).forEach((k) => { res[k] = { ...round.res[k]!, synced: true }; });
  return { ...round, res };
}

export interface ConfirmOutcome {
  round: AuditRound;
  /** The results confirmed now, in the order of the round. The caller applies them to the register. */
  applied: { id: string; r: string }[];
}

/** Confirms every synced result that is not confirmed yet. Unsynced results stay as they are. */
export function confirm(round: AuditRound): ConfirmOutcome {
  const res: Record<string, AuditResult> = {};
  const applied: { id: string; r: string }[] = [];
  Object.keys(round.res).forEach((k) => {
    const v = round.res[k]!;
    if (v.synced && !v.confirmed) {
      res[k] = { ...v, confirmed: true };
      applied.push({ id: k, r: v.r });
    } else res[k] = v;
  });
  return { round: { ...round, res }, applied };
}

/** The fixed find the demo button simulates. Only one can be recorded. */
export function scanUnknown(round: AuditRound): AuditRound {
  if (round.unknown.length) return round;
  return { ...round, unknown: [{ code: '6515-002-0099', note: 'พบแต่ไม่มีในทะเบียน · ห้องปฏิบัติการพยาบาล 2' }] };
}

/** The state label of one row: ยังไม่ตรวจนับ, รอซิงก์, รอยืนยัน or ยืนยันแล้ว. */
export function rowState(v: AuditResult | undefined): string {
  return !v ? 'ยังไม่ตรวจนับ' : (v.confirmed ? 'ยืนยันแล้ว' : (v.synced ? 'รอยืนยัน' : 'รอซิงก์'));
}

export interface AuditCounts {
  total: number;
  /** ตรวจแล้ว (any result recorded). */
  scanned: number;
  /** รอซิงก์ */
  unsynced: number;
  /** รอยืนยัน */
  pending: number;
  /** ยืนยันแล้ว */
  done: number;
}

/** The counters of the audit page and dashboard. Only assets in the base are counted. */
export function auditCounts(round: AuditRound): AuditCounts {
  const res = round.res;
  const of = (f: (v: AuditResult) => boolean) => AUDIT_SNAPSHOT.filter((id) => res[id] && f(res[id]!)).length;
  return {
    total: AUDIT_SNAPSHOT.length,
    scanned: of(() => true),
    unsynced: of((v) => !v.synced),
    pending: of((v) => v.synced && !v.confirmed),
    done: of((v) => v.confirmed),
  };
}

export interface AuditReportSummary {
  total: number;
  confirmed: number;
  found: number;
  notFound: number;
  /** ชำรุด + เสื่อมสภาพ */
  damaged: number;
  notNeeded: number;
  unknown: number;
  /** Confirmed rows whose result is not พบ, in base order. */
  exceptions: { id: string; r: string }[];
  unknownFinds: UnknownFind[];
}

/** What the audit report document needs (mockup lines 2862-2866). */
export function auditReportSummary(round: AuditRound): AuditReportSummary {
  const confirmed = AUDIT_SNAPSHOT.filter((id) => round.res[id]?.confirmed);
  const count = (r: string) => confirmed.filter((id) => round.res[id]!.r === r).length;
  return {
    total: AUDIT_SNAPSHOT.length,
    confirmed: confirmed.length,
    found: count('พบ'),
    notFound: count('ไม่พบ'),
    damaged: count('ชำรุด') + count('เสื่อมสภาพ'),
    notNeeded: count('ไม่จำเป็นต้องใช้'),
    unknown: round.unknown.length,
    exceptions: confirmed.filter((id) => round.res[id]!.r !== 'พบ').map((id) => ({ id, r: round.res[id]!.r })),
    unknownFinds: round.unknown,
  };
}
