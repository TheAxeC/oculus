// Layer 1, data. Pure calendar-date formatting shared by client state and server writes.
// Local getters keep "today" on the machine's calendar around midnight in non-UTC timezones.

/** The local calendar date at one Unix timestamp, as YYYY-MM-DD. */
export function localDate(now: number): string {
    const date = new Date(now);
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${date.getFullYear()}-${month}-${day}`;
}
