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

describe('room scan: saving', () => {
  function scanned() {
    const ctx = start(LAB2);
    // A3 waits for a room (new), A1 is in another room (move), A5 is already in the room (same), A2 is borrowed (block).
    ctx.registry.assets.set((list) => list.map((a) => (a.id === 'A3' ? { ...a, room: 'รอระบุห้อง' } : a)));
    ['6515-002-0007', '6515-002-0001', '6515-003-0004', '6515-002-0002'].forEach((c) => ctx.roomScan.scan(c));
    const room = (id: string) => ctx.registry.catalog.findById(id)!.room;
    const events = (id: string) => ctx.registry.catalog.findById(id)!.events.length;
    return { ...ctx, room, events };
  }

  it('AC29: a new placement changes room and adds a history line', () => {
    const { roomScan, room, registry } = scanned();
    const before = registry.catalog.findById('A3')!.events.length;
    roomScan.save();
    expect(room('A3')).toBe(LAB2);
    const added = registry.catalog.findById('A3')!.events;
    expect(added).toHaveLength(before + 1);
    expect(added[before]).toEqual({ date: '28 ต.ค. 69', text: 'กำหนดห้อง ' + LAB2 + ' (กำหนดห้องแบบต่อเนื่อง โดย lab.officer)', doc: '-' });
  });

  it('AC29: an unconfirmed move, a same-room item and a blocked item do not change', () => {
    const { roomScan, room, events } = scanned();
    const before = { A1: [room('A1'), events('A1')], A5: [room('A5'), events('A5')], A2: [room('A2'), events('A2')] };
    roomScan.save();
    expect([room('A1'), events('A1')]).toEqual(before.A1);
    expect([room('A5'), events('A5')]).toEqual(before.A5);
    expect([room('A2'), events('A2')]).toEqual(before.A2);
  });

  it('AC29: a confirmed move changes room and the history says from where to where', () => {
    const { roomScan, room, registry } = scanned();
    roomScan.toggleConfirm('A1');
    roomScan.save();
    expect(room('A1')).toBe(LAB2);
    expect(registry.catalog.findById('A1')!.events.at(-1)).toMatchObject({
      text: 'ย้ายจาก ห้องปฏิบัติการพยาบาล 1 ไป ' + LAB2 + ' (กำหนดห้องแบบต่อเนื่อง โดย lab.officer)', doc: '-',
    });
  });

  it('AC29: confirming twice cancels the move', () => {
    const { roomScan, room } = scanned();
    roomScan.toggleConfirm('A1');
    roomScan.toggleConfirm('A1');
    roomScan.save();
    expect(room('A1')).not.toBe(LAB2);
  });

  it('AC29: after saving the list is empty, the room stays and the note says how many changed', () => {
    const { roomScan } = scanned();
    roomScan.toggleConfirm('A1');
    roomScan.save();
    expect(roomScan.state.get()).toMatchObject({ room: LAB2, items: [], done: { n: 2, lastId: 'A1' } });
  });

  it('AC29: saving twice does not move assets or add history twice', () => {
    const { roomScan, registry, events } = scanned();
    const historyBefore = events('A1');
    roomScan.toggleConfirm('A1');
    roomScan.save();
    const snapshot = JSON.stringify(registry.assets.get());
    const done = roomScan.state.get().done;
    roomScan.save();
    roomScan.save();
    expect(JSON.stringify(registry.assets.get())).toBe(snapshot);
    expect(roomScan.state.get().done).toEqual(done);
    expect(events('A1')).toBe(historyBefore + 1);
  });

  it('AC29: saving with only unchanged items does nothing and keeps the list', () => {
    const { roomScan, registry } = start(LAB2);
    roomScan.scan('6515-003-0004');
    const snapshot = JSON.stringify(registry.assets.get());
    roomScan.save();
    expect(JSON.stringify(registry.assets.get())).toBe(snapshot);
    expect(roomScan.state.get().items).toHaveLength(1);
  });

  it('AC29: an item taken off the list is not saved', () => {
    const { roomScan, room } = scanned();
    roomScan.remove('A3');
    roomScan.save();
    expect(room('A3')).toBe('รอระบุห้อง');
  });
});
