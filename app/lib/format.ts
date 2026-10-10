import dayjs from "dayjs";

const money = new Intl.NumberFormat("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export function formatMoney(value: number | null | undefined): string {
  return value === null || value === undefined ? "—" : `฿${money.format(value)}`;
}

/** 'YYYY-MM-DD' → '10 Oct 2026' */
export function formatDate(value: string | null | undefined): string {
  return value ? dayjs(value).format("D MMM YYYY") : "—";
}

export function formatDateTime(value: string | null | undefined): string {
  return value ? dayjs(value).format("D MMM YYYY HH:mm") : "—";
}

export function percent(part: number, whole: number): number {
  return whole > 0 ? Math.round((part / whole) * 100) : 0;
}
