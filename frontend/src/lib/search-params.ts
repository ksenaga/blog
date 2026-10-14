// URLのクエリ（?page=2 など）を読み取る
type Param = string | string[] | undefined;

const first = (value: Param) => (Array.isArray(value) ? value[0] : value);

export function parsePage(value: Param) {
  const page = Number(first(value));
  return Number.isInteger(page) && page >= 1 ? page : 1;
}

export function parsePositiveInt(value: Param) {
  const number = Number(first(value));
  return Number.isInteger(number) && number >= 1 ? number : undefined;
}

export function parseKeyword(value: Param) {
  const keyword = first(value)?.trim();
  return keyword ? keyword.slice(0, 100) : undefined;
}
