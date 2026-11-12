/** Public name of the daily letter. Nav, headings, and pages read this. */
export const LETTER_NAME = "Today in Musk World" as const;

/**
 * Public base path. Dated issues are `${LETTER_PATH}/YYYY-MM-DD`.
 * The archive is `${LETTER_PATH}/archive`.
 * The matching route folder is `src/app/(desk)/letter`.
 */
export const LETTER_PATH = "/letter" as const;

export const LETTER_ARCHIVE_PATH = `${LETTER_PATH}/archive` as const;

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"] as const;

/** Desk style: "12 Nov 2026". Parsed from the date string so time zones cannot shift the day. */
export function letterDateLabel(isoDate: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(isoDate);
  if (!match) return isoDate;
  const month = MONTHS[Number(match[2]) - 1];
  if (!month) return isoDate;
  return `${Number(match[3])} ${month} ${match[1]}`;
}

export function letterIssuePath(date: string) {
  return `${LETTER_PATH}/${date}`;
}
