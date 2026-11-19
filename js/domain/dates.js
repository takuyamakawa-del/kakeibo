// 日付ユーティリティ。日付は端末ローカル時刻の "YYYY-MM-DD" 文字列で扱う。
// 文字列のまま大小比較できる（'2026-11-01' < '2026-11-19'）。

const pad = (n) => String(n).padStart(2, '0');

/** Date → "YYYY-MM-DD"（ローカル時刻） */
export function toKey(date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** 今日の "YYYY-MM-DD" */
export function todayKey(now = new Date()) {
  return toKey(now);
}

/** "YYYY-MM-DD" → Date（ローカル時刻の 0:00） */
export function parseKey(key) {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function addDays(key, n) {
  const d = parseKey(key);
  d.setDate(d.getDate() + n);
  return toKey(d);
}

/** "YYYY-MM-DD" → "YYYY-MM" */
export function monthOf(key) {
  return key.slice(0, 7);
}

/** "YYYY-MM" に n か月足す */
export function addMonths(ym, n) {
  const [y, m] = ym.split('-').map(Number);
  const d = new Date(y, m - 1 + n, 1);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}`;
}

/** 0=日曜 … 6=土曜 */
export function weekdayOf(key) {
  return parseKey(key).getDay();
}

/** 月カレンダー用の週配列（日曜始まり、月外は null） */
export function calendarWeeks(ym) {
  const [y, m] = ym.split('-').map(Number);
  const first = new Date(y, m - 1, 1);
  const days = new Date(y, m, 0).getDate();
  const cells = Array(first.getDay()).fill(null);
  for (let d = 1; d <= days; d++) cells.push(`${ym}-${pad(d)}`);
  while (cells.length % 7 !== 0) cells.push(null);
  const weeks = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));
  return weeks;
}

/** "2026-11-19" → { month: 11, day: 19, weekday: 4 } 表示用 */
export function partsOf(key) {
  const d = parseKey(key);
  return { year: d.getFullYear(), month: d.getMonth() + 1, day: d.getDate(), weekday: d.getDay() };
}
