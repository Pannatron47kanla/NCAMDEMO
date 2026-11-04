import { describe, expect, it } from 'vitest';
import { LAB2, STORE } from '../../domain/constants';
import { setup } from './helpers';

function start(room = LAB2) {
  const ctx = setup();
  ctx.roomScan.chooseRoom(room);
  const items = () => ctx.roomScan.state.get().items;
  const msg = () => ctx.roomScan.state.get().msg;
  return { ...ctx, items, msg };
}

describe('room scan: classifying scanned assets', () => {
  it('AC27: with no room chosen the first scan warns and lists nothing', () => {
    const { roomScan } = setup();
    roomScan.scan('6515-002-0001');
    expect(roomScan.state.get().msg).toEqual({ kind: 'warn', code: 'ROOM_REQUIRED' });
    expect(roomScan.state.get().items).toEqual([]);
  });

  it('AC28: an unknown code is rejected and not listed', () => {
    const { roomScan, items, msg } = start();
    roomScan.scan('9999-999-9999');
    expect(items()).toEqual([]);
    expect(msg()).toEqual({ kind: 'err', code: 'ASSET_UNKNOWN', params: { code: '9999-999-9999' } });
  });

  it('AC28: a repeat is not counted twice', () => {
    const { roomScan, items, msg } = start();
    roomScan.scan('6515-002-0001');
    roomScan.scan('6515-002-0001');
    expect(items()).toHaveLength(1);
    expect(msg()).toMatchObject({ kind: 'warn', code: 'SCAN_DUPLICATE' });
  });

  it('AC28: codes match in any letter case and with spaces around them', () => {
    const { roomScan, items } = start();
    roomScan.scan('  rm-b1-101 ');
    roomScan.scan('  6515-002-0001  ');
    roomScan.scan('7440-001-0007\n');
    expect(items().map((i) => i.id)).toEqual(['A17', 'A1']);
    roomScan.scan(' 6515-002-0001 ');
    expect(items()).toHaveLength(2);
  });

  it('AC28: the scan box text is used when no code is given, and the box is cleared', () => {
    const { roomScan, items } = start();
    roomScan.setScan(' 6515-002-0001 ');
    roomScan.scan();
    expect(items()).toHaveLength(1);
    expect(roomScan.state.get().scan).toBe('');
  });

  it.each([
    ['ถูกยืม', 'ถูกยืมอยู่ ต้องรับคืนก่อน'],
    ['จำหน่ายแล้ว', 'ลงจ่ายออกจากทะเบียนแล้ว'],
    ['รอจำหน่าย', 'อยู่ระหว่างเรื่องจำหน่าย'],
  ] as const)('AC28: an asset that is %s is blocked with the reason', (status, why) => {
    const { roomScan, registry, items, msg } = start();
    registry.catalog.setStatus('A1', status);
    roomScan.scan('6515-002-0001');
    expect(items()[0]).toMatchObject({ id: 'A1', kind: 'block', why });
    expect(msg()).toMatchObject({ kind: 'err', code: 'SCAN_BLOCKED', params: { why } });
  });

  it('AC28: an asset waiting for a room is new, one already there is the same, and one elsewhere is a move', () => {
    const { roomScan, registry, items } = start();
    registry.assets.set((list) => list.map((a) => (a.id === 'A3' ? { ...a, room: 'รอระบุห้อง' } : a)));
    roomScan.scan(registry.catalog.findById('A3')!.code);
    const inLab2 = registry.assets.get().find((a) => a.room === LAB2)!;
    roomScan.scan(inLab2.code);
    const elsewhere = registry.assets.get().find((a) => a.room !== LAB2 && a.status === 'พร้อมใช้' && a.room !== 'รอระบุห้อง')!;
    roomScan.scan(elsewhere.code);
    expect(items().map((i) => i.kind)).toEqual(['move', 'same', 'new']);
    expect(items()[0]).toMatchObject({ from: elsewhere.room, to: LAB2, ok: false });
  });

  it('AC28: other statuses (such as รอซ่อม) can still be placed', () => {
    const { roomScan, registry, items } = start(STORE);
    registry.catalog.setStatus('A1', 'รอซ่อม');
    roomScan.scan('6515-002-0001');
    expect(items()[0]!.kind).not.toBe('block');
  });
});
