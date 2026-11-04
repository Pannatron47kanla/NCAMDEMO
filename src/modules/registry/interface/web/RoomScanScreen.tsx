import type { FormEvent } from 'react';
import { Icon } from '../../../../shared/web/Icon';
import { useStore } from '../../../../shared/web/useStore';
import { iconOf, PENDING_ROOM } from '../../domain/constants';
import { ROOMS, roomOf } from '../../domain/locations';
import { scanProgress, type ScanProgress } from './steps';
import { scanSuggestions, tally, type ScanKind } from '../../domain/room-scan';
import type { RegistryModule } from '../../module';
import { messageText } from './messages';

export interface RoomScanScreenProps {
  registry: RegistryModule;
  /** Opens the map on an asset ("ดูบนแผนที่"). */
  onLocate(assetId: string): void;
  /** Opens the map without a selection, when nothing was saved. */
  onOpenMap(): void;
}

const MSG_COLORS = {
  ok: { background: '#e3f2ee', color: '#0b5e57' },
  err: { background: '#fbeef2', color: '#6e1531' },
  warn: { background: '#fcefd9', color: '#6b3b00' },
} as const;

const RESULT: Record<ScanKind, [text: string, bg: string, fg: string]> = {
  new: ['กำหนดห้องใหม่', '#d9f2e3', '#0e5a35'],
  same: ['อยู่ห้องนี้แล้ว', '#eceff0', '#3d4b50'],
  move: ['ย้ายห้อง', '#fcefd9', '#6b3b00'],
  block: ['เปลี่ยนไม่ได้', '#f4e3ea', '#82193a'],
};

const ROOM_OPTIONS = ROOMS.slice().sort((x, y) => (x.b + x.f).localeCompare(y.b + y.f))
  .map((r) => ({ value: r.name, label: r.name + ' · อาคาร ' + r.b.replace('B', '') + ' ชั้น ' + r.f }));

// Room scan screen, ported from mockup lines 1115-1184 and the `rs` view values (lines 2731-2779).
export function RoomScanScreen({ registry, onLocate, onOpenMap }: RoomScanScreenProps) {
  const scanner = registry.roomScan;
  const rs = useStore(scanner.state);
  const assets = useStore(registry.assets);
  const room = rs.room ? roomOf(rs.room) : null;
  const t = tally(rs.items);
  const progress: ScanProgress = scanProgress({
    hasRoom: !!rs.room, itemCount: rs.items.length, waitingMoves: t.moveWait, saveCount: t.save, allDone: !!rs.done && rs.items.length === 0,
  });
  const assetOf = (id: string) => assets.find((a) => a.id === id);
  const chips = scanSuggestions(assets, rs.items);
  const submit = (e: FormEvent) => {
    e.preventDefault();
    scanner.scan();
  };

  return (
    <>
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '8px 12px' }}>
        <h1 className="h1">กำหนดห้องครุภัณฑ์</h1>
        <span className="lbl">เลือกห้องปลายทาง แล้วยิงป้ายครุภัณฑ์ที่อยู่ในห้องนั้นต่อกันไป · เปลี่ยนห้องได้ตลอด</span>
      </div>
      <section className="card" aria-label="ความคืบหน้าการกำหนดห้อง" style={{ padding: '12px 16px 14px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'baseline', gap: '4px 10px' }}>
          <span style={{ fontWeight: 600 }}>ขั้นตอนการกำหนดห้อง</span>
          <span className="lbl">{progress.now}</span>
          <span className="lbl" style={{ marginLeft: 'auto', fontVariantNumeric: 'tabular-nums' }}>{progress.pct}%</span>
        </div>
        <div role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={progress.pct} aria-label="ขั้นตอนการกำหนดห้อง" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '6px 8px' }}>
          {progress.steps.map((p) => (
            <div key={p.label} style={{ display: 'flex', flexDirection: 'column', gap: 6, minWidth: 0 }}>
              <div style={p.bar}></div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}><span style={p.dot}>{p.mark}</span><span style={p.lbl}>{p.label}</span></div>
            </div>
          ))}
        </div>
      </section>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'flex-start' }}>
        <div style={{ flex: '2 1 480px', minWidth: 0, display: 'flex', flexDirection: 'column', gap: 14 }}>
          <section className="card" style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{
              display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 12, padding: '14px 16px', borderRadius: 10,
              ...(rs.room ? { background: '#0d6b66', color: '#fff' } : { background: '#f1f4f5', color: '#46565c', border: '1.5px dashed #b8c5c9' }),
            }}>
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 21.5s-7-6.3-7-11.8a7 7 0 0 1 14 0c0 5.5-7 11.8-7 11.8zM12 7.2a2.4 2.4 0 1 0 0 4.8a2.4 2.4 0 1 0 0-4.8"></path></svg>
              <div style={{ flex: '1 1 240px', minWidth: 0, display: 'flex', flexDirection: 'column', gap: 4 }}>
                <label htmlFor="rs-room" style={{ fontSize: 12.5, opacity: 0.85 }}>ห้องปลายทาง</label>
                <select id="rs-room" className="inp" style={{ height: 40, fontSize: 15, fontWeight: 600, color: '#15232a' }} value={rs.room ?? ''} onChange={(e) => scanner.chooseRoom(e.target.value)}>
                  <option value="">— เลือกห้อง —</option>
                  {ROOM_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
                <div style={{ fontSize: 12.5, opacity: 0.85 }}>{room ? 'อาคาร ' + room.b.replace('B', '') + ' ชั้น ' + room.f : 'เลือกห้องก่อนเริ่มสแกน (ถ้ามีป้าย QR ห้อง ยิงที่ช่องสแกนได้เช่นกัน)'}</div>
              </div>
              {rs.room ? <span className="chip" style={{ background: '#fff', color: '#0b5e57', fontVariantNumeric: 'tabular-nums' }}>สแกนแล้ว {rs.items.filter((i) => i.to === rs.room).length} ชิ้น</span> : null}
            </div>
            <form onSubmit={submit} style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'flex-end' }}>
              <div style={{ flex: '1 1 260px', minWidth: 0, display: 'flex', flexDirection: 'column', gap: 4 }}>
                <label htmlFor="rs-scan" className="lbl">{rs.room ? 'สแกนป้าย QR ครุภัณฑ์' : 'เลือกห้องด้านบนก่อน แล้วสแกนป้าย QR ครุภัณฑ์'}</label>
                <input id="rs-scan" className="inp" style={{ height: 42, fontSize: 16 }} placeholder="ยิงเครื่องสแกน หรือพิมพ์รหัสแล้วกด Enter" value={rs.scan} onChange={(e) => scanner.setScan(e.target.value)} />
              </div>
              <button type="submit" className="btn pri" style={{ height: 42 }}>สแกน</button>
            </form>
            {rs.msg ? <div role="status" style={{ padding: '10px 12px', borderRadius: 6, ...MSG_COLORS[rs.msg.kind] }}>{messageText(rs.msg.code, rs.msg.params)}</div> : null}
            {rs.room ? (
              <>
                <div className="lbl">จำลองการยิงป้ายครุภัณฑ์</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {chips.map((a) => (
                    <button key={a.id} className="btn sm" onClick={() => scanner.scan(a.code)}>
                      <span className="mono">{a.code}</span>{' '}
                      <span style={{ color: '#56666d' }}>{a.name.replace(/ \(.*\)/, '') + ' · ' + (a.room === PENDING_ROOM ? PENDING_ROOM : a.status === 'พร้อมใช้' ? a.room : a.status)}</span>
                    </button>
                  ))}
                </div>
              </>
            ) : null}
          </section>
          <section className="card" style={{ overflowX: 'auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 14px', borderBottom: '1px solid #e3e9eb' }}>
              <h2 className="h3">รายการที่สแกนแล้ว</h2>
              <span className="chip" style={{ background: '#eceff0', color: '#3d4b50' }}>{rs.items.length}</span>
            </div>
            {rs.items.length === 0 ? <div className="lbl" style={{ padding: '20px 14px' }}>ยังไม่มีรายการ</div> : (
              <table className="t">
                <thead><tr><th></th><th>รหัส</th><th>ครุภัณฑ์</th><th>ห้องเดิม → ห้องใหม่</th><th>ผล</th><th></th></tr></thead>
                <tbody>
                  {rs.items.map((i) => {
                    const a = assetOf(i.id);
                    if (!a) return null;
                    const moveOk = i.kind === 'move' && i.ok;
                    const [text, bg, fg] = RESULT[i.kind];
                    return (
                      <tr key={i.id}>
                        <td style={{ width: 32 }}><Icon kind={iconOf(a.cat)} size={26} /></td>
                        <td className="mono">{a.code}</td>
                        <td>{a.name}</td>
                        <td><div className="lbl">{i.from}</div><div>→ {i.kind === 'block' || i.kind === 'same' ? i.from : i.to}</div></td>
                        <td>
                          <span className="chip" style={moveOk ? { background: '#d9f2e3', color: '#0e5a35' } : { background: bg, color: fg }}>{moveOk ? 'ย้ายห้อง (ยืนยันแล้ว)' : text}</span>
                          <div className="lbl">{i.why}</div>
                        </td>
                        <td style={{ whiteSpace: 'nowrap' }}>
                          {i.kind === 'move' ? <><button className={i.ok ? 'btn sm' : 'btn sm pri'} onClick={() => scanner.toggleConfirm(i.id)}>{i.ok ? 'ยกเลิกย้าย' : 'ยืนยันย้าย'}</button>{' '}</> : null}
                          <button className="btn sm" onClick={() => scanner.remove(i.id)} aria-label="เอาออกจากรายการ">เอาออก</button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </section>
        </div>
        <aside className="card" style={{ flex: '1 1 280px', minWidth: 0, padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
          <h2 className="h3">สรุปก่อนบันทึก</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '6px 12px', fontVariantNumeric: 'tabular-nums' }}>
            <span>กำหนดห้องใหม่ (รอระบุห้อง)</span><strong>{t.new}</strong>
            <span>ย้ายห้อง (ยืนยันแล้ว)</span><strong>{t.move}</strong>
            <span className="lbl">ย้ายห้อง รอยืนยัน</span><span className="lbl">{t.moveWait}</span>
            <span className="lbl">อยู่ห้องนี้แล้ว</span><span className="lbl">{t.same}</span>
            <span className="lbl">เปลี่ยนห้องไม่ได้</span><span className="lbl">{t.block}</span>
          </div>
          <div className="lbl" style={{ borderTop: '1px solid #edf1f2', paddingTop: 8 }}>ทุกชิ้นที่บันทึกจะมีประวัติห้องเดิม ห้องใหม่ ผู้ทำ และเวลาใน timeline · ถ้าย้ายข้ามหน่วยงานหรือเปลี่ยนผู้รับผิดชอบ ให้ทำเรื่องโอนย้าย (FR-7.1)</div>
          <button className="btn pri" style={{ height: 42 }} disabled={t.save === 0} onClick={() => scanner.save()}>บันทึก {t.save} รายการ</button>
          <button className="btn" onClick={() => scanner.reset()}>เริ่มใหม่</button>
          {rs.done ? (
            <div style={{ padding: '10px 12px', borderRadius: 6, background: '#e3f2ee', color: '#0b5e57', display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div style={{ fontWeight: 600 }}>{'บันทึกแล้ว ' + rs.done.n + ' รายการ'}</div>
              <button className="btn sm" style={{ alignSelf: 'flex-start' }} onClick={() => (rs.done?.lastId ? onLocate(rs.done.lastId) : onOpenMap())}>ดูบนแผนที่</button>
            </div>
          ) : null}
        </aside>
      </div>
    </>
  );
}
