import { createStore, type Store } from '../../../shared/store';
import { ALL_CATEGORIES, ALL_STATUSES, DEFAULT_PAGE_SIZE, NO_FILTER, type AssetFilter } from '../domain/asset-list';

export interface AssetListState extends AssetFilter {
  /** The page asked for. Show it through `pageWindow`, which keeps it in range. */
  page: number;
  pageSize: number;
  /** Ids ticked for printing. They stay when the page or the filter changes. */
  selected: Record<string, true>;
}

/** The controls of the ทะเบียนครุภัณฑ์ list. The data itself is read from the registry's assets. */
export class AssetListService {
  readonly state: Store<AssetListState> = createStore<AssetListState>({ ...NO_FILTER, page: 1, pageSize: DEFAULT_PAGE_SIZE, selected: {} });

  private patch(p: Partial<AssetListState>): void {
    this.state.set((s) => ({ ...s, ...p }));
  }

  /** A change of search, category or status always goes back to page 1. */
  setQuery(q: string): void { this.patch({ q, page: 1 }); }
  setCategory(cat: string): void { this.patch({ cat, page: 1 }); }
  setStatus(status: string): void { this.patch({ status, page: 1 }); }
  setPage(page: number): void { this.patch({ page }); }

  /** The page size select. Text that is not a number gives the default size. */
  setPageSize(size: number): void { this.patch({ pageSize: Number(size) || DEFAULT_PAGE_SIZE, page: 1 }); }

  /** Opens the list on a filter from elsewhere (dashboard tile, "ดูรายการที่รอระบุห้อง"). What is not given is cleared. */
  show(filter: Partial<AssetFilter> = {}): void {
    this.patch({ q: filter.q ?? '', cat: filter.cat ?? ALL_CATEGORIES, status: filter.status ?? ALL_STATUSES, page: 1 });
  }

  toggleSelected(id: string): void {
    this.state.set((s) => {
      const selected = { ...s.selected };
      if (selected[id]) delete selected[id]; else selected[id] = true;
      return { ...s, selected };
    });
  }

  /** The header checkbox: selects every row of the page, or clears them when all are already selected. */
  togglePage(ids: readonly string[]): void {
    this.state.set((s) => {
      const all = ids.length > 0 && ids.every((id) => s.selected[id]);
      const selected = { ...s.selected };
      ids.forEach((id) => { if (all) delete selected[id]; else selected[id] = true; });
      return { ...s, selected };
    });
  }

  clearSelection(): void { this.patch({ selected: {} }); }
}
