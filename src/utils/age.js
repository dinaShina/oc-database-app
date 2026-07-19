import { formatPartialDate } from "./dateFormat.js";

export function getBirthLabel(oc) {
  return formatPartialDate({
    day: oc.birthDay,
    month: oc.birthMonth,
    year: oc.birthYear
  }) || "Unknown";
}
