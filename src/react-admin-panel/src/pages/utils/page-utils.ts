export function parseDocumentDate(dateStr: string): { date: string; time: string } {
  const date = dateStr.replace("+0000", "+0100"); // Indicamos que se encuentra en UTC+1
  const dateObj = new Date(date);
  const dateOpt = { year: "numeric", month: "2-digit", day: "2-digit" } as Intl.DateTimeFormatOptions;
  const timeOpt = { hour: "2-digit", minute: "2-digit" } as Intl.DateTimeFormatOptions;

  const result = { date: "", time: "" };

  try {
    result.date = new Intl.DateTimeFormat(undefined, dateOpt).format(dateObj);
    result.time = new Intl.DateTimeFormat(undefined, timeOpt).format(dateObj);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (e) {
    console.warn("Error parsing date");
  }

  return result;
}

export function calcTotalPages({pageSize, totalItems}: {pageSize: number; totalItems: number}): number {
    pageSize = Math.max(1, pageSize);
    const computedTotalPages = Math.max(1, Math.ceil(totalItems / pageSize));
    return computedTotalPages;
}

export function capitalizeFirstLetter(str: string) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}