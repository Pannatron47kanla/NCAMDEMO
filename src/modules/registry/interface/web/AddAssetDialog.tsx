import type { CSSProperties, FormEvent, KeyboardEvent } from 'react';
import { addMonths, addYears, iso, thd } from '../../../../shared/dates';
import { baht } from '../../../../shared/money';
import { Icon } from '../../../../shared/web/Icon';
import { useStore } from '../../../../shared/web/useStore';
import { assetInfo } from '../../domain/asset-info';
import { CATS, iconOf, VENDORS } from '../../domain/constants';
import { ROOMS } from '../../domain/locations';
import { digitsOnly, lotSize, NEW_ASSET_STEPS, nextCodes, serialList } from '../../domain/new-asset';
import type { RegistryModule } from '../../module';
import { messageText } from './messages';
import { dialogSteps } from './steps';

export interface AddAssetDialogProps {
  registry: RegistryModule;
  /** Today, from the Clock. */
  now: Date;
  /** Closes the wizard and goes back to the register. */
  onClose(): void;
  /** "พิมพ์ป้าย QR": the labels of the assets just made. */
  onPrintLabels(ids: string[]): void;
  onLocate(assetId: string): void;
  onOpenAsset(assetId: string): void;
  /** "ดูในทะเบียน" after a lot: the register searched for the lot's name. */
  onShowLot(name: string): void;
  /** "กำหนดห้องให้ทั้งล็อต". */
  onScanRoom(): void;
}

const GRID: CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px 16px' };
const FULL: CSSProperties = { gridColumn: '1 / -1' };

// Number of a field of digits, for display only (saving is checked by the domain).
const num = (text: string) => parseInt(text, 10) || 0;

// Add-asset wizard, ported from mockup lines 1293-1409 and the `nf` / `nfd` view values (lines 2382-2455).
export function AddAssetDialog({ registry, now, onClose, onPrintLabels, onLocate, onOpenAsset, onShowLot, onScanRoom }: AddAssetDialogProps) {
  const wizard = registry.addAsset;
  const { form: f, step, doneIds, error } = useStore(wizard.state);
  const assets = useStore(registry.assets);
  const done = doneIds.length > 0;

  const qty = lotSize(f.qty);
  const serials = serialList(f.serials);
  const codes = nextCodes(assets.map((a) => a.code), f.cat, qty);
  const acq = iso(f.acq);
  const life = num(f.life);
  const isPurchase = f.method === 'ซื้อ';
  const isLot = qty > 1;
  const lotTotal = num(f.price) > 0 ? baht(num(f.price) * qty) : '-';
  const namedParts = f.parts.filter((p) => p.name.trim()).length;
  const steps = dialogSteps(NEW_ASSET_STEPS, step, done);
  const pct = done ? 100 : Math.round((step - 1) / NEW_ASSET_STEPS.length * 100);

  const review: { k: string; v: string; bold?: boolean }[] = [
    { k: 'วิธีได้มา', v: f.method + ' · ' + (f.doc || '-') },
    { k: 'วันที่ได้มา', v: acq ? thd(acq) : '-' },
    { k: isPurchase ? 'ผู้ขาย / ราคา' : 'มูลค่าประเมิน', v: (isPurchase ? f.vendor + ' · ' : '') + (f.price ? baht(num(f.price)) : '-') },
    { k: 'จำนวน', v: isLot ? qty + ' ชิ้น (ล็อต) · มูลค่ารวม ' + lotTotal : '1 ชิ้น' },
    { k: 'Serial', v: isLot ? 'ใส่แล้ว ' + Math.min(serials.length, qty) + ' จาก ' + qty : (f.serial || '-') },
    { k: 'ห้อง / สถานที่', v: f.room },
    { k: 'ผู้รับผิดชอบ', v: f.cust || '-' },
    { k: 'ชิ้นส่วน', v: namedParts ? namedParts + ' รายการ' : 'ไม่มี (เครื่องเดี่ยว)' },
    { k: 'กำหนดพิจารณาจำหน่าย', v: acq && life ? thd(addYears(acq, life)) + ' (อายุ ' + life + ' ปี)' : '-', bold: true },
    { k: 'สอบเทียบครั้งแรก', v: f.calib !== '0' && acq ? thd(addMonths(acq, num(f.calib))) : 'ไม่ต้องสอบเทียบ' },
  ];

  const first = done ? assets.find((a) => a.id === doneIds[0]) : undefined;
  const last = done ? assets.find((a) => a.id === doneIds[doneIds.length - 1]) : undefined;
  const lotDone = doneIds.length > 1;

  const submit = (e: FormEvent) => {
    e.preventDefault();
    wizard.next();
  };
  const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
  const digits = (apply: (v: string) => void) => (e: { target: { value: string } }) => apply(digitsOnly(e.target.value));

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(15, 30, 36, 0.48)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px 16px', boxSizing: 'border-box' }}>
      <div role="dialog" aria-modal="true" aria-labelledby="nf-title" onKeyDown={onKey} style={{ width: '100%', maxWidth: 820, maxHeight: 'calc(100vh - 48px)', display: 'flex', flexDirection: 'column', background: '#fff', borderRadius: 12, boxShadow: '0 24px 60px rgba(10, 25, 30, 0.35)', overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '18px 20px 12px' }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h2 id="nf-title" style={{ margin: 0, fontSize: 19, fontWeight: 700 }}>ขึ้นทะเบียนครุภัณฑ์ใหม่</h2>
            <div className="lbl">สำหรับเจ้าหน้าที่พัสดุ หลังตรวจรับ / รับโอน / รับบริจาค</div>
          </div>
          <button type="button" className="btn sm" onClick={onClose} aria-label="ปิดหน้าต่าง" style={{ width: 32, padding: 0, justifyContent: 'center', fontSize: 18, lineHeight: 1 }}>×</button>
        </div>
        <div style={{ padding: '0 20px 14px', borderBottom: '1px solid #e3e9eb', display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
            <span className="lbl">{done ? 'บันทึกเรียบร้อย' : 'ขั้นที่ ' + step + ' จาก ' + NEW_ASSET_STEPS.length + ' · ' + NEW_ASSET_STEPS[step - 1]}</span>
            <span className="lbl" style={{ marginLeft: 'auto', fontVariantNumeric: 'tabular-nums' }}>{pct}%</span>
          </div>
          <div role="progressbar" aria-label="ความคืบหน้าการขึ้นทะเบียน" aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct} style={{ display: 'grid', gridTemplateColumns: 'repeat(5, minmax(0, 1fr))', gap: 6 }}>
            {steps.map((p, i) => (
              <button key={p.label} type="button" disabled={!p.canGo} onClick={() => wizard.goTo(i + 1)} aria-current={p.current ? 'step' : undefined} style={p.btn}>
                <span style={p.bar}></span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}><span style={p.dot}>{p.mark}</span><span style={p.lbl}>{p.label}</span></span>
              </button>
            ))}
          </div>
        </div>

        {!done ? (
          <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', minHeight: 0, flex: 1 }}>
            <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '18px 20px' }}>
              {step === 1 ? (
                <div style={GRID}>
                  <h3 className="h3" style={FULL}>ที่มาของครุภัณฑ์</h3>
                  <div className="fld"><label htmlFor="nf-method" className="lbl">วิธีได้มา *</label>
                    <select id="nf-method" className="inp" value={f.method} onChange={(e) => wizard.edit({ method: e.target.value })}>
                      <option value="ซื้อ">ซื้อ / จ้าง</option><option value="รับโอน">รับโอนจากหน่วยงานอื่น</option><option value="รับบริจาค">รับบริจาค</option>
                    </select></div>
                  <div className="fld"><label htmlFor="nf-doc" className="lbl">เลขที่เอกสารอ้างอิง *</label>
                    <input id="nf-doc" className="inp" placeholder="เช่น ใบตรวจรับ ตร.51/2569" value={f.doc} onChange={(e) => wizard.edit({ doc: e.target.value })} /></div>
                  <div className="fld"><label htmlFor="nf-acq" className="lbl">วันที่ได้มา *</label>
                    <input id="nf-acq" className="inp" type="date" value={f.acq} onChange={(e) => wizard.edit({ acq: e.target.value })} /></div>
                  {isPurchase ? (
                    <>
                      <div className="fld"><label htmlFor="nf-vendor" className="lbl">ผู้ขาย *</label>
                        <select id="nf-vendor" className="inp" value={f.vendor} onChange={(e) => wizard.edit({ vendor: e.target.value })}>
                          {VENDORS.map((o) => <option key={o} value={o}>{o}</option>)}
                        </select></div>
                      <div className="fld"><label htmlFor="nf-price" className="lbl">{isLot ? 'ราคาต่อหน่วย (บาท) *' : 'ราคา (บาท) *'}</label>
                        <input id="nf-price" className="inp" inputMode="numeric" placeholder="0" value={f.price} onChange={digits((price) => wizard.edit({ price }))} /></div>
                    </>
                  ) : (
                    <div className="fld"><label htmlFor="nf-price2" className="lbl">{isLot ? 'มูลค่าประเมินต่อหน่วย (บาท) *' : 'มูลค่าประเมิน (บาท) *'}</label>
                      <input id="nf-price2" className="inp" inputMode="numeric" placeholder="0" value={f.price} onChange={digits((price) => wizard.edit({ price }))} /></div>
                  )}
                  <div className="fld"><label htmlFor="nf-qty" className="lbl">จำนวน (ชิ้น) *</label>
                    <input id="nf-qty" className="inp" inputMode="numeric" value={f.qty} onChange={digits((q) => wizard.edit({ qty: q }))} /></div>
                  <div className="fld"><label htmlFor="nf-warr" className="lbl">ประกันถึงวันที่</label>
                    <input id="nf-warr" className="inp" type="date" value={f.warranty} onChange={(e) => wizard.edit({ warranty: e.target.value })} /></div>
                  {isLot ? (
                    <div style={{ ...FULL, display: 'flex', gap: 10, alignItems: 'flex-start', padding: '10px 12px', borderRadius: 8, background: '#eef8f5', border: '1px solid #cfe5e0', color: '#0b5e57' }}>
                      <span className="chip" style={{ background: '#0d6b66', color: '#fff' }}>ล็อต</span>
                      <div>
                        <div style={{ fontWeight: 600 }}>ขึ้นทะเบียนแบบล็อต {qty} ชิ้น · ออกรหัสแยกทุกชิ้น</div>
                        <div className="lbl" style={{ color: '#2f5f58' }}>ราคาที่กรอกคือราคาต่อหน่วย · มูลค่ารวม {lotTotal} · ทุกชิ้นผูกเอกสารเดียวกันและมีกำหนดพิจารณาจำหน่ายเท่ากัน</div>
                      </div>
                    </div>
                  ) : null}
                </div>
              ) : null}
              {step === 2 ? (
                <div style={GRID}>
                  <h3 className="h3" style={FULL}>รายละเอียดครุภัณฑ์</h3>
                  <div className="fld" style={FULL}><label htmlFor="nf-name" className="lbl">ชื่อครุภัณฑ์ *</label>
                    <input id="nf-name" className="inp" placeholder="เช่น หุ่นฝึกทำแผลและเย็บแผล" value={f.name} onChange={(e) => wizard.edit({ name: e.target.value })} /></div>
                  <div className="fld"><label htmlFor="nf-cat" className="lbl">หมวด *</label>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <Icon kind={iconOf(f.cat)} size={36} />
                      <select id="nf-cat" className="inp" value={f.cat} onChange={(e) => wizard.setCategory(e.target.value)}>
                        {Object.keys(CATS).map((o) => <option key={o} value={o}>{o}</option>)}
                      </select>
                    </div></div>
                  <div className="fld"><label htmlFor="nf-life" className="lbl">อายุการใช้งาน (ปี) *</label>
                    <input id="nf-life" className="inp" inputMode="numeric" value={f.life} onChange={digits((v) => wizard.edit({ life: v }))} /></div>
                  <div className="fld"><label htmlFor="nf-brand" className="lbl">ยี่ห้อ / รุ่น</label>
                    <input id="nf-brand" className="inp" value={f.brand} onChange={(e) => wizard.edit({ brand: e.target.value })} /></div>
                  {!isLot ? (
                    <div className="fld"><label htmlFor="nf-serial" className="lbl">Serial number</label>
                      <input id="nf-serial" className="inp" value={f.serial} onChange={(e) => wizard.edit({ serial: e.target.value })} /></div>
                  ) : (
                    <div className="fld" style={FULL}>
                      <label htmlFor="nf-serials" className="lbl">Serial number ทีละบรรทัด · ยิงเครื่องสแกนต่อกัน หรือวางทั้งคอลัมน์จาก Excel</label>
                      <textarea id="nf-serials" className="inp mono" rows={5} value={f.serials} onChange={(e) => wizard.edit({ serials: e.target.value })}></textarea>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px 12px', alignItems: 'center' }}>
                        <div style={{ flex: '1 1 160px', height: 6, borderRadius: 3, background: '#e3e9eb', overflow: 'hidden' }}>
                          <div style={{ height: '100%', background: '#0d6b66', width: Math.min(100, Math.round(serials.length / Math.max(1, qty) * 100)) + '%' }}></div>
                        </div>
                        <span className="lbl" style={{ fontVariantNumeric: 'tabular-nums' }}>ใส่แล้ว {Math.min(serials.length, qty)} จาก {qty}</span>
                        <button type="button" className="btn sm" onClick={() => wizard.fillDemoSerials()}>จำลองการยิงสแกน</button>
                      </div>
                      <div className="lbl">ชิ้นที่ยังไม่มี serial จะแสดง "ยังไม่ระบุ" เติมทีหลังได้</div>
                    </div>
                  )}
                  <div className="fld"><label htmlFor="nf-calib" className="lbl">รอบสอบเทียบ</label>
                    <select id="nf-calib" className="inp" value={f.calib} onChange={(e) => wizard.edit({ calib: e.target.value })}>
                      <option value="0">ไม่ต้องสอบเทียบ</option><option value="6">ทุก 6 เดือน</option><option value="12">ทุก 12 เดือน</option>
                    </select></div>
                </div>
              ) : null}
              {step === 3 ? (
                <div style={GRID}>
                  <h3 className="h3" style={FULL}>ที่ตั้งและผู้รับผิดชอบ</h3>
                  <div className="fld"><label htmlFor="nf-room" className="lbl">ห้อง / สถานที่ *</label>
                    <select id="nf-room" className="inp" value={f.room} onChange={(e) => wizard.edit({ room: e.target.value })}>
                      {ROOMS.map((r) => <option key={r.name} value={r.name}>{r.name}</option>)}
                    </select></div>
                  <div className="fld"><label htmlFor="nf-cust" className="lbl">ผู้รับผิดชอบพัสดุประจำหน่วยงาน *</label>
                    <input id="nf-cust" className="inp" value={f.cust} onChange={(e) => wizard.edit({ cust: e.target.value })} /></div>
                  <div className="lbl" style={FULL}>ห้องที่เลือกจะใช้แสดงตำแหน่งบนแผนที่ 3 มิติ</div>
                </div>
              ) : null}
              {step === 4 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <h3 className="h3" style={{ marginRight: 'auto' }}>ชิ้นส่วนของชุด (ถ้ามี)</h3>
                    <button type="button" className="btn sm" onClick={() => wizard.addPart()}>+ เพิ่มชิ้นส่วน</button>
                  </div>
                  {f.parts.length === 0 ? <div className="lbl">ไม่มี (เครื่องเดี่ยว) · ชุดหุ่นควรใส่ชิ้นส่วนเพื่อใช้ตรวจตอนยืม-คืน ข้ามขั้นนี้ได้</div> : null}
                  {f.parts.map((p, i) => (
                    <div key={i} style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'flex-end' }}>
                      <div className="fld" style={{ flex: '3 1 180px' }}><label htmlFor={'pn' + i} className="lbl">ชื่อชิ้นส่วน</label>
                        <input id={'pn' + i} className="inp" value={p.name} onChange={(e) => wizard.editPart(i, { name: e.target.value })} /></div>
                      <div className="fld" style={{ flex: '1 1 70px' }}><label htmlFor={'pq' + i} className="lbl">จำนวน</label>
                        <input id={'pq' + i} className="inp" inputMode="numeric" value={p.qty} onChange={digits((v) => wizard.editPart(i, { qty: v }))} /></div>
                      <div className="fld" style={{ flex: '1 1 100px' }}><label htmlFor={'pp' + i} className="lbl">ราคา/ชิ้น</label>
                        <input id={'pp' + i} className="inp" inputMode="numeric" value={p.price} onChange={digits((v) => wizard.editPart(i, { price: v }))} /></div>
                      <button type="button" className="btn sm" onClick={() => wizard.removePart(i)}>ลบ</button>
                    </div>
                  ))}
                </div>
              ) : null}
              {step === 5 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', border: '1px solid #e3e9eb', borderRadius: 8, background: '#f7f9fa' }}>
                    <Icon kind={iconOf(f.cat)} size={40} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600 }}>{f.name.trim() ? f.name.trim() + (f.brand.trim() ? ' (' + f.brand.trim() + ')' : '') : '(ยังไม่ระบุชื่อ)'}</div>
                      <div className="lbl">{f.cat}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div className="lbl">{isLot ? 'ช่วงรหัส ' + qty + ' รหัส (สร้างอัตโนมัติ)' : 'รหัส (สร้างอัตโนมัติ)'}</div>
                      <div className="mono" style={{ fontSize: 16 }}>{isLot ? codes[0] + ' ถึง ' + codes[codes.length - 1]!.slice(-4) : codes[0]}</div>
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '10px 16px' }}>
                    {review.map((r) => (
                      <div key={r.k}><div className="lbl">{r.k}</div><div style={r.bold ? { fontWeight: 600, color: '#0b5e57' } : { fontWeight: 500 }}>{r.v}</div></div>
                    ))}
                  </div>
                  <div className="lbl">แนบใบตรวจรับ คู่มือ และใบรับประกันได้ในระบบจริง</div>
                </div>
              ) : null}
              {error ? <div role="alert" style={{ marginTop: 14, padding: '10px 12px', borderRadius: 6, background: '#fbeef2', color: '#6e1531' }}>{messageText(error.code, error.params)}</div> : null}
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8, padding: '12px 20px', borderTop: '1px solid #e3e9eb', background: '#f7f9fa' }}>
              <button type="button" className="btn" onClick={onClose}>ยกเลิก</button>
              <span style={{ marginLeft: 'auto' }}></span>
              {step > 1 ? <button type="button" className="btn" onClick={() => wizard.back()}>← ย้อนกลับ</button> : null}
              <button type="submit" className="btn pri" style={{ minWidth: 120 }}>
                {step === 5 ? (isLot ? 'บันทึก ' + qty + ' รายการและสร้างป้าย QR' : 'บันทึกและสร้างป้าย QR') : 'ถัดไป →'}
              </button>
            </div>
          </form>
        ) : null}

        {done && first && last ? (
          <>
            <div style={{ padding: '24px 20px', display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 16 }}>
              <Icon kind={iconOf(first.cat)} size={48} />
              <div style={{ flex: '1 1 260px', minWidth: 0 }}>
                <div style={{ fontSize: 18, fontWeight: 700, color: '#0b5e57' }}>{lotDone ? 'ขึ้นทะเบียนแล้ว ' + doneIds.length + ' รายการ' : 'ขึ้นทะเบียนแล้ว'}</div>
                <div>{(lotDone ? first.name + ' × ' + doneIds.length : first.name) + ' · '}<span className="mono">{lotDone ? first.code + ' ถึง ' + last.code.slice(-4) : first.code}</span></div>
                <div className="lbl">{first.room} · กำหนดพิจารณาจำหน่าย {assetInfo(first, now).dispText}</div>
              </div>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, padding: '12px 20px', borderTop: '1px solid #e3e9eb', background: '#f7f9fa' }}>
              <button className="btn" onClick={() => wizard.start()}>ขึ้นทะเบียนรายการถัดไป</button>
              <span style={{ marginLeft: 'auto' }}></span>
              {lotDone ? <button className="btn" onClick={onScanRoom}>กำหนดห้องให้ทั้งล็อต</button> : null}
              <button className="btn" onClick={() => onLocate(first.id)}>ดูบนแผนที่</button>
              <button className="btn" onClick={() => (lotDone ? onShowLot(first.name) : onOpenAsset(first.id))}>{lotDone ? 'ดูในทะเบียน' : 'เปิดรายละเอียด'}</button>
              <button className="btn pri" onClick={() => onPrintLabels(doneIds)}>{lotDone ? 'พิมพ์ป้าย QR ทั้งล็อต (' + doneIds.length + ')' : 'พิมพ์ป้าย QR'}</button>
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}
