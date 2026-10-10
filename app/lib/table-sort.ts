import type { SortOrder } from "antd/es/table/interface";

// Shared antd Table sorters. Rules (docs/04-standards/ui-standard.md §5):
//  - empty values sink to the bottom in BOTH directions (empty ≠ smallest)
//  - text compares with numeric awareness ("Room 2" < "Room 10")
//  - statuses sort by workflow order, not alphabetically
//
// antd negates the comparator result for "descend", so to keep empties last
// we flip their result when sortOrder is "descend".

type Empty = null | undefined | "";
const isEmpty = (v: unknown): v is Empty => v === null || v === undefined || v === "";

function nullsLast<V>(a: V | Empty, b: V | Empty, order: SortOrder | undefined, cmp: (x: V, y: V) => number) {
  const ea = isEmpty(a);
  const eb = isEmpty(b);
  if (ea && eb) return 0;
  if (ea) return order === "descend" ? -1 : 1;
  if (eb) return order === "descend" ? 1 : -1;
  return cmp(a as V, b as V);
}

const collator = new Intl.Collator(undefined, { numeric: true, sensitivity: "base" });

export function sortText<T>(get: (row: T) => string | Empty) {
  return (a: T, b: T, order?: SortOrder) => nullsLast(get(a), get(b), order, collator.compare);
}

export function sortNumber<T>(get: (row: T) => number | Empty) {
  return (a: T, b: T, order?: SortOrder) => nullsLast(get(a), get(b), order, (x, y) => x - y);
}

/** ISO strings (YYYY-MM-DD or full timestamps) compare correctly as text. */
export function sortDate<T>(get: (row: T) => string | Empty) {
  return (a: T, b: T, order?: SortOrder) =>
    nullsLast(get(a), get(b), order, (x, y) => (x < y ? -1 : x > y ? 1 : 0));
}

/** Sort by position in a fixed list, e.g. Object.keys(BOOKING_STATUS). Unknown values go last. */
export function sortByOrder<T>(get: (row: T) => string | Empty, order: readonly string[]) {
  const rank = (v: string) => {
    const i = order.indexOf(v);
    return i === -1 ? Number.MAX_SAFE_INTEGER : i;
  };
  return (a: T, b: T, sortOrder?: SortOrder) =>
    nullsLast(get(a), get(b), sortOrder, (x, y) => rank(x) - rank(y));
}
