import { describe, expect, it } from 'vitest';
import { setup } from './helpers';

const verdicts = (rows: { verdict: string }[]) => rows.map((r) => r.verdict);

describe('import of the legacy register', () => {
  it('AC26: every row is classified before anything is added', () => {
    const { importer, assets } = setup();
    const before = assets().length;
    importer.check();
    expect(importer.preview()).toEqual([
      { row: 2, verdict: 'ผ่าน' },
      { row: 3, verdict: 'ผ่าน' },
      { row: 4, verdict: 'ผิด: รหัสซ้ำกับทะเบียน' },
      { row: 5, verdict: 'ผิด: ไม่มีราคา' },
      { row: 6, verdict: 'ผ่าน' },
    ]);
    expect(assets().length).toBe(before);
  });

  it('AC26: only passing rows are added, in the room รอระบุห้อง, with a history line', () => {
    const { importer, assets } = setup();
    const before = assets().length;
    importer.check();
    importer.run();
    const added = assets().slice(before);
    expect(added.map((a) => a.id)).toEqual(['X2', 'X3', 'X6']);
    expect(added.map((a) => a.code)).toEqual(['6515-002-0031', '6515-003-0015', '7440-001-0030']);
    added.forEach((a) => {
      expect(a.room).toBe('รอระบุห้อง');
      expect(a.status).toBe('พร้อมใช้');
      expect(a.acq).toBeNull();
    });
    expect(added[0]!.life).toBe(5);
    expect(added[2]!.life).toBe(4);
    expect(added[0]!.events).toEqual([{ date: '28 ต.ค. 69', text: 'นำเข้าจากทะเบียนเดิม (Excel) แถว 2', doc: 'ทะเบียนครุภัณฑ์เดิม_2568.xlsx' }]);
    expect(importer.state.get()).toMatchObject({ step: 3, result: { ok: 3, skip: 0, bad: 2 } });
  });

  it('AC26: a second import skips what was imported and adds nothing', () => {
    const { importer, assets } = setup();
    importer.check();
    importer.run();
    const after = assets().length;
    importer.start();
    importer.check();
    expect(verdicts(importer.preview())).toEqual(['ข้าม (มีแล้ว)', 'ข้าม (มีแล้ว)', 'ผิด: รหัสซ้ำกับทะเบียน', 'ผิด: ไม่มีราคา', 'ข้าม (มีแล้ว)']);
    importer.run();
    expect(assets().length).toBe(after);
    expect(importer.state.get().result).toMatchObject({ ok: 0, skip: 3, bad: 2 });
  });

  it('AC26: pressing import again on the finished step adds nothing', () => {
    const { importer, assets } = setup();
    importer.check();
    importer.run();
    const after = assets().length;
    importer.run();
    expect(assets().length).toBe(after);
  });

  it('AC26: import only runs from the check step', () => {
    const { importer, assets } = setup();
    const before = assets().length;
    importer.run();
    expect(assets().length).toBe(before);
    expect(importer.state.get().step).toBe(1);
  });

  it('AC26: back and the progress bar go to earlier steps only, and not after the import', () => {
    const { importer } = setup();
    importer.check();
    importer.goTo(3);
    expect(importer.state.get().step).toBe(2);
    importer.goTo(1);
    expect(importer.state.get().step).toBe(1);
    importer.check();
    importer.run();
    importer.goTo(1);
    expect(importer.state.get().step).toBe(3);
  });
});
