import type { ReactNode } from 'react';
import { chip } from '../../../../shared/web/chip';
import { Icon } from '../../../../shared/web/Icon';
import { useStore } from '../../../../shared/web/useStore';
import { assetInfo } from '../../domain/asset-info';
import { ALL_CATEGORIES, filterAssets, PAGE_SIZES, pageWindow, STATUS_FILTERS } from '../../domain/asset-list';
import { CATS, iconOf } from '../../domain/constants';
import type { RegistryModule } from '../../module';

export interface AssetListScreenProps {
  registry: RegistryModule;
  /** Today, from the Clock. */
  now: Date;
  onOpen(assetId: string): void;
  onRoomScan(): void;
  onImport(): void;
  onAdd(): void;
  /** Prints QR labels for these assets. */
  onPrint(ids: string[]): void;
  /** The dialog drawn over the list (add asset, import). */
  children?: ReactNode;
}

const CATEGORY_OPTIONS = [ALL_CATEGORIES].concat(Object.keys(CATS));
const SR_ONLY = { position: 'absolute', left: -9999 } as const;

// Asset register list, ported from mockup lines 666-704 and the list view values (lines 2351-2362, 2910-2926).
export function AssetListScreen({ registry, now, onOpen, onRoomScan, onImport, onAdd, onPrint, children }: AssetListScreenProps) {
  const list = registry.list;
  const assets = useStore(registry.assets);
  const s = useStore(list.state);

  const filtered = filterAssets(assets, s);
  const win = pageWindow(filtered.length, s.page, s.pageSize);
  const pageRows = filtered.slice(win.start, win.end);
  const selIds = assets.filter((a) => s.selected[a.id]).map((a) => a.id);
  const pageAllSelected = pageRows.length > 0 && pageRows.every((a) => s.selected[a.id]);
  const noRows = filtered.length === 0;
  const pages = Array.from({ length: win.count }, (_, i) => i + 1);

  return (
    <>
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 10 }}>
        <h1 className="h1" style={{ marginRight: 'auto' }}>ทะเบียนครุภัณฑ์</h1>
        <button className="btn" onClick={onRoomScan}>กำหนดห้อง</button>
        <button className="btn" onClick={onImport}>นำเข้าจาก Excel</button>
        <button className="btn" disabled={selIds.length === 0} onClick={() => { if (selIds.length) onPrint(selIds); }}>พิมพ์ QR ที่เลือก ({selIds.length})</button>
        <button className="btn" disabled={noRows} onClick={() => onPrint(filtered.map((a) => a.id))}>พิมพ์ QR ทั้งหมด ({filtered.length})</button>
        <button className="btn pri" onClick={onAdd}>+ ขึ้นทะเบียนใหม่</button>
      </div>
      <div className="card" style={{ padding: 12, display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
        <label htmlFor="q" style={SR_ONLY}>ค้นหา</label>
        <input id="q" className="inp" style={{ flex: '2 1 240px', width: 'auto' }} placeholder="ค้นหารหัส ชื่อ หรือห้อง" value={s.q} onChange={(e) => list.setQuery(e.target.value)} />
        <label htmlFor="fcat" style={SR_ONLY}>หมวด</label>
        <select id="fcat" className="inp" style={{ flex: '1 1 170px', width: 'auto' }} value={s.cat} onChange={(e) => list.setCategory(e.target.value)}>
          {CATEGORY_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
        </select>
        <label htmlFor="fst" style={SR_ONLY}>สถานะ</label>
        <select id="fst" className="inp" style={{ flex: '1 1 160px', width: 'auto' }} value={s.status} onChange={(e) => list.setStatus(e.target.value)}>
          {STATUS_FILTERS.map((o) => <option key={o} value={o}>{o}</option>)}
        </select>
        <span className="lbl">พบ {filtered.length} รายการ</span>
      </div>
      <div className="card" style={{ overflowX: 'auto' }}>
        {selIds.length > 0 ? (
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '8px 12px', padding: '8px 12px', background: '#e8f4f2', borderBottom: '1px solid #cfe5e0', color: '#0b5e57' }}>
            <span style={{ fontWeight: 600 }}>เลือกไว้ {selIds.length} รายการ</span>
            <span className="lbl">เลือกข้ามหน้าได้ รายการที่เลือกจะยังอยู่เมื่อเปลี่ยนหน้า</span>
            <button className="btn sm" style={{ marginLeft: 'auto' }} onClick={() => list.clearSelection()}>ล้างที่เลือก</button>
            <button className="btn sm pri" onClick={() => onPrint(selIds)}>พิมพ์ QR ที่เลือก</button>
          </div>
        ) : null}
        <table className="t">
          <thead>
            <tr>
              <th style={{ width: 36 }}><input type="checkbox" aria-label="เลือกทุกรายการในหน้านี้" checked={pageAllSelected} onChange={() => list.togglePage(pageRows.map((a) => a.id))} style={{ width: 16, height: 16, cursor: 'pointer' }} /></th>
              <th></th><th>รหัสครุภัณฑ์</th><th>ชื่อ</th><th>ห้อง / สถานที่</th><th>สถานะ</th><th>กำหนดพิจารณาจำหน่าย</th><th></th>
            </tr>
          </thead>
          <tbody>
            {pageRows.map((a) => {
              const info = assetInfo(a, now);
              const selected = !!s.selected[a.id];
              return (
                <tr key={a.id} className={selected ? 'on' : ''}>
                  <td><input type="checkbox" aria-label={'เลือก ' + a.code + ' ' + a.name} checked={selected} onChange={() => list.toggleSelected(a.id)} style={{ width: 16, height: 16, cursor: 'pointer' }} /></td>
                  <td style={{ width: 32 }}><Icon kind={iconOf(a.cat)} size={28} /></td>
                  <td className="mono">{a.code}</td>
                  <td><div>{a.name}</div><div className="lbl">{a.cat}</div></td>
                  <td>{a.room}</td>
                  <td><span className="chip" style={chip(a.status)}>{a.status}</span></td>
                  <td><div>{info.dispText}</div><span className="chip" style={chip(info.bucket)}>{info.bucket}</span></td>
                  <td><button className="btn sm" onClick={() => onOpen(a.id)}>เปิด</button></td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {noRows ? <div className="lbl" style={{ padding: '20px 16px' }}>ไม่พบรายการตามเงื่อนไขที่เลือก</div> : null}
        <nav aria-label="เปลี่ยนหน้ารายการ" style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '8px 14px', padding: '10px 12px', borderTop: '1px solid #e3e9eb' }}>
          <span className="lbl" style={{ fontVariantNumeric: 'tabular-nums' }}>แสดง {filtered.length ? win.start + 1 : 0}–{win.end} จาก {filtered.length} รายการ</span>
          <label htmlFor="pgsize" className="lbl" style={{ marginLeft: 'auto' }}>ต่อหน้า</label>
          <select id="pgsize" className="inp" style={{ width: 'auto', height: 32 }} value={String(s.pageSize)} onChange={(e) => list.setPageSize(Number(e.target.value))}>
            {PAGE_SIZES.map((n) => <option key={n} value={String(n)}>{n}</option>)}
          </select>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <button className="btn sm pg" disabled={win.cur <= 1} onClick={() => list.setPage(Math.max(1, win.cur - 1))} aria-label="หน้าก่อนหน้า">‹</button>
            {pages.map((n) => (
              <button key={n} className={n === win.cur ? 'btn sm pg cur' : 'btn sm pg'} aria-current={n === win.cur ? 'page' : undefined} aria-label={'หน้า ' + n} onClick={() => list.setPage(n)}>{n}</button>
            ))}
            <button className="btn sm pg" disabled={win.cur >= win.count} onClick={() => list.setPage(Math.min(win.count, win.cur + 1))} aria-label="หน้าถัดไป">›</button>
          </div>
        </nav>
      </div>
      {children}
    </>
  );
}
