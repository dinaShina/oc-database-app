export function getBirthLabel(oc) {
  const parts = [];

  if (oc.birthDay) parts.push(padDatePart(oc.birthDay));
  if (oc.birthMonth) parts.push(padDatePart(oc.birthMonth));
  if (oc.birthYear) parts.push(oc.birthYear);

  return parts.length > 0 ? parts.join(".") : "Unknown";
}

function padDatePart(value) {
  return String(value).padStart(2, "0");
}
