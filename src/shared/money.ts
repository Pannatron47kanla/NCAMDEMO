/** Baht as the mockup shows it, e.g. 85,000 บาท. */
export function baht(n: number | string): string {
  return Number(n).toLocaleString('th-TH') + ' บาท';
}
