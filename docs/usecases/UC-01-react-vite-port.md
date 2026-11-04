# UC-01 Port the NCAM MVP mockup to React + Vite

Status: implemented on this branch, waiting for PR review. Source of behavior: `docs/mockup/Mockup MVP NCAM_1.html`, with readable source in `docs/mockup/source/`. Thai strings below are the exact text the app must show.

## Users

Anyone with the Vercel link. They sign in with one of the five demonstration roles from the mockup: เจ้าหน้าที่ห้องปฏิบัติการ, เจ้าหน้าที่พัสดุ, กรรมการตรวจสอบพัสดุ, ผู้บริหาร, ผู้ดูแลระบบ.

## Preconditions

- The app is deployed as static files on Vercel.
- There is no server. All data starts from an in-memory seed that matches the mockup.

## Main flow

1. The user opens the link and sees the login screen.
2. The user picks a role and signs in.
3. The user works through any screen in the mockup: dashboard, borrow and return counter, repair, asset register and detail, add asset, import, room scan, map, calendar, disposal, audit, reports, settings, and printable documents.
4. Changes are visible across screens until the page is reloaded. A reload restores the seed.

## Business rules

All numbers come from the mockup and must not change in this port.

| Rule | Value |
|---|---|
| Fixed "today" | 28 October 2026, supplied by an injectable clock |
| Loan period | 7 days (setting) |
| Maximum kits per student | 2 (setting); applies only to students and only to assets that have parts |
| Late fine | 5 baht per day (setting) |
| Loss charge | Sum of quantity × price of missing parts × (1 + 20%), rounded (setting) |
| Teacher approval for student loans | Off by default (setting) |
| Maximum lot size for a new asset | 200 items |
| Direct sale limit in a disposal case | Total purchase price of at most 500,000 baht |
| Disposal completion deadline | 60 days after approval |
| Asset life buckets (days until end of life) | Below 0: เกินอายุใช้งาน; up to 182: ครบภายใน 6 เดือน; up to 365: ครบภายใน 6–12 เดือน; otherwise: มากกว่า 1 ปี |
| Working days | Monday to Friday, excluding the holidays listed in the mockup |

## Acceptance criteria

### Platform and shell

| AC | Given | When | Then |
|---|---|---|---|
| AC1 | A clean clone | `npm ci && npm run build` runs, and Vercel deploys the repository without custom settings | `dist/` holds static files only, and the deployed link shows the login screen |
| AC2 | The app is open | The page loads and the user works through it | The app makes no requests to other origins, and the bundled Anuphan font renders Thai text. The font license is kept in the repository |
| AC3 | The login screen | The user picks any role and submits | The dashboard opens with that role shown. The password is not checked and the role does not restrict any menu, as in the mockup |
| AC4 | The user has changed data | The user reloads the page | The login screen returns and all data is back to the seed |
| AC5 | Any mockup screen at 1440 px width | It is compared side by side with the mockup | Layout, text, colors, and icons match, and every control in the mockup works |

### Borrowing

| AC | Given | When | Then |
|---|---|---|---|
| AC6 | Borrow mode with an empty scan box | The user presses scan | A warning shows: `สแกนหรือพิมพ์รหัสก่อนกดสแกน` |
| AC7 | No borrower selected | A code not in the borrower register is scanned | Rejected: `ไม่พบรหัสผู้ยืม <code> ในทะเบียนผู้ยืม` |
| AC8 | A borrower holds an overdue, approved loan | Their code is scanned | The borrower is blocked: `ยืมไม่ได้: มีรายการเกินกำหนดคืน <n> ใบยืม ต้องคืนก่อน`. Later scans are rejected until the items are returned |
| AC9 | An eligible borrower | An unknown asset code is scanned | Rejected: `ไม่พบรหัสครุภัณฑ์ <code>` |
| AC10 | An asset is already in the cart | It is scanned again | A warning shows and the cart does not change |
| AC11 | An asset whose status is not พร้อมใช้ | It is scanned | Rejected: `จ่ายไม่ได้: <name> สถานะ "<status>"` |
| AC12 | A student holds or has in the cart 2 kits | Another asset with parts is scanned | Rejected with the `เกินจำนวนสูงสุด 2 ชุดต่อนักศึกษา` message. A teacher is not limited |
| AC13 | A cart with at least one asset | The loan is confirmed | A loan is created with a due date 7 days ahead, assets become ถูกยืม, history is added, and unchecked parts are recorded as `จ่ายไม่ครบ` |
| AC14 | Approval is required and the borrower is a student | The loan is confirmed | The loan is pending, shows `ส่งคำขอยืมแล้ว รออาจารย์อนุมัติ`, and does not count as overdue until it is approved |

### Returning and charges

| AC | Given | When | Then |
|---|---|---|---|
| AC15 | Return mode | An asset with no open loan is scanned | Rejected: `ไม่มีรายการยืมค้างของ <name>` |
| AC16 | An on-time return with all parts in good condition | The return is confirmed | The asset becomes พร้อมใช้ and no charge is created |
| AC17 | A return 3 days late | The return is confirmed | A fine charge of 15 baht is created |
| AC18 | A return with missing parts | The return is confirmed | A loss charge follows the rule above, and the asset becomes ชิ้นส่วนไม่ครบ |
| AC19 | A return in ชำรุด condition | The return is confirmed | The asset becomes รอซ่อม and a repair ticket is opened with status รอรับงาน |
| AC20 | An unpaid charge | Pay is pressed with an empty receipt number, then with a number | The first press does nothing. The second marks the charge paid with that receipt |

### Repair

| AC | Given | When | Then |
|---|---|---|---|
| AC21 | The repair form with an empty symptom | The form is submitted | No ticket is created |
| AC22 | A valid repair form | The form is submitted | A ticket is opened with status รอรับงาน. The asset becomes รอซ่อม, unless it is ถูกยืม, which stays unchanged |
| AC23 | An open ticket | The work is accepted, then closure is attempted before both testing and parts are ticked | Status becomes กำลังซ่อม, and closing does nothing until both are ticked. Closing then sets ปิดงาน and the asset to พร้อมใช้ |

### Register

| AC | Given | When | Then |
|---|---|---|---|
| AC24 | The add-asset wizard | A step has missing or invalid fields, duplicate serials, more serials than items, or a quantity above 200 | The step does not advance and lists the problems in the mockup's message |
| AC25 | A completed wizard with quantity n | It is submitted | n assets are created with consecutive codes from the highest existing code in that category prefix, and history records the lot and serial |
| AC26 | The import preview | Rows are previewed and imported | Rows are classified as ผ่าน, `ผิด: รหัสซ้ำกับทะเบียน`, `ผิด: ไม่มีราคา`, or `ข้าม (มีแล้ว)`. Only ผ่าน rows are added, with room รอระบุห้อง. A second import skips them |
| AC27 | Room scan with no room chosen | An asset code is scanned | A warning shows: `เลือกห้องปลายทางก่อน เพื่อบอกระบบว่าของจะอยู่ห้องไหน` |
| AC28 | A room is chosen | An unknown or repeated asset, or one that is ถูกยืม, รอจำหน่าย, or จำหน่ายแล้ว, is scanned | The unknown asset is rejected, the repeat is not counted, and the others are listed as blocked with the reason |
| AC29 | A room scan list | The list is saved | Assets in รอระบุห้อง and confirmed moves change room with history. Unconfirmed moves, same-room items, and blocked items do not change |
| AC30 | Any asset | Its detail is opened | Life bucket, remaining time, calibration date, parts, and history match the rules above |

### Audit

| AC | Given | When | Then |
|---|---|---|---|
| AC31 | Audit in offline mode | A result is recorded and confirm is pressed before sync | The result stays unconfirmed. After sync, confirm applies it |
| AC32 | A confirmed result of ไม่พบ | Confirmation completes | The asset becomes `สูญหาย / ไม่พบ`, history is added, and the result can no longer be changed |

### Disposal

| AC | Given | When | Then |
|---|---|---|---|
| AC33 | A selection with an asset that is borrowed or has an open ticket | A case is created | Blocked assets are excluded, and the others become รอจำหน่าย. Only one case can be open at a time |
| AC34 | Direct sale with a total purchase price above 500,000 baht | Approval is attempted | Rejected with the mockup's message that directs the user to an auction |
| AC35 | An auction with a missing minimum price | Announce is pressed | Rejected: `กรอกราคาประเมินขั้นต่ำให้ครบทุกรายการก่อนปิดประกาศ` |
| AC36 | An auction with no qualifying bid | No-bid is recorded | The round number rises by 1 and the sale data is cleared |
| AC37 | A sale result below the minimum price, or missing buyer or receipt | The result is recorded | Rejected with the mockup's message |
| AC38 | A recorded result | Write-off, auditor notification, and closure run in order | Assets become จำหน่ายแล้ว. Notification is rejected without a letter number. The closed case moves to the finished list |

### Views and settings

| AC | Given | When | Then |
|---|---|---|---|
| AC39 | The asset register | Search, category, status, and page controls are used | The list and page numbers update as in the mockup, with 10 rows per page by default |
| AC40 | The calendar | Month and kind filters are used and an event is opened | Calibration, end of life, loan, repair, audit, and disposal events show on the right dates, and the event opens its related screen |
| AC41 | An asset with a known room | Locate is pressed | The map opens on that floor with the asset selected. The 3D and floor views work as in the mockup |
| AC42 | Assets or a loan | A document is opened | Labels with QR codes, loan slip, formal register, audit report, and auction document show correct data, and back returns to the previous screen |
| AC43 | Settings | A value is changed and saved | Later loans, returns, and charges use the new value |
| AC44 | The dashboard and reports | Data changes elsewhere | Their numbers reflect the change |

## Out of scope

- Backend, database, `openapi.yaml`, mock server, and migrations. The user chose a frontend-only build for Vercel, so steps 2 and 3 of the feature workflow reduce to the in-memory seed.
- Real authentication and role-based permissions.
- Data persistence across reloads, and sharing data between users.
- New features or changes to rules. Mockup quirks are kept and noted, not fixed.

## Decisions

- The people's names in the seed are fictional, so they can be published on a public link.
- The UI layer is `interface/web`.
- Contexts follow `docs/architecture/context-map.md`.
- This work stays as one Story and one PR, even though 44 ACs is above the team's guideline of about 7.
- From AC21 on, tests cover business rules only, without a required red run. Screens are checked by smoke flows and the AC5 comparison. This exception applies only to UC-01.
- With no database, repositories are in-memory and are tested directly. The rule that repository tests run on a real database applies once a backend exists.
