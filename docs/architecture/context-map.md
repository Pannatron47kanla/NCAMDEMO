# Context map

> AI agents read this file before creating or moving files in `src/modules/`. Update it whenever a context, owned data, or term changes.
> NCAM is frontend only for now: "owned data" lives in in-memory repositories loaded from the seed. There are no tables yet.

## Contexts

| Context | Level | Covers | Owns |
|---|---|---|---|
| registry | light | Assets, parts, rooms, add asset, import, room scan, life and calibration | `Asset`, `Room`, `Building` |
| circulation | full | Borrowers, loans, returns, charges, loan settings | `Borrower`, `Loan`, `Charge`, `LoanSettings` |
| maintenance | light | Repair tickets | `RepairTicket` |
| audit | light | Annual audit round and results | `AuditResult` |
| disposal | full | Disposal cases, methods, deadlines | `DisposalCase` |

Dashboard, calendar, map, reports, and printable documents are app-level views in `src/app/`. They read through each context's `index.ts` and hold no business rules.

## Ubiquitous language

| Context | Term | Meaning | In code |
|---|---|---|---|
| registry | ครุภัณฑ์ | One registered asset with a code and status | `Asset` |
| registry | ชิ้นส่วน | A part of a kit, with quantity and price | `Part` |
| registry | อายุการใช้งาน | Years from acquisition to end of life | `Asset.life` |
| circulation | ผู้ยืม | A student or teacher who can borrow | `Borrower` (aggregate root) |
| circulation | ใบยืม | One loan with one or more items | `Loan` |
| circulation | ค่าปรับ / ค่าชดใช้ | Late fine and loss charge | `Charge` |
| maintenance | ใบงานซ่อม | A repair work order | `RepairTicket` |
| audit | ผลตรวจนับ | One asset's audit result | `AuditResult` |
| disposal | เรื่องจำหน่าย | A disposal case across its 6 steps | `DisposalCase` (aggregate root) |

## Cross-context communication

Only the owning context changes its data. Other contexts call it through a port, wired in `src/main.tsx`.

| User | Needs | Through |
|---|---|---|
| circulation | Find assets, change status, add history | `AssetCatalog` port, from `registry/index.ts` |
| circulation | Open a ticket for an asset returned damaged | `RepairIntake` port, from `maintenance/index.ts` |
| maintenance | Change asset status, add history | `AssetCatalog` port |
| audit | Change asset status, add history | `AssetCatalog` port |
| disposal | Change asset status, add history, read price | `AssetCatalog` port |
| disposal | Check for open tickets | `OpenRepairs` port, from `maintenance/index.ts` |

## Business numbers

| Rule | Value | Lives in |
|---|---|---|
| Loan period | 7 days | `LoanSettings.loanDays` |
| Maximum kits per student | 2 | `LoanSettings.maxSets` |
| Late fine | 5 baht per day | `LoanSettings.finePerDay` |
| Loss surcharge | 20% | `LoanSettings.lossPct` |
| Maximum lot size | 200 items | `registry` domain |
| Direct sale limit | 500,000 baht | `DisposalCase` |
| Disposal deadline | 60 days after approval | `DisposalCase` |
