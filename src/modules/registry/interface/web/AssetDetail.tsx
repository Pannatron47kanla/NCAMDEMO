import { iso, thd } from '../../../../shared/dates';
import { baht } from '../../../../shared/money';
import { chip } from '../../../../shared/web/chip';
import { Icon } from '../../../../shared/web/Icon';
import type { Asset } from '../../domain/asset';
import { assetInfo } from '../../domain/asset-info';
import { iconOf } from '../../domain/constants';
import { locText } from '../../domain/locations';

export interface AssetDetailProps {
  asset: Asset;
  /** Today, from the Clock. */
  now: Date;
  /** "ถูกยืมโดย ..." line. Circulation owns the loans, so the app passes the text in. */
  holder?: string | null;
  onBack(): void;
  onLocate(): void;
  onPrintLabel(): void;
  onRepair(): void;
}

// Asset detail screen, ported from mockup lines 705-748 and the `d` view values (lines 2364-2381).
export function AssetDetail({ asset: a, now, holder, onBack, onLocate, onPrintLabel, onRepair }: AssetDetailProps) {
  const info = assetInfo(a, now);
  const wDate = iso(a.warranty);
  const inWarranty = !!(wDate && wDate >= now);
  const wText = inWarranty ? 'อยู่ในประกันถึง ' + thd(wDate!) : (wDate ? 'หมดประกัน ' + thd(wDate) : 'ไม่มีข้อมูลประกัน');
  const calText = info.calNext && a.calib
    ? 'ทุก ' + a.calib.cycle + ' เดือน · ครั้งล่าสุด ' + thd(iso(a.calib.last)!) + ' · ครั้งถัดไป ' + thd(info.calNext) + (info.calOff! < 0 ? ' (เลยกำหนด ' + (-info.calOff!) + ' วัน)' : '')
    : 'ไม่ต้องสอบเทียบ';
  const barColor = info.off !== null && info.off < 0 ? '#c0262d' : (info.off !== null && info.off <= 182 ? '#d97706' : '#0d6b66');
  const events = a.events.slice().reverse();

  return (
    <>
      <div><button className="btn sm" onClick={onBack}>← กลับไปทะเบียน</button></div>
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 12 }}>
        <Icon kind={iconOf(a.cat)} size={48} />
        <div style={{ flex: '1 1 300px', minWidth: 0 }}>
          <h1 className="h1">{a.name}</h1>
          <div className="mono" style={{ color: '#56666d' }}>{`${a.code} · ${a.cat}`}</div>
        </div>
        <span className="chip" style={chip(a.status)}>{a.status}</span>
        <button className="btn" onClick={onLocate}>ดูบนแผนที่</button>
        <button className="btn" onClick={onPrintLabel}>พิมพ์ป้าย QR</button>
        <button className="btn warn" onClick={onRepair}>แจ้งซ่อม</button>
      </div>
      {holder ? <div style={{ padding: '10px 12px', borderRadius: 6, background: '#e8eefb', color: '#1d3f80' }}>{holder}</div> : null}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'flex-start' }}>
        <section className="card" style={{ flex: '3 1 380px', minWidth: 0, padding: 16, display: 'grid', gridTemplateColumns: 'minmax(110px, 160px) minmax(0, 1fr)', gap: '8px 16px' }}>
          <div className="lbl">หน่วยงาน</div><div>{a.dept}</div>
          <div className="lbl">ห้อง / สถานที่</div><div>{locText(a.room)}</div>
          <div className="lbl">ผู้รับผิดชอบ</div><div>{a.custodian}</div>
          <div className="lbl">วิธีได้มา</div><div>{a.method}</div>
          <div className="lbl">เอกสารอ้างอิง</div><div>{a.doc}</div>
          <div className="lbl">ผู้ขาย</div><div>{a.vendor}</div>
          <div className="lbl">วันที่ได้มา</div><div>{info.acq ? thd(info.acq) : 'ยังไม่ระบุ'}</div>
          <div className="lbl">ราคา</div><div>{baht(a.price)}</div>
          <div className="lbl">ประกัน</div><div><span className="chip" style={chip(inWarranty ? 'อยู่ในประกัน' : 'หมดประกัน')}>{wText}</span></div>
          <div className="lbl">สอบเทียบ</div><div>{calText}</div>
        </section>
        <section className="card" style={{ flex: '2 1 280px', minWidth: 0, padding: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
          <h2 className="h3">อายุการใช้งาน</h2>
          <div>{`อายุการใช้งาน ${a.life} ปี · ใช้ไปแล้ว ${info.acq ? info.pct + '%' : '-'}`}</div>
          <div style={{ height: 10, borderRadius: 5, background: '#e6ecee', overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${info.pct}%`, background: barColor }} />
          </div>
          <div>กำหนดพิจารณาจำหน่าย <strong>{info.dispText}</strong></div>
          <div><span className="chip" style={chip(info.bucket)}>{info.bucket}</span> <span className="lbl">{info.remain}</span></div>
          <h2 className="h3" style={{ marginTop: 8 }}>ชิ้นส่วนของชุด</h2>
          {a.parts.length > 0
            ? a.parts.map((p, i) => (
              <div key={i} style={{ display: 'flex', gap: 8, padding: '5px 0', borderBottom: '1px solid #edf1f2' }}>
                <span style={{ flex: 1 }}>{`${p.name} × ${p.qty}`}</span>
                <span className="lbl">{p.price ? baht(p.price) + '/ชิ้น' : 'ตัวหลัก'}</span>
              </div>
            ))
            : <div className="lbl">เครื่องเดี่ยว ไม่มีชิ้นส่วนย่อย</div>}
        </section>
      </div>
      <section className="card" style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 4 }}>
        <h2 className="h3" style={{ marginBottom: 6 }}>ประวัติ (ล่าสุดอยู่บน)</h2>
        {events.map((e, i) => (
          <div key={i} style={{ display: 'grid', gridTemplateColumns: '88px minmax(0, 1fr)', gap: 12, padding: '8px 0', borderBottom: '1px solid #edf1f2' }}>
            <div className="lbl" style={{ fontVariantNumeric: 'tabular-nums' }}>{e.date}</div>
            <div><div>{e.text}</div><div className="lbl">{e.doc}</div></div>
          </div>
        ))}
      </section>
    </>
  );
}
