export function getUserLocale() {
  return "en-US";
}

export function formatDateWithMonthName(value, options = {}) {
  if (!value) return "";
  const date = parseDateValue(value);
  if (!date) return String(value);

  return new Intl.DateTimeFormat(getUserLocale(), {
    day: "numeric",
    month: "long",
    year: "numeric",
    ...options
  }).format(date);
}

export function formatMonthName(month) {
  const number = Number(month);
  if (!Number.isInteger(number) || number < 1 || number > 12) return "";
  return new Intl.DateTimeFormat(getUserLocale(), { month: "long" }).format(new Date(Date.UTC(2000, number - 1, 1)));
}

export function formatPartialDate({ day = "", month = "", year = "" } = {}) {
  const monthName = formatMonthName(month);
  const parts = [];
  if (day) parts.push(String(Number(day) || day));
  if (monthName) parts.push(monthName);
  if (year) parts.push(String(year));
  return parts.join(" ") || "";
}

export function formatDateTime(value) {
  if (!value) return "";
  const date = parseDateValue(value);
  if (!date) return String(value);

  return new Intl.DateTimeFormat(getUserLocale(), {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  }).format(date);
}

function parseDateValue(value) {
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value;

  const normalized = String(value).trim();
  if (!normalized) return null;

  const dateOnlyMatch = normalized.match(/^(-?\d{1,6})-(\d{2})-(\d{2})$/);
  if (dateOnlyMatch) {
    const [, year, month, day] = dateOnlyMatch;
    const date = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day)));
    return Number.isNaN(date.getTime()) ? null : date;
  }

  const date = new Date(normalized);
  return Number.isNaN(date.getTime()) ? null : date;
}


export const ENGLISH_MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

export function normalizeMonthInput(value) {
  const input = String(value || "").trim();
  if (!input) return "";
  const numeric = Number(input);
  if (Number.isInteger(numeric) && numeric >= 1 && numeric <= 12) return String(numeric).padStart(2, "0");
  const lowered = input.toLowerCase().replace(/\.$/, "");
  const index = ENGLISH_MONTHS.findIndex((month) => month.toLowerCase() === lowered || month.toLowerCase().slice(0, 3) === lowered.slice(0, 3));
  return index >= 0 ? String(index + 1).padStart(2, "0") : "";
}

export function parseFlexibleDateInput(value) {
  const input = String(value || "").trim();
  if (!input) return null;

  const isoMatch = input.match(/^(\d{1,6})-(\d{1,2})-(\d{1,2})$/);
  if (isoMatch) return buildDateParts(isoMatch[1], isoMatch[2], isoMatch[3]);

  const slashMatch = input.match(/^(\d{1,2})[/.](\d{1,2})[/.](\d{1,6})$/);
  if (slashMatch) return buildDateParts(slashMatch[3], slashMatch[2], slashMatch[1]);

  const dayMonthYear = input.match(/^(\d{1,2})\s+([A-Za-z]+)\s*,?\s*(\d{1,6})$/);
  if (dayMonthYear) return buildDateParts(dayMonthYear[3], normalizeMonthInput(dayMonthYear[2]), dayMonthYear[1]);

  const monthDayYear = input.match(/^([A-Za-z]+)\s+(\d{1,2}),?\s*(\d{1,6})$/);
  if (monthDayYear) return buildDateParts(monthDayYear[3], normalizeMonthInput(monthDayYear[1]), monthDayYear[2]);

  const parsed = new Date(input);
  if (Number.isNaN(parsed.getTime())) return null;
  return buildDateParts(parsed.getFullYear(), parsed.getMonth() + 1, parsed.getDate());
}

export function toIsoDate(parts) {
  if (!parts) return "";
  return `${String(parts.year).padStart(4, "0")}-${String(parts.month).padStart(2, "0")}-${String(parts.day).padStart(2, "0")}`;
}

function buildDateParts(year, month, day) {
  const y = Number(year);
  const m = Number(month);
  const d = Number(day);
  if (!Number.isInteger(y) || !Number.isInteger(m) || !Number.isInteger(d) || m < 1 || m > 12 || d < 1 || d > 31) return null;
  const date = new Date(Date.UTC(y, m - 1, d));
  if (date.getUTCFullYear() !== y || date.getUTCMonth() !== m - 1 || date.getUTCDate() !== d) return null;
  return { year: String(y), month: String(m).padStart(2, "0"), day: String(d).padStart(2, "0") };
}