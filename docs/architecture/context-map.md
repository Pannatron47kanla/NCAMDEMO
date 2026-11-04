# Context map

> AI agent อ่านไฟล์นี้ก่อนสร้างหรือย้ายไฟล์ใน `src/modules/` แก้ไฟล์นี้ทุกครั้งที่เพิ่ม context ตาราง หรือคำศัพท์ใหม่
> ตัวอย่างด้านล่างเป็นระบบห้องสมุด แก้ให้ตรงกับโปรเจกต์จริง

## Contexts

| Context | ระดับ | ดูแลเรื่อง | เป็นเจ้าของตาราง |
|---|---|---|---|
| catalog | crud | หนังสือ ตัวเล่ม บาร์โค้ด ค้นหา | `books`, `book_copies` |
| circulation | full | ยืม คืน ค่าปรับ | `loans`, `fines` |
| membership | light | สมัคร ต่ออายุ ระงับสมาชิก | `members` |

## คำศัพท์ (Ubiquitous Language)

| Context | คำ | ความหมาย | ในโค้ด |
|---|---|---|---|
| catalog | หนังสือ | ข้อมูลเรื่อง (ชื่อ ผู้แต่ง ISBN) | `Book` |
| catalog | ตัวเล่ม | เล่มจริงที่มีบาร์โค้ด | `Copy` |
| circulation | ผู้ยืม | สมาชิกในมุมการยืม | `Borrower` (aggregate root) |
| circulation | การยืม | การยืมหนึ่งครั้ง | `Loan` |
| circulation | วันกำหนดคืน | วันยืม + 14 วัน | `DueDate` |
| membership | สมาชิก | ข้อมูลส่วนตัวและสถานะ | `Member` |

## การคุยข้าม context

| ผู้ใช้ | ต้องการ | ผ่าน |
|---|---|---|
| circulation | หาตัวเล่มจากบาร์โค้ด | `CatalogLookup` (port) ← `catalog/index.ts` |
| circulation | สถานะสมาชิก | อ่านตาราง `members` ตรงได้ (อ่านอย่างเดียว) ชั่วคราว |

## กฎตัวเลขทางธุรกิจ

| กฎ | ค่า | อยู่ที่ |
|---|---|---|
| ยืมพร้อมกันได้สูงสุด | 3 เล่ม | `Borrower.MAX_ACTIVE_LOANS` |
| ระยะเวลายืม | 14 วัน | `DueDate.LOAN_DAYS` |
