import type { FormEvent } from 'react';
import { ROLES } from './roles';

interface Props {
  role: string;
  onRole(role: string): void;
  onLogin(): void;
}

// Mockup lines 350-373. The password is not checked and the role restricts nothing.
export function Login({ role, onRole, onLogin }: Props) {
  const submit = (e: FormEvent) => {
    e.preventDefault();
    onLogin();
  };
  return (
    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '56px 16px', background: '#eaf0f1' }}>
      <form onSubmit={submit} className="card" style={{ width: '100%', maxWidth: 420, boxSizing: 'border-box', padding: 32, display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <div style={{ fontSize: 22, fontWeight: 700 }}>เข้าสู่ระบบ</div>
          <div className="lbl">ใช้บัญชีของวิทยาลัย (เชื่อม Active Directory เมื่อมี)</div>
        </div>
        <label htmlFor="lg-user" className="lbl">ชื่อผู้ใช้</label>
        <input id="lg-user" className="inp" defaultValue="lab.officer" readOnly />
        <label htmlFor="lg-pass" className="lbl">รหัสผ่าน</label>
        <input id="lg-pass" className="inp" type="password" defaultValue="demo-password" readOnly />
        <label htmlFor="lg-role" className="lbl">บทบาท (สำหรับสาธิต)</label>
        <select id="lg-role" className="inp" value={role} onChange={(e) => onRole(e.target.value)}>
          {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
        </select>
        <button type="submit" className="btn pri" style={{ height: 44, marginTop: 6 }}>เข้าสู่ระบบ</button>
        <div className="lbl">ต้นแบบนี้ไม่เชื่อมเซิร์ฟเวอร์จริง ทุกการกระทำเก็บอยู่ในหน้าจอนี้เท่านั้น</div>
      </form>
    </div>
  );
}
