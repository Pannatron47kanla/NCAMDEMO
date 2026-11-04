import { describe, expect, it } from 'vitest';
import { setup } from './helpers';

describe('asset register list controls', () => {
  it('AC39: the list starts with no filter, page 1 and 10 rows a page', () => {
    expect(setup().list.state.get()).toEqual({ q: '', cat: 'ทุกหมวด', status: 'ทุกสถานะ', page: 1, pageSize: 10, selected: {} });
  });

  it('AC39: changing the search, category or status goes back to page 1', () => {
    const { list } = setup();
    for (const change of [() => list.setQuery('หุ่น'), () => list.setCategory('สำนักงาน'), () => list.setStatus('ถูกยืม')]) {
      list.setPage(2);
      change();
      expect(list.state.get().page).toBe(1);
    }
  });

  it('AC39: changing the page size goes back to page 1, and a non-number gives 10', () => {
    const { list } = setup();
    list.setPage(2);
    list.setPageSize(20);
    expect(list.state.get()).toMatchObject({ page: 1, pageSize: 20 });
    list.setPageSize(Number('abc'));
    expect(list.state.get().pageSize).toBe(10);
  });

  it('AC39: show opens a filter from elsewhere and clears what is not given', () => {
    const { list } = setup();
    list.setQuery('หุ่น');
    list.setCategory('สำนักงาน');
    list.setPage(2);
    list.show({ status: 'รอซ่อม' });
    expect(list.state.get()).toMatchObject({ q: '', cat: 'ทุกหมวด', status: 'รอซ่อม', page: 1 });
  });

  it('AC39: ticked rows stay when the page or the filter changes', () => {
    const { list } = setup();
    list.toggleSelected('A1');
    list.setPage(2);
    list.setQuery('x');
    expect(list.state.get().selected).toEqual({ A1: true });
    list.toggleSelected('A1');
    expect(list.state.get().selected).toEqual({});
  });

  it('AC39: the page checkbox ticks the whole page, then clears it', () => {
    const { list } = setup();
    list.toggleSelected('A2');
    list.togglePage(['A1', 'A2', 'A3']);
    expect(Object.keys(list.state.get().selected).sort()).toEqual(['A1', 'A2', 'A3']);
    list.togglePage(['A1', 'A2', 'A3']);
    expect(list.state.get().selected).toEqual({});
    list.togglePage([]);
    expect(list.state.get().selected).toEqual({});
  });
});
