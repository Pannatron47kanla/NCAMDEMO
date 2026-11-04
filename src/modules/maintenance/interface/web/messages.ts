type Params = Record<string, string | number> | undefined;

/**
 * Thai text for the codes maintenance can raise. Wording is copied from the mockup where it has some.
 * SYMPTOM_REQUIRED has no wording there (its submit button is just disabled), so it reuses the field label.
 */
const TEXT: Record<string, (p: NonNullable<Params>) => string> = {
  SYMPTOM_REQUIRED: () => 'อาการ (จำเป็น)',
  TICKET_NOT_READY: () => 'ปิดงานได้เมื่อทดสอบผ่านและชิ้นส่วนครบเท่านั้น',
};

export function messageText(code: string, params?: Params): string {
  const text = TEXT[code];
  return text ? text(params ?? {}) : code;
}
