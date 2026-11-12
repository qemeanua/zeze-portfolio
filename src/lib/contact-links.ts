export function getWhatsAppUrl(value: string): string {
  const digits = value.replace(/\D/g, "");
  const international = digits.startsWith("234") ? digits : digits.startsWith("0") ? `234${digits.slice(1)}` : digits;
  return `https://wa.me/${international}`;
}

export function getTelephoneUrl(value: string): string {
  const digits = value.replace(/\D/g, "");
  const international = digits.startsWith("234") ? `+${digits}` : digits.startsWith("0") ? `+234${digits.slice(1)}` : `+${digits}`;
  return `tel:${international}`;
}