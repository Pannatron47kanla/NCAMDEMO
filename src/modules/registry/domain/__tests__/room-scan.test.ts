import { describe, expect, it } from 'vitest';
import { ROOMS, roomCode } from '../locations';
import { chooseRoom, newRoomScan, scanCode } from '../room-scan';

describe('room scan: choosing the room', () => {
  it('AC27: with no room chosen a scan shows the warning ROOM_REQUIRED and adds nothing', () => {
    const next = scanCode({ ...newRoomScan(), scan: '6515-002-0001' }, '6515-002-0001');
    expect(next.msg).toEqual({ kind: 'warn', code: 'ROOM_REQUIRED' });
    expect(next.room).toBeNull();
    expect(next.items).toEqual([]);
    expect(next.scan).toBe('');
  });

  it('AC27: a room code selects the room', () => {
    const room = ROOMS[2]!;
    const next = scanCode(newRoomScan(), roomCode(room));
    expect(next.room).toBe(room.name);
    expect(next.msg).toEqual({ kind: 'ok', code: 'ROOM_CHANGED', params: { room: room.name } });
  });

  it('AC27: a room name selects the room in any letter case, and spaces around the code are ignored', () => {
    const room = ROOMS[0]!;
    expect(scanCode(newRoomScan(), '  ' + room.name + '  ').room).toBe(room.name);
    expect(scanCode(newRoomScan(), ' ' + roomCode(room).toLowerCase() + ' ').room).toBe(room.name);
  });

  it('AC27: scanning another room changes the destination and clears the saved note', () => {
    const state = { ...chooseRoom(newRoomScan(), ROOMS[0]!.name), done: { n: 2, lastId: 'A1' } };
    const next = scanCode(state, roomCode(ROOMS[3]!));
    expect(next.room).toBe(ROOMS[3]!.name);
    expect(next.done).toBeNull();
  });

  it('AC27: an empty scan changes nothing', () => {
    const state = newRoomScan();
    expect(scanCode(state, '   ')).toBe(state);
    expect(scanCode(state, null)).toBe(state);
  });

  it('AC27: picking from the select sets the room and a note, and the empty choice clears both', () => {
    const picked = chooseRoom(newRoomScan(), ROOMS[1]!.name);
    expect(picked.room).toBe(ROOMS[1]!.name);
    expect(picked.msg).toEqual({ kind: 'ok', code: 'ROOM_PICKED', params: { room: ROOMS[1]!.name } });
    expect(chooseRoom(picked, '')).toMatchObject({ room: null, msg: null });
  });
});
