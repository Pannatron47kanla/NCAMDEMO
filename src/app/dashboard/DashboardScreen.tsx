// Only the heading of the dashboard (mockup lines 395-402). The tiles come in the dashboard task.
export function DashboardScreen() {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '8px 14px' }}>
      <span aria-hidden="true" style={{ display: 'inline-flex', width: 36, height: 36, borderRadius: '50%', background: '#fff', border: '1px solid #d8e1e4', alignItems: 'center', justifyContent: 'center', color: '#0b5e57' }}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
          <path d="M5 20v-5M9.5 20V9M14 20v-7M18.5 20V4" />
        </svg>
      </span>
      <h1 className="h1">แดชบอร์ด</h1>
      <span className="lbl">ข้อมูล ณ 28 ต.ค. 69 · ชี้ที่กล่องเพื่อดูคำอธิบาย คลิกเพื่อดูรายการ</span>
    </div>
  );
}
