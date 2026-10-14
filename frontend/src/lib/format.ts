// 閲覧側の日付：2026年10月14日（screendesign.md 1-3）
const dateFormatter = new Intl.DateTimeFormat("ja-JP", {
  year: "numeric",
  month: "long",
  day: "numeric",
  timeZone: "Asia/Tokyo",
});

export function formatDate(value: string) {
  return dateFormatter.format(new Date(value));
}

// 公開日と更新日が同じ日かどうか（日本時間で比べる）
export function isSameDay(a: string, b: string) {
  return formatDate(a) === formatDate(b);
}

// 本文の文字数から読むのにかかる時間（1分あたり500文字）
export function readingMinutes(html: string) {
  const length = html.replace(/<[^>]+>/g, "").length;
  return Math.max(1, Math.round(length / 500));
}
