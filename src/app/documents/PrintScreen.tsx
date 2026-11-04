import type { CSSProperties, ReactNode } from 'react';
import { QR_SIZE } from '../../shared/qr';
import { useStore } from '../../shared/web/useStore';
import { auditReportSummary } from '../../modules/audit';
import type { ScreenContext } from '../screens';
import { auctionDocOf, auditDocOf, dispResultOf, formalOf, labelsOf, printTitle, resultCase, slipOf, type FormalData } from './documents';

const BLANK_PRINT = { kind: 'labels', ids: [] as string[], loanId: '', back: 'dash' as const };

// Print preview: mockup lines 1198-1292 and the values built at lines 2822-2867.
export function PrintScreen({ modules, params, go }: ScreenContext) {
  const pr = params.print ?? BLANK_PRINT;
  const now = modules.clock.now();
  const assets = useStore(modules.registry.assets);
  const loans = useStore(modules.circulation.loans);
  const borrowers = useStore(modules.circulation.borrowers);
  const settings = useStore(modules.circulation.settings);
  const round = useStore(modules.audit.round);
  const current = useStore(modules.disposal.current);
  const done = useStore(modules.disposal.done);

  const labels = labelsOf(pr.ids, assets);
  const slip = pr.kind === 'slip' ? slipOf(pr.loanId, loans, borrowers, assets, settings) : null;
  const formal = pr.kind === 'dispResult' ? dispResultOf(resultCase(current, done), assets) : formalOf(pr.kind, assets, now);
  const audit = pr.kind === 'audit' ? auditDocOf(auditReportSummary(round), assets) : null;
  const auction = pr.kind === 'auction' ? auctionDocOf(current, assets) : null;

  let doc: ReactNode = null;
  if (pr.kind === 'labels') doc = <Labels labels={labels} />;
  else if (slip) doc = <Slip slip={slip} />;
  else if (formal) doc = <Formal fm={formal} />;
  else if (audit) doc = <AuditReport doc={audit} />;
  else if (auction) doc = <Auction auc={auction} />;

  return (
    <>
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 10 }}>
        <button className="btn sm" onClick={() => go(pr.back)}>← กลับ</button>
        <h1 className="h1" style={{ marginRight: 'auto' }}>{printTitle(pr.kind, labels.length)}</h1>
        <span className="lbl">ตัวอย่างก่อนพิมพ์ · ระบบจริงพิมพ์ผ่านเครื่องพิมพ์ Windows หรือส่งออก PDF / Excel</span>
      </div>
      <div style={{ background: '#c9d3d6', borderRadius: 8, padding: '24px 16px', overflowX: 'auto' }}>{doc}</div>
    </>
  );
}

const PAPER: CSSProperties = { margin: '0 auto', fontSize: 15, display: 'flex', flexDirection: 'column', gap: 12 };
const INDENT: CSSProperties = { textIndent: '2.5em' };

function Labels({ labels }: { labels: ReturnType<typeof labelsOf> }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12, maxWidth: 920, margin: '0 auto' }}>
      {labels.map((l, i) => (
        <div key={i} className="paper" style={{ display: 'flex', gap: 12, padding: 12, borderRadius: 4, alignItems: 'center' }}>
          <div style={{ display: 'grid', gridTemplateColumns: `repeat(${QR_SIZE}, 4px)`, padding: 6, background: '#fff', border: '1px solid #ddd', flexShrink: 0 }} aria-label="QR code" role="img">
            {l.cells.map((on, c) => <span key={c} style={{ display: 'block', width: 4, height: 4, background: on ? '#111' : '#fff' }} />)}
          </div>
          <div style={{ minWidth: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <div style={{ fontSize: 11 }}>วิทยาลัยพยาบาล [ชื่อวิทยาลัย]</div>
            <div style={{ fontWeight: 600, fontSize: 14, lineHeight: 1.3 }}>{l.name}</div>
            <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 15, fontWeight: 500 }}>{l.code}</div>
            <div style={{ fontSize: 11 }}>{l.room}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

function Slip({ slip }: { slip: NonNullable<ReturnType<typeof slipOf>> }) {
  return (
    <div className="paper" style={{ ...PAPER, maxWidth: 680, padding: '40px 48px', lineHeight: 1.6 }}>
      <div style={{ textAlign: 'center' }}><div style={{ fontSize: 18, fontWeight: 600 }}>ใบยืมครุภัณฑ์ห้องปฏิบัติการพยาบาล</div><div>วิทยาลัยพยาบาล [ชื่อวิทยาลัย]</div></div>
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', gap: 8 }}><span>เลขที่ {slip.id}</span><span>วันที่ยืม {slip.start}</span></div>
      <div>ผู้ยืม {slip.who} รหัส {slip.code} ({slip.info})</div>
      <table className="ft">
        <thead><tr><th>ลำดับ</th><th>รายการ / รหัส</th><th>ชิ้นส่วนที่จ่าย</th></tr></thead>
        <tbody>
          {slip.items.map((i) => <tr key={i.no}><td>{i.no}</td><td>{i.name}<br />{i.code}</td><td>{i.parts}</td></tr>)}
        </tbody>
      </table>
      <div><strong>กำหนดคืน {slip.due}</strong> · คืนช้าปรับ {slip.fine} บาท/วัน · ชิ้นส่วนสูญหายชดใช้ตามราคา + {slip.loss}%</div>
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', gap: 24, marginTop: 28 }}>
        <div style={{ textAlign: 'center' }}>ลงชื่อ ................................ ผู้ยืม<br />({slip.who})</div>
        <div style={{ textAlign: 'center' }}>ลงชื่อ ................................ ผู้จ่าย<br />(เจ้าหน้าที่ห้องปฏิบัติการ)</div>
      </div>
    </div>
  );
}

function Formal({ fm }: { fm: FormalData }) {
  return (
    <div className="paper" style={{ ...PAPER, width: 960, boxSizing: 'border-box', padding: '44px 52px', lineHeight: 1.6 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}><span>{fm.formNo}</span><span>หน้า 1 / 1</span></div>
      <div style={{ textAlign: 'center' }}><div style={{ fontSize: 19, fontWeight: 600 }}>{fm.title}</div><div>ส่วนราชการ วิทยาลัยพยาบาล [ชื่อวิทยาลัย] · {fm.sub}</div><div>ข้อมูล ณ วันที่ 28 ตุลาคม 2569</div></div>
      {fm.intro ? <div style={INDENT}>{fm.intro}</div> : null}
      <table className="ft">
        <thead><tr>{fm.cols.map((h) => <th key={h}>{h}</th>)}</tr></thead>
        <tbody>
          {fm.rows.map((r, i) => (
            <tr key={i}>{r.map((c, j) => <td key={j} style={c.right ? { textAlign: 'right', whiteSpace: 'nowrap' } : undefined}>{c.v}</td>)}</tr>
          ))}
        </tbody>
      </table>
      {fm.total ? <div style={{ textAlign: 'right', fontWeight: 600 }}>{fm.total}</div> : null}
      {fm.outro ? <div style={INDENT}>{fm.outro}</div> : null}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 24, marginTop: 32, textAlign: 'center' }}>
        {fm.signs.map((g) => <div key={g.name}>ลงชื่อ ................................................<br />({g.name})<br />{g.role}</div>)}
      </div>
    </div>
  );
}

function AuditReport({ doc }: { doc: ReturnType<typeof auditDocOf> }) {
  return (
    <div className="paper" style={{ ...PAPER, maxWidth: 760, padding: '40px 48px', lineHeight: 1.6 }}>
      <div style={{ textAlign: 'center' }}><div style={{ fontSize: 18, fontWeight: 600 }}>รายงานผลการตรวจสอบพัสดุประจำปีงบประมาณ 2569</div><div>วิทยาลัยพยาบาล [ชื่อวิทยาลัย] · งวด 1 ต.ค. 68 – 30 ก.ย. 69</div></div>
      <div>เรียน ผู้อำนวยการวิทยาลัยพยาบาล [ชื่อวิทยาลัย]</div>
      <div style={INDENT}>ตามคำสั่งที่ [เลขที่]/2569 คณะกรรมการได้ตรวจสอบพัสดุคงเหลือ ณ วันที่ 30 กันยายน 2569 ตั้งแต่วันที่ 1 ตุลาคม 2569 ผลดังนี้</div>
      <table className="ft">
        <tbody>
          {doc.summary.map((x) => <tr key={x.label}><td>{x.label}</td><td style={{ textAlign: 'right', width: 120 }}>{x.n} รายการ</td></tr>)}
        </tbody>
      </table>
      <div style={{ fontWeight: 600 }}>บัญชีรายการที่ไม่ถูกต้อง ชำรุด หรือสูญไป</div>
      <table className="ft">
        <thead><tr><th>รหัส</th><th>รายการ</th><th>ผล</th></tr></thead>
        <tbody>
          {doc.exceptions.map((x, i) => <tr key={i}><td>{x.code}</td><td>{x.name}</td><td>{x.r}</td></tr>)}
        </tbody>
      </table>
      {doc.exceptions.length === 0 ? <div>ไม่มีรายการที่ไม่ถูกต้อง (หรือยังไม่ได้ยืนยันผล)</div> : null}
      <div style={INDENT}>จึงเรียนมาเพื่อโปรดทราบ และส่งสำเนาให้สำนักงานการตรวจเงินแผ่นดินและหน่วยงานต้นสังกัด</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: 20, marginTop: 24, textAlign: 'center' }}>
        <div>ลงชื่อ ......................... ประธานกรรมการ<br />(อ.ดร.สุภาวดี วงศ์ใหญ่)</div>
        <div>ลงชื่อ ......................... กรรมการ<br />(นายวีระพงษ์ ทองดี)</div>
        <div>ลงชื่อ ......................... กรรมการ<br />(นางสาวอรุณี แสงจันทร์)</div>
      </div>
    </div>
  );
}

function Auction({ auc }: { auc: NonNullable<ReturnType<typeof auctionDocOf>> }) {
  return (
    <div className="paper" style={{ ...PAPER, maxWidth: 760, padding: '44px 52px', lineHeight: 1.7 }}>
      <div style={{ textAlign: 'right', fontSize: 13, color: '#b42318', fontWeight: 600 }}>ร่าง</div>
      <div style={{ textAlign: 'center' }}><div style={{ fontSize: 19, fontWeight: 600 }}>ประกาศวิทยาลัยพยาบาล [ชื่อวิทยาลัย]</div><div>เรื่อง ขายทอดตลาดครุภัณฑ์ที่หมดความจำเป็นหรือเสื่อมสภาพ</div><div>-------------------------</div></div>
      <div style={INDENT}>ด้วยวิทยาลัยพยาบาล [ชื่อวิทยาลัย] มีความประสงค์จะขายทอดตลาดครุภัณฑ์ที่หมดความจำเป็นหรือเสื่อมสภาพ จำนวน {auc.n} รายการ ตามระเบียบกระทรวงการคลังว่าด้วยการจัดซื้อจัดจ้างและการบริหารพัสดุภาครัฐ พ.ศ. 2560 ข้อ 215 ดังรายการต่อไปนี้</div>
      <table className="ft">
        <thead><tr><th>ลำดับ</th><th>รายการ</th><th>รหัสครุภัณฑ์</th><th>จำนวน</th><th>ราคาประเมินขั้นต่ำ (บาท)</th></tr></thead>
        <tbody>
          {auc.items.map((i) => <tr key={i.no}><td>{i.no}</td><td>{i.name}</td><td>{i.code}</td><td>1</td><td>{i.min}</td></tr>)}
        </tbody>
      </table>
      <div style={INDENT}>ผู้สนใจขอดูสภาพครุภัณฑ์ได้ระหว่างวันที่ {auc.viewFrom} ถึง {auc.viewTo} ในวันและเวลาราชการ ณ {auc.place} และกำหนดขายทอดตลาดในวันที่ {auc.day} เวลา 10.00 น. ณ ห้องประชุม [ชื่อห้อง] โดยผู้เสนอราคาสูงสุดเป็นผู้ซื้อ ทั้งนี้ วิทยาลัยฯ ขอสงวนสิทธิ์ที่จะไม่ขายหากราคาต่ำกว่าราคาประเมินขั้นต่ำ</div>
      <div style={INDENT}>จึงประกาศมาให้ทราบโดยทั่วกัน</div>
      <div style={INDENT}>ประกาศ ณ วันที่ {auc.annDate}</div>
      <div style={{ textAlign: 'center', marginTop: 32 }}>ลงชื่อ ................................................<br />([ชื่อผู้อำนวยการ])<br />ผู้อำนวยการวิทยาลัยพยาบาล [ชื่อวิทยาลัย]</div>
    </div>
  );
}
