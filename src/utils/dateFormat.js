export function getUserLocale() {
  if (typeof navigator !== "undefined" && navigator.language) return navigator.language;
  return "en";
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

