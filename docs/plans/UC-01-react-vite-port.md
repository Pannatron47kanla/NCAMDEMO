# UC-01 Port the NCAM mockup to React + Vite: implementation plan

> **For agentic workers:** REQUIRED SUB-SKILL: use `superpowers:subagent-driven-development` or `superpowers:executing-plans`, as the user chooses. Steps use checkbox (`- [ ]`) syntax. Every subagent must also receive `AGENTS.md` and `.claude/skills/ddd-architecture/SKILL.md`.

**Goal:** Rebuild `docs/mockup/Mockup MVP NCAM_1.html` as a static React app on Vercel with the same screens, text, and rules.

**Architecture:** Business rules move from the mockup's single class into five DDD contexts under `src/modules/`. In-memory repositories hold the state, and React subscribes with `useSyncExternalStore`. There is no router: `screen` state selects the page, as in the mockup.

**Tech stack:** React 18.3.1 (the mockup's version), Vite, TypeScript in strict mode, Vitest, Testing Library, Playwright, ESLint flat config.

**Spec:** `docs/usecases/UC-01-react-vite-port.md`. Boundaries: `docs/architecture/context-map.md`.

## Global constraints

- Show Thai text, numbers, and colors exactly as in the mockup. Do not fix or improve rules, and record any quirk in the PR.
- Today is `new Date(2026, 9, 28)`, supplied only through `Clock`. Domain and application code must not call `new Date()` with no arguments or `Date.now()`.
- The app makes no requests to other origins and does not use browser storage.
- Domain code imports no React and nothing from other contexts or layers.
- Test names start with `AC<n>:`. Each AC is one commit: `UC-01 AC<n>: <what changed>`, ending with the session's attribution line.
- Inline styles from the mockup stay inline. Do not move them into a design system.

## Review focus

1. Scanned codes with surrounding spaces must behave as if trimmed (test in Task 6).
2. Pressing confirm twice must not create a second loan or charge (tests in Tasks 13 and 16).
3. Browsers outside Thailand: dates must stay right across the US daylight saving change on 1 November 2026 (test in Task 5, run with `TZ=America/New_York` and `TZ=UTC`).
4. Non-numeric or empty numbers in the wizard must be rejected and never stored as `NaN` (test in Task 24).
5. Empty or zero settings must fall back to their defaults, as in the mockup (test in Task 43).

## Reading the mockup

Line numbers refer to `docs/mockup/source/prototype.dc.html`. The file's template syntax maps directly to JSX: `sc-if` to a condition, `sc-for` to `map`, and `{{x}}` to a value from `renderVals()`.

| Part | Lines | Part | Lines |
|---|---|---|---|
| Global CSS | 272–337 | Print documents | 1198–1292 |
| Login | 350 | Add asset | 1293 |
| App shell and nav | 375 | Import | 1410 |
| Dashboard | 395 | Disposal modal | 1472 |
| Counter, borrow, return | 510, 551, 607 | Helpers, constants, seed | 1589–1780 |
| Assets, asset detail | 666, 705 | Rule methods | 1781–2169 |
| Map, 3D, floor | 750, 758, 809 | View values (`renderVals`) | 2170–3000 |
| Calendar | 871 | Icon component | `Icon.dc.html` |
| Disposal | 910 | Repair, audit, reports | 995, 1051, 1102 |
| Room scan, settings | 1115, 1185 | | |

## File structure

```text
src/
  main.tsx                 Builds repositories and modules, renders <App>
  app/                     App.tsx, styles.css, fonts.css, Shell, Login, Icon, and the views in
                           dashboard/ calendar/ map/ reports/ documents/
  shared/
    clock.ts               Clock, systemClock (fixed to the demo date), fixedClock
    domain-error.ts        DomainError(code, params)
    store.ts               createStore<S>(initial) -> { get, set, subscribe }
    dates.ts               thd, thFull, th, toIso, iso, addYears, addMonths, diffDays, dur
    working-days.ts        HOLIDAYS, isWork, addWorkDays
    money.ts               baht
    qr.ts                  qr(code), ported from the mockup
    web/useStore.ts        useSyncExternalStore wrapper
  modules/<context>/
    domain/  application/  infrastructure/  interface/web/  module.ts  index.ts
tests/e2e/                 Playwright flow on the production build
```

## Shared interfaces

```ts
interface Clock { now(): Date }
class DomainError extends Error { constructor(readonly code: string, readonly params?: Record<string, string | number>) }

// registry/index.ts
interface AssetCatalog {
  list(): Asset[]; findById(id: string): Asset | undefined; findByCode(code: string): Asset | undefined;
  setStatus(id: string, status: AssetStatus): void;
  addEvent(id: string, event: AssetEvent): void;
}
assetInfo(asset: Asset, now: Date): AssetInfo   // port of info(), lines 1785–1792

// maintenance/index.ts
interface RepairIntake { open(input: { assetId: string; symptom: string; needDate: Date; reporter: string }): RepairTicket }
interface OpenRepairs { hasOpenTicket(assetId: string): boolean }

// circulation/domain
class Borrower {
  overdueLoans(loans: Loan[], now: Date): Loan[];
  assertCanTake(asset: Asset, cart: CartItem[], loans: Loan[], settings: LoanSettings): void;
  borrow(cart: CartItem[], settings: LoanSettings, now: Date, loanId: string): Loan;
}
class Loan { receiveReturn(input: ReturnInput, settings: LoanSettings, now: Date): ReturnOutcome }
// ReturnOutcome = { assetStatus, charges: Charge[], needsRepair: boolean, missingText: string, lateDays: number }

// disposal/domain
class DisposalCase {
  static create(input): DisposalCase;
  recordFact(fault): void; approve(method, totalPrice): void; announce(minPrices): void; noBid(): void;
  recordResult(input): void; writeOff(): void; notifyAuditor(letterNo: string): void; close(): void;
}
```

Date offsets in the mockup seed (`dueOff`, `startOff`, `needOff`, `createdOff`) become real `Date` values built from the clock. Domain errors carry a code, and each context's `interface/web/messages.ts` turns the code into the exact Thai text. Domain tests assert codes, and web tests assert the Thai text.

## The cycle for every task

Each task below lists only its decisions. Every task follows these steps:

- [ ] Write the listed test in the listed file.
- [ ] Run `npx vitest run <file>` and keep the full failure text for the red/green report. It must fail for the listed reason, not on setup.
- [ ] Write the minimal code in domain, then application, infrastructure, and `interface/web`, porting from the listed mockup lines.
- [ ] Run `npm test`, `npm run lint`, and `npm run build`. All must pass.
- [ ] Commit only that task's files with the listed message.

## Tasks

Task numbers match AC numbers from Task 6 on, except Tasks 5 (AC30) and 45 (AC5). Work through them in the order listed here.

### Platform and shell

**Task 1: AC1 static build.** Scaffold in the repo root: `package.json` with `dev`, `build` (`tsc -b && vite build`), `test`, `lint`, `e2e`; strict `tsconfig`; `vite.config.ts`; `.github/workflows/ci.yml` (`npm ci`, lint, test, build, e2e); add `node_modules/` and `dist/` to `.gitignore`. Extend `eslint.boundaries.js` globs to `*.{ts,tsx}` and add `react` to the domain restriction list. No `vercel.json`, because Vercel detects Vite and there are no routes. Test `tests/build.test.ts`, `AC1: build output is static`: after a build, `dist/index.html` exists and `dist/` holds no server code. Red reason: `dist/` missing. Commit: `UC-01 AC1: scaffold Vite app with static build and CI`.

**Task 2: AC2 fonts and no remote requests.** Copy `docs/mockup/fonts/*.woff2` to `src/assets/fonts/` and `OFL.txt` beside them. `src/app/fonts.css` declares weights 400, 500, 600, and 700 for each file, using the mockup's `unicode-range` values for Thai and Latin. Copy lines 272–337 into `src/app/styles.css`. Test `src/app/__tests__/assets.test.ts`, `AC2: built files reference no other origin`: no `http(s)://` load target in `dist/` CSS or HTML, and the font files exist. Commit: `UC-01 AC2: bundle Anuphan fonts and global styles`.

**Task 3: AC3 login and shell.** Port Login, Shell, nav (with collapsible groups), and `Icon`. Test `src/app/__tests__/login.test.tsx`, `AC3: any role reaches the dashboard`: for each of the 5 roles, selecting and submitting shows the dashboard heading and the role; all nav items show for every role. Commit: `UC-01 AC3: port login, shell, and navigation`.

**Task 4: AC4 reload restores the seed.** `main.tsx` builds everything from the seed on each load. `createAppModules(clock)` is the single composition function. Test `src/app/__tests__/reset.test.ts`, `AC4: a new app instance starts from the seed`: change an asset's status in one instance; a second instance shows the seed value. Commit: `UC-01 AC4: compose modules from the seed on load`.

### Registry rules needed by other contexts

**Task 5: AC30 asset detail.** Port `shared/dates.ts`, `working-days.ts`, `money.ts`, `qr.ts`, then all seeds and constants for `registry` (lines 1589–1780), and the asset detail screen (705). Test `registry/domain/__tests__/asset-info.test.ts`, `AC30: life buckets and calibration`: offsets −1, 0, 182, 183, 365, and 366 give the four buckets; `calNext` is `last` plus `cycle` months. Include the same assertions under both time zones from Review Focus 3 (add `test:tz` to `npm test`). Commit: `UC-01 AC30: port asset rules, seed, and detail screen`.

### Borrowing (`circulation`)

Port from lines 1799–1850, screens 510 and 551. Tests are in `circulation/domain/__tests__/borrow.test.ts` unless noted. Tasks 6–14 use `CounterService.scan(raw)` and `confirmBorrow()`.

| Task | AC | Test assertions | Commit |
|---|---|---|---|
| 6 | AC6 | Empty or whitespace scan gives warning `EMPTY_SCAN`; `' T0007 '` finds the borrower (`counter-service.test.ts`) | `UC-01 AC6: warn on empty scan` |
| 7 | AC7 | Unknown code throws `BORROWER_NOT_FOUND` with `code`; web test shows the Thai text | `UC-01 AC7: reject unknown borrower` |
| 8 | AC8 | Seed borrower `6511010088` is blocked with count 1; later scans throw `BORROWER_BLOCKED`; pending loans do not count | `UC-01 AC8: block borrowers with overdue loans` |
| 9 | AC9 | Unknown asset throws `ASSET_NOT_FOUND` | `UC-01 AC9: reject unknown asset` |
| 10 | AC10 | Second scan warns `ALREADY_IN_CART` and cart length stays 1 | `UC-01 AC10: ignore repeated asset scans` |
| 11 | AC11 | Status other than พร้อมใช้ throws `ASSET_NOT_AVAILABLE` with name and status | `UC-01 AC11: reject unavailable assets` |
| 12 | AC12 | Student with 2 kits held or in cart throws `KIT_LIMIT_REACHED`; asset without parts passes; teacher passes | `UC-01 AC12: enforce student kit limit` |
| 13 | AC13 | Loan due = today + 7 days; assets ถูกยืม; history added; unchecked part gives note `จ่ายไม่ครบ: ไม่มี <name>`; second confirm creates no loan | `UC-01 AC13: confirm loan` |
| 14 | AC14 | With `needApproval`, a student's loan is pending and `approve` clears it; a teacher's is not pending | `UC-01 AC14: support pending student loans` |

### Returning and charges (`circulation`)

Port from lines 1851–1877, screen 607. Tests are in `circulation/domain/__tests__/return.test.ts`.

| Task | AC | Test assertions | Commit |
|---|---|---|---|
| 15 | AC15 | No open loan throws `NO_OPEN_LOAN` | `UC-01 AC15: reject return without open loan` |
| 16 | AC16 | On time, complete, good: พร้อมใช้, 0 charges; second confirm changes nothing | `UC-01 AC16: record on-time return` |
| 17 | AC17 | Seed loan 3 days late: fine charge 15; `finePerDay: 10` gives 30 | `UC-01 AC17: charge late fine` |
| 18 | AC18 | Missing part qty 2, price 100: charge `Math.round(200 * 1.2)` = 240; status ชิ้นส่วนไม่ครบ | `UC-01 AC18: charge for missing parts` |
| 19 | AC19 | ชำรุด: รอซ่อม wins over missing parts; `RepairIntake.open` is called once with status รอรับงาน. Do Task 21–22 domain first if `RepairIntake` is absent, using a fake here | `UC-01 AC19: open ticket for damaged return` |
| 20 | AC20 | Empty receipt: `RECEIPT_REQUIRED`, still unpaid; valid: paid with trimmed receipt | `UC-01 AC20: pay charges with receipt` |

### Repair (`maintenance`)

Port from lines 1883–1907, screen 995. Tests are in `maintenance/domain/__tests__/ticket.test.ts`.

| Task | AC | Test assertions | Commit |
|---|---|---|---|
| 21 | AC21 | Blank symptom throws `SYMPTOM_REQUIRED`; no ticket | `UC-01 AC21: require repair symptom` |
| 22 | AC22 | Ticket id follows `WO-2569-0<seq>`, status รอรับงาน; asset รอซ่อม; a ถูกยืม asset stays ถูกยืม | `UC-01 AC22: report repair` |
| 23 | AC23 | Accept sets กำลังซ่อม with route; close fails with `TICKET_NOT_READY` until `tested` and `partsOk`; then ปิดงาน and พร้อมใช้ | `UC-01 AC23: accept and close tickets` |

### Register (`registry`)

Port from lines 1928–2044, screens 666, 1115, 1293, 1410.

| Task | AC | Test file and assertions | Commit |
|---|---|---|---|
| 24 | AC24 | `add-asset.test.ts`: each step's missing list; qty 0, 201, `abc`, and empty are rejected; duplicate serials; more serials than items | `UC-01 AC24: validate add-asset wizard` |
| 25 | AC25 | `add-asset.test.ts`: qty 3 gives consecutive codes above the highest in that prefix, padded to 4 digits; history shows `ล็อต 1/3` and serials | `UC-01 AC25: create asset lots` |
| 26 | AC26 | `import.test.ts`: each row classification; added rows use รอระบุห้อง; a second import gives `ข้าม (มีแล้ว)` | `UC-01 AC26: import register rows` |
| 27 | AC27 | `room-scan.test.ts`: no room gives warning `ROOM_REQUIRED`; a room code or name selects the room | `UC-01 AC27: require a room before scanning` |
| 28 | AC28 | `room-scan.test.ts`: unknown rejected; repeat not counted; the 3 statuses are `block` with the reason; codes match in any letter case | `UC-01 AC28: classify scanned assets` |
| 29 | AC29 | `room-scan.test.ts`: only `new` and confirmed `move` change room and add history | `UC-01 AC29: save room scan` |
| 39 | AC39 | `interface/web/__tests__/assets-list.test.tsx`: search, category, status, page size 10, filters reset to page 1 | `UC-01 AC39: port asset register list` |

### Audit (`audit`)

Port from lines 1908–1926, screen 1051. Tests are in `audit/domain/__tests__/round.test.ts`.

| Task | AC | Test assertions | Commit |
|---|---|---|---|
| 31 | AC31 | Offline result `synced: false` is skipped by confirm; after `sync`, confirm applies it | `UC-01 AC31: hold offline results until sync` |
| 32 | AC32 | ไม่พบ sets `สูญหาย / ไม่พบ` and adds history; `setResult` on a confirmed row changes nothing | `UC-01 AC32: confirm audit results` |

### Disposal (`disposal`)

Port from lines 2052–2126, screens 910 and 1472. Keep `METHODS` from line 1679. Tests are in `disposal/domain/__tests__/case.test.ts`.

| Task | AC | Test assertions | Commit |
|---|---|---|---|
| 33 | AC33 | Borrowed and open-ticket assets are excluded; others become รอจำหน่าย; a second create while one is open does nothing; id `DS-2569-001` | `UC-01 AC33: create disposal case` |
| 34 | AC34 | Direct total 500,001 throws `DIRECT_SALE_LIMIT`; exactly 500,000 passes | `UC-01 AC34: enforce direct sale limit` |
| 35 | AC35 | Missing or zero minimum price throws `MIN_PRICE_REQUIRED` | `UC-01 AC35: require minimum prices` |
| 36 | AC36 | `noBid` raises the round and clears sale data | `UC-01 AC36: record no-bid rounds` |
| 37 | AC37 | Price below minimum, missing buyer, or missing receipt rejected; a non-sale method needs party and reference | `UC-01 AC37: validate sale result` |
| 38 | AC38 | Plan dates from `casePlan` match working-day rules, deadline is approval + 60 days; write-off sets จำหน่ายแล้ว; blank letter rejected; close moves to finished | `UC-01 AC38: complete disposal case` |

### App-level views (`src/app/`)

| Task | AC | Test file and assertions | Commit |
|---|---|---|---|
| 40 | AC40 | `calendar/__tests__/events.test.ts`: port `allEvents` (2137); each kind appears on its date; kind filter hides it; opening goes to the right screen | `UC-01 AC40: port calendar` |
| 41 | AC41 | `map/__tests__/map.test.tsx`: locate selects building, floor, and asset; unknown room opens 3D view | `UC-01 AC41: port map views` |
| 42 | AC42 | `documents/__tests__/documents.test.tsx`: each of the 5 kinds shows its data; labels render a QR for the code; back returns to `print.back` | `UC-01 AC42: port printable documents` |
| 43 | AC43 | `circulation/interface/web/__tests__/settings.test.tsx`: save changes later loans and charges; empty and zero fall back as in lines 2988–2990 | `UC-01 AC43: port loan settings` |
| 44 | AC44 | `dashboard/__tests__/dashboard.test.tsx`, `reports/__tests__/reports.test.tsx`: confirming a loan changes the matching numbers | `UC-01 AC44: port dashboard and reports` |

### Final checks

**Task 45: AC5 visual parity and E2E.** `tests/e2e/flow.spec.ts` runs on `vite preview` at 1440 × 1100, `AC5: main flow works on the production build`: login, borrow, return damaged, close the ticket, dispose an asset. For parity, screenshot each screen in the app and the mockup with Playwright, and compare them by eye. Save pairs in a local ignored folder and list differences in the PR. Commit: `UC-01 AC5: add E2E flow and visual parity check`.

**Task 46: Finish.** Run the `ddd-architecture` checklist and `grep -rE "new Date\(\)|Date\.now\(\)" src --include=*.ts --include=*.tsx`, allowing tests only. Then follow verification, code review, and PR steps from `feature-workflow`. Vercel project setup is for the user: import the repository and accept the detected Vite settings.
