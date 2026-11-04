import { useEffect, type CSSProperties } from 'react';
import { th } from '../../shared/dates';
import { chip } from '../../shared/web/chip';
import { Icon } from '../../shared/web/Icon';
import { useStore } from '../../shared/web/useStore';
import type { Asset } from '../../modules/registry';
import { BLD, CATS, DECOR, ROOMS, TREES, assetInfo, bldOf, iconOf, locText } from '../../modules/registry';
import type { MapView } from '../views';
import type { ScreenContext } from '../screens';
import { css } from './css';
import { floorStat, locate, mapAssets, markerSpot, nearEndOfLife, ringOf, unplaced } from './map-logic';

const FH = 34;
const WH = 30;

const TREE_LOOK = {
  r: { w: 30, h: 44, bg: 'radial-gradient(circle at 50% 34%, #8ccb98 0 10px, transparent 10.5px), radial-gradient(circle at 30% 50%, #74b884 0 9px, transparent 9.5px), radial-gradient(circle at 70% 52%, #5fa571 0 9px, transparent 9.5px), radial-gradient(circle at 50% 58%, #6aaf7b 0 10px, transparent 10.5px), linear-gradient(#8b6b50, #7a5c43) 50% 100% / 4px 15px no-repeat' },
  s: { w: 22, h: 54, bg: 'radial-gradient(ellipse 9px 19px at 50% 38%, #6fb27f 0 98%, transparent 100%), radial-gradient(ellipse 6px 13px at 38% 44%, #5a9d6b 0 98%, transparent 100%), linear-gradient(#8b6b50, #7a5c43) 50% 100% / 3px 14px no-repeat' },
  b: { w: 26, h: 20, bg: 'radial-gradient(circle at 32% 60%, #9bd2a5 0 7px, transparent 7.5px), radial-gradient(circle at 66% 58%, #82c290 0 7.5px, transparent 8px), radial-gradient(circle at 50% 42%, #93cc9e 0 7.5px, transparent 8px)' },
};

const WIN = 'background-image:repeating-linear-gradient(90deg,transparent 0 9px,rgba(52,84,94,.28) 9px 19px);background-size:100% 40%;background-position:0 70%;background-repeat:no-repeat;';
const FACE = 'position:absolute;box-sizing:border-box;padding:0;margin:0;border:1px solid rgba(40,60,66,.35);cursor:pointer;font:inherit;display:flex;align-items:flex-start;justify-content:center;overflow:hidden;pointer-events:auto;';

function modeStyle(on: boolean): CSSProperties {
  return css('height:36px;padding:0 18px;border:0;font:inherit;font-size:14px;cursor:pointer;' + (on ? 'background:#0d6b66;color:#fff;font-weight:600' : 'background:#fff;color:#15232a'));
}

// Map screen: mockup lines 750-869 and the values built at lines 2455-2560.
export function MapScreen({ modules, params, go }: ScreenContext) {
  const now = modules.clock.now();
  const view = useStore(modules.views.map);
  const assets = useStore(modules.registry.assets);
  const loans = useStore(modules.circulation.loans);
  const borrowers = useStore(modules.circulation.borrowers);
  const patch = (p: Partial<MapView>) => modules.views.map.set((v) => ({ ...v, ...p }));

  // "ดูบนแผนที่" arrives with the asset to show; the building, floor and view follow from its room.
  const target = params.selAsset;
  useEffect(() => {
    if (target) modules.views.map.set((v) => ({ ...v, ...locate(modules.registry.catalog.findById(target)) }));
  }, [target, modules]);

  const shown = mapAssets(assets, view.cat);
  const is3d = view.view === '3d';
  const angle = view.angle;
  const stat = (b: string, f: number) => floorStat(shown, b, f, now);
  const curRooms = ROOMS.filter((r) => r.b === view.building && r.f === view.floor);
  const curDecor = DECOR.filter((r) => r.b === view.building && r.f === view.floor);
  const sfStat = stat(view.building, view.floor);
  const sfTitle = (bldOf(view.building)?.name ?? '') + ' ชั้น ' + view.floor;
  const roomCount = (name: string) => shown.filter((a) => a.room === name).length;
  const selected: Asset | undefined = assets.find((a) => a.id === view.sel);
  const heldLoan = selected ? loans.find((l) => l.items.some((i) => i.assetId === selected.id && !i.returned)) : undefined;
  const holder = heldLoan ? 'ตอนนี้อยู่กับ ' + (borrowers.find((b) => b.code === heldLoan.borrowerCode)?.name ?? '') + ' (คืน ' + th(heldLoan.due, 0) + ')' : 'อยู่ในห้องประจำ';
  const lost = unplaced(assets);

  return (
    <>
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '8px 16px' }}>
        <h1 className="h1" style={{ marginRight: 'auto' }}>แผนที่ตำแหน่งครุภัณฑ์</h1>
        <div style={{ display: 'flex', border: '1px solid #b8c5c9', borderRadius: 8, overflow: 'hidden' }}>
          <button style={modeStyle(is3d)} onClick={() => patch({ view: '3d' })}>ภาพรวม 3 มิติ</button>
          <button style={modeStyle(!is3d)} onClick={() => patch({ view: 'floor' })}>แผนผังชั้น</button>
        </div>
      </div>
      <div className="card" style={{ padding: '10px 12px', display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center' }}>
        <span className="lbl" style={{ marginRight: 4 }}>กรองหมวด</span>
        {['ทั้งหมด', ...Object.keys(CATS)].map((k) => (
          <button key={k} className="btn sm" style={view.cat === k ? css('background:#15232a;color:#fff;border-color:#15232a') : undefined} onClick={() => patch({ cat: k })}>{k}</button>
        ))}
      </div>
      {is3d ? (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'flex-start' }}>
          <div className="card" style={{ flex: '3 1 600px', minWidth: 0, overflow: 'hidden' }}>
            <Toolbar text="คลิกชั้นของอาคารเพื่อเลือก · ตัวเลขบนผนัง = จำนวนครุภัณฑ์ในชั้น · แดง = มีรายการต้องดูแล" angle={angle} patch={patch} />
            <div style={{ overflowX: 'auto' }}>
              <div className="scene3d" style={{ position: 'relative', width: 900, height: 660, perspective: 2400, perspectiveOrigin: '50% 35%', overflow: 'hidden', background: '#f3f6f7' }}>
                <div style={css('position:absolute;left:110px;top:140px;width:680px;height:480px;transform-style:preserve-3d;transform:rotateX(55deg) rotateZ(' + angle + 'deg);transition:transform .7s ease;background:#fbfcfc;border:1px solid #cfd8db;border-radius:8px')}>
                  <div style={css('position:absolute;left:0;top:236px;width:680px;height:28px;background:#e2e7e9;transform:translateZ(1px)')} />
                  <div style={css('position:absolute;left:352px;top:0;width:26px;height:480px;background:#e2e7e9;transform:translateZ(1px)')} />
                  <div style={css('position:absolute;left:400px;top:290px;width:250px;height:160px;border-radius:10px;background:#e3f1e6;border:1px solid #d0e6d5;transform:translateZ(1px);display:flex;align-items:center;justify-content:center;color:#4f6e57;font-size:13px')}>ลานกิจกรรม</div>
                  <div style={css('position:absolute;left:12px;top:8px;font-size:13px;font-weight:700;color:#46565c;transform:translateZ(1px)')}>ทิศเหนือ ↑</div>
                  {TREES.map((t, i) => <Tree key={i} t={t} angle={angle} />)}
                  {BLD.flatMap((b) => Array.from({ length: b.floors }, (_, i) => i + 1).map((f) => (
                    <FloorBlock key={b.id + f} b={b} f={f} stat={stat(b.id, f)} selected={view.building === b.id && view.floor === f} sameBuilding={view.building === b.id} pick={() => patch({ building: b.id, floor: f })} />
                  )))}
                  {BLD.map((b) => {
                    let tot = 0;
                    let al = 0;
                    for (let f = 1; f <= b.floors; f++) { const s = stat(b.id, f); tot += s.n; al += s.alerts; }
                    return (
                      <div key={b.id} style={css('position:absolute;left:' + (b.x + b.w / 2) + 'px;top:' + (b.y + b.d / 2) + 'px;width:0;height:0;transform-style:preserve-3d;transform:translateZ(' + (b.floors * FH + 8) + 'px);pointer-events:none')}>
                        <div style={css('position:absolute;left:0;top:0;transform-origin:0 0;transform:rotateZ(' + (-angle) + 'deg) rotateX(-55deg) translate(-50%,-100%);white-space:nowrap;padding:4px 10px;border-radius:6px;font-size:12.5px;font-weight:600;line-height:1.35;text-align:center;box-shadow:0 2px 6px rgba(20,40,50,.25);color:#fff;background:' + (view.building === b.id ? '#0d6b66' : '#15232a'))}>
                          <div>{b.name}</div>
                          <div style={{ fontWeight: 400, fontSize: 11.5, opacity: 0.92 }}>{tot + ' รายการ' + (al ? ' · ต้องดูแล ' + al : '')}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
          <aside style={{ flex: '1 1 280px', minWidth: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <section className="card" style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <h2 className="h3">{sfTitle}</h2>
              <div className="lbl">{sfStat.n} รายการ · ต้องดูแล {sfStat.alerts} รายการ</div>
              {curRooms.map((r) => (
                <div key={r.name} style={{ display: 'flex', gap: 8, padding: '4px 0', borderBottom: '1px solid #edf1f2' }}><span style={{ flex: 1 }}>{r.name}</span><span className="lbl">{roomCount(r.name) + ' รายการ'}</span></div>
              ))}
              {curRooms.length === 0 ? <div className="lbl">ไม่มีห้องที่เก็บครุภัณฑ์ในชั้นนี้</div> : null}
              <div className="lbl">ห้องอื่นในชั้น: {curDecor.map((r) => r.name).join(', ') || '-'}</div>
              <button className="btn pri sm" style={{ alignSelf: 'flex-start' }} onClick={() => patch({ view: 'floor' })}>เปิดแผนผังชั้นนี้</button>
            </section>
            <section className="card" style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
              <h2 className="h3">อาคารและชั้น</h2>
              {BLD.map((b) => (
                <div key={b.id} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <div style={{ fontWeight: 600, fontSize: 13.5 }}>{b.name}</div>
                  {Array.from({ length: b.floors }, (_, i) => b.floors - i).map((f) => {
                    const st = stat(b.id, f);
                    const sel = view.building === b.id && view.floor === f;
                    return (
                      <button key={f} style={css('display:flex;align-items:center;gap:8px;width:100%;min-height:34px;padding:0 10px;border-radius:6px;border:1px solid ' + (sel ? '#0d6b66' : '#e3e9eb') + ';background:' + (sel ? '#dff0ed' : '#fff') + ';font:inherit;font-size:13.5px;cursor:pointer;text-align:left;color:#15232a')} onClick={() => patch({ building: b.id, floor: f })}>
                        <span style={{ flex: 1 }}>{'ชั้น ' + f}</span><span className="lbl">{st.n + ' รายการ'}</span>
                        {st.alerts > 0 ? <span className="chip" style={{ background: '#fbe2e3', color: '#a3191f' }}>{'ต้องดูแล ' + st.alerts}</span> : null}
                      </button>
                    );
                  })}
                </div>
              ))}
            </section>
          </aside>
        </div>
      ) : (
        <>
          <div className="card" style={{ padding: '10px 12px', display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
            <button className="btn sm" onClick={() => patch({ view: '3d' })}>← ภาพ 3 มิติ</button>
            <label htmlFor="floor-sel" className="lbl">อาคาร / ชั้น</label>
            <select id="floor-sel" className="inp" style={{ width: 'auto' }} value={view.building + '-' + view.floor} onChange={(e) => { const p = e.target.value.split('-'); patch({ building: p[0]!, floor: parseInt(p[1]!, 10) }); }}>
              {BLD.flatMap((b) => Array.from({ length: b.floors }, (_, i) => i + 1).map((f) => <option key={b.id + f} value={b.id + '-' + f}>{b.name + ' ชั้น ' + f}</option>))}
            </select>
            <span className="lbl">คลิกไอคอนเพื่อดูรายละเอียด</span>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'flex-start' }}>
            <div className="card" style={{ flex: '3 1 600px', minWidth: 0, overflow: 'hidden' }}>
              <Toolbar text={sfTitle + ' · คลิกไอคอนเพื่อดูรายละเอียด · ห้องสีเทา = ห้องที่ไม่มีครุภัณฑ์ในระบบ'} angle={angle} patch={patch} />
              <div style={{ overflowX: 'auto' }}>
                <div className="scene3d" style={{ position: 'relative', width: 900, height: 600, perspective: 2400, perspectiveOrigin: '50% 35%', overflow: 'hidden', background: '#f3f6f7' }}>
                  <div style={css('position:absolute;left:10px;top:70px;width:880px;height:490px;transform-style:preserve-3d;transform:rotateX(55deg) rotateZ(' + angle + 'deg) scale(0.8);transition:transform .7s ease;background:#fbfcfc;border:2px solid #3d4b50;border-radius:4px')}>
                    <div style={css('position:absolute;left:20px;top:270px;width:840px;height:50px;background:#eef1f2;border:1px dashed #b8c5c9;display:flex;align-items:center;justify-content:center;color:#56666d;font-size:12.5px;transform:translateZ(1px)')}>ทางเดิน · บันไดและลิฟต์อยู่ปลายทางเดินด้านขวา</div>
                    {curRooms.map((r) => <PlanRoom key={r.name} r={r} decor={false} n={'· ' + roomCount(r.name) + ' รายการ'} angle={angle} />)}
                    {curDecor.map((r) => <PlanRoom key={r.name} r={r} decor n="" angle={angle} />)}
                    {curRooms.flatMap((r) => shown.filter((a) => a.room === r.name).map((a, i) => {
                      const { x, y } = markerSpot(r, i);
                      const sel = view.sel === a.id;
                      const title = a.name + ' · ' + a.code + ' · ' + a.status;
                      return (
                        <div key={a.id} style={css('position:absolute;left:' + (x + 19) + 'px;top:' + (y + 24) + 'px;width:0;height:0;transform-style:preserve-3d')}>
                          <div style={css('position:absolute;left:-13px;top:-6px;width:26px;height:12px;border-radius:50%;background:rgba(20,40,50,.22);transform:translateZ(2px)')} />
                          <div style={css('position:absolute;left:0;top:0;transform-origin:0 0;transform:rotateZ(' + (-angle) + 'deg) rotateX(-55deg) translate(-50%,-100%);display:flex;flex-direction:column;align-items:center')}>
                            <button className="mk" style={css('position:relative;width:38px;height:38px;padding:0;box-sizing:border-box;border-radius:8px;border:' + ringOf(a) + ';background:#fff;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 5px rgba(20,40,50,.2);' + (sel ? 'outline:3px solid #0d6b66;outline-offset:1px;' : ''))} title={title} aria-label={title} onClick={() => patch({ sel: a.id })}>
                              <Icon kind={iconOf(a.cat)} size={28} />
                              {nearEndOfLife(a, now) ? <span style={css('position:absolute;right:-4px;top:-4px;width:10px;height:10px;border-radius:50%;background:#c0262d;border:2px solid #fff')} /> : null}
                            </button>
                            <div style={css('width:2px;height:12px;background:' + (sel ? '#0d6b66' : '#7f959c'))} />
                          </div>
                        </div>
                      );
                    }))}
                  </div>
                </div>
              </div>
            </div>
            <aside style={{ flex: '1 1 260px', minWidth: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
              <section className="card" style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 8 }}>
                {selected ? (
                  <>
                    <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                      <Icon kind={iconOf(selected.cat)} size={40} />
                      <div style={{ minWidth: 0 }}><div style={{ fontWeight: 600 }}>{selected.name}</div><div className="mono" style={{ color: '#56666d' }}>{selected.code}</div></div>
                    </div>
                    <div><span className="chip" style={chip(selected.status)}>{selected.status}</span></div>
                    <div className="lbl">{locText(selected.room)}</div>
                    <div className="lbl">{holder}</div>
                    <div className="lbl">กำหนดพิจารณาจำหน่าย {assetInfo(selected, now).dispText}</div>
                    <button className="btn sm pri" style={{ alignSelf: 'flex-start' }} onClick={() => go('asset', { selAsset: selected.id })}>เปิดรายละเอียด</button>
                  </>
                ) : <div className="lbl">คลิกไอคอนบนแผนที่เพื่อดูข้อมูล</div>}
              </section>
              <section className="card" style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 6 }}>
                <h2 className="h3">สัญลักษณ์</h2>
                <Legend box={{ border: '2px solid #d8e1e4' }} text="พร้อมใช้" />
                <Legend box={{ border: '2px solid #1d4a99' }} text="ถูกยืมออกจากห้อง" />
                <Legend box={{ border: '2px solid #b45309' }} text="รอซ่อม / ชิ้นส่วนไม่ครบ" />
                <Legend box={{ border: '2px dashed #82193a' }} text="ไม่พบ / รอจำหน่าย" />
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><span style={{ width: 10, height: 10, borderRadius: '50%', background: '#c0262d', margin: '0 4px' }} /><span className="lbl">จุดแดง = ครบอายุใช้งานแล้วหรือภายใน 6 เดือน</span></div>
              </section>
              {lost.length > 0 ? (
                <section className="card" style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <h2 className="h3">ยังไม่ระบุตำแหน่ง</h2>
                  {lost.map((u) => <div key={u.id} style={{ display: 'flex', gap: 8, alignItems: 'center' }}><Icon kind={iconOf(u.cat)} size={22} /><span className="lbl">{u.name + ' · ' + u.code}</span></div>)}
                </section>
              ) : null}
            </aside>
          </div>
        </>
      )}
    </>
  );

}

function Toolbar({ text, angle, patch }: { text: string; angle: number; patch(p: Partial<MapView>): void }) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8, padding: '10px 12px', borderBottom: '1px solid #edf1f2' }}>
      <span className="lbl" style={{ marginRight: 'auto' }}>{text}</span>
      <button className="btn sm" onClick={() => patch({ angle: angle - 90 })}>หมุนซ้าย</button>
      <button className="btn sm" onClick={() => patch({ angle: angle + 90 })}>หมุนขวา</button>
    </div>
  );
}

function Legend({ box, text }: { box: CSSProperties; text: string }) {
  return <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><span style={{ width: 18, height: 18, borderRadius: 5, ...box }} /><span className="lbl">{text}</span></div>;
}

function Tree({ t, angle }: { t: (typeof TREES)[number]; angle: number }) {
  const L = TREE_LOOK[t[2]];
  const k = t[3];
  const w = Math.round(L.w * k);
  const h = Math.round(L.h * k);
  const bg = L.bg.replace(/(\d+(?:\.\d+)?)px/g, (_m, n: string) => (Math.round(parseFloat(n) * k * 10) / 10) + 'px');
  return (
    <>
      <div style={css('position:absolute;left:' + (t[0] - w * 0.45) + 'px;top:' + (t[1] - w * 0.25) + 'px;width:' + Math.round(w * 0.9) + 'px;height:' + Math.round(w * 0.5) + 'px;border-radius:50%;background:rgba(60,90,70,.16);transform:translateZ(1px);pointer-events:none')} />
      <div style={css('position:absolute;left:' + t[0] + 'px;top:' + t[1] + 'px;width:0;height:0;transform-style:preserve-3d;transform:translateZ(1px);pointer-events:none')}>
        <div style={{ ...css('position:absolute;left:0;top:0;width:' + w + 'px;height:' + h + 'px;transform-origin:0 0;transform:rotateZ(' + (-angle) + 'deg) rotateX(-55deg) translate(-50%,-100%);transition:transform .7s ease'), background: bg, backgroundRepeat: 'no-repeat' }} />
      </div>
    </>
  );
}

interface FloorBlockProps {
  b: (typeof BLD)[number];
  f: number;
  stat: { n: number; alerts: number };
  selected: boolean;
  sameBuilding: boolean;
  pick(): void;
}

function FloorBlock({ b, f, stat, selected: sel, sameBuilding: bs, pick }: FloorBlockProps) {
  const h = FH - 3;
  const top = sel ? '#bfe5de' : (bs ? '#f1f8f6' : '#ffffff');
  const sideA = sel ? '#8fcfc5' : (bs ? '#dde9e7' : '#e3e8ea');
  const sideB = sel ? '#6fb9ae' : (bs ? '#c6d8d5' : '#cdd5d9');
  const txt = 'ชั้น ' + f + ' · ' + stat.n + ' รายการ' + (stat.alerts ? ' · ต้องดูแล ' + stat.alerts : '');
  const tagSt = css('margin-top:3px;padding:0 5px;border-radius:3px;font-size:11px;line-height:1.5;white-space:nowrap;font-weight:600;background:rgba(255,255,255,.9);color:' + (stat.alerts ? '#a3191f' : '#20333a'));
  return (
    <div style={css('position:absolute;left:' + b.x + 'px;top:' + b.y + 'px;width:' + b.w + 'px;height:' + b.d + 'px;transform-style:preserve-3d;transform:translateZ(' + ((f - 1) * FH) + 'px);pointer-events:none')}>
      <button tabIndex={-1} aria-hidden="true" style={css(FACE + WIN + 'left:0;top:0;width:' + b.w + 'px;height:' + h + 'px;background-color:' + sideA + ';transform-origin:top;transform:rotateX(90deg)')} onClick={pick}><span style={tagSt}>{txt}</span></button>
      <button tabIndex={-1} aria-hidden="true" style={css(FACE + WIN + 'left:0;top:0;width:' + h + 'px;height:' + b.d + 'px;background-color:' + sideB + ';transform-origin:left;transform:rotateY(-90deg)')} onClick={pick} />
      <button tabIndex={-1} aria-hidden="true" style={css(FACE + WIN + 'left:' + (b.w - h) + 'px;top:0;width:' + h + 'px;height:' + b.d + 'px;background-color:' + sideB + ';transform-origin:right;transform:rotateY(90deg)')} onClick={pick} />
      <button aria-label={b.name + ' ชั้น ' + f + ' มีครุภัณฑ์ ' + stat.n + ' รายการ'} style={css(FACE + WIN + 'left:0;top:' + (b.d - h) + 'px;width:' + b.w + 'px;height:' + h + 'px;background-color:' + sideA + ';transform-origin:bottom;transform:rotateX(-90deg)')} onClick={pick}><span style={tagSt}>{txt}</span></button>
      <button tabIndex={-1} aria-hidden="true" style={css(FACE + 'left:0;top:0;width:' + b.w + 'px;height:' + b.d + 'px;background:' + top + ';transform:translateZ(' + h + 'px)')} onClick={pick} />
    </div>
  );
}

function PlanRoom({ r, decor, n, angle }: { r: (typeof ROOMS)[number]; decor: boolean; n: string; angle: number }) {
  const wall = 'position:absolute;box-sizing:border-box;background:' + (decor ? 'rgba(236,240,241,.55)' : 'rgba(255,255,255,.6)') + ';border:1px solid ' + (decor ? '#c3cfd3' : '#7f959c') + ';';
  return (
    <div style={css('position:absolute;left:' + r.x + 'px;top:' + r.y + 'px;width:' + r.w + 'px;height:' + r.h + 'px;transform-style:preserve-3d')}>
      <div style={css('position:absolute;left:0;top:0;width:' + r.w + 'px;height:' + r.h + 'px;box-sizing:border-box;background:' + (decor ? '#eef1f2' : '#ffffff') + ';border:1px solid ' + (decor ? '#c3cfd3' : '#7f959c') + ';transform:translateZ(1px)')} />
      <div style={css(wall + 'left:0;top:0;width:' + r.w + 'px;height:' + WH + 'px;transform-origin:top;transform:rotateX(90deg)')} />
      <div style={css(wall + 'left:0;top:0;width:' + WH + 'px;height:' + r.h + 'px;transform-origin:left;transform:rotateY(-90deg)')} />
      <div style={css(wall + 'left:' + (r.w - WH) + 'px;top:0;width:' + WH + 'px;height:' + r.h + 'px;transform-origin:right;transform:rotateY(90deg)')} />
      <div style={css(wall + 'left:0;top:' + (r.h - WH) + 'px;width:' + r.w + 'px;height:' + WH + 'px;transform-origin:bottom;transform:rotateX(-90deg)')} />
      <div style={css('position:absolute;left:' + (r.w / 2) + 'px;top:' + (r.h / 2) + 'px;width:0;height:0;transform-style:preserve-3d;transform:translateZ(' + (WH + 34) + 'px);pointer-events:none')}>
        <div style={css('position:absolute;left:0;top:0;transform-origin:0 0;transform:rotateZ(' + (-angle) + 'deg) rotateX(-55deg) translate(-50%,-100%);white-space:nowrap;padding:2px 8px;border-radius:5px;font-size:12px;line-height:1.5;' + (decor ? 'background:rgba(255,255,255,.85);color:#56666d;border:1px solid #d8e1e4' : 'background:#15232a;color:#fff'))}>
          <span style={{ fontWeight: 600 }}>{r.name}</span> <span style={{ fontWeight: 400, opacity: 0.85 }}>{n}</span>
        </div>
      </div>
    </div>
  );
}
