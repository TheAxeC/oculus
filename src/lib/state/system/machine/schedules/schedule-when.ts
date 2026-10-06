// Layer 2, client state. The two ways the schedule dialog reads a cron pattern: `whenOf` turns a
// pattern into the dialog's choice (Off, Every hour, Every day, Weekly or Custom, with its time and
// days), and `patternOf` turns a choice back into the pattern the file keeps. The dialog writes
// only three shapes (`0 * * * *`, `M H * * *` and `M H * * d,d`), so a pattern in any other shape,
// one written by hand, opens as Custom with the pattern as it stands and is never rewritten by an
// edit of another field. Pure functions over their arguments; the words of a refusal are the
// store's.

/** The dialog's choices of when. */
export const WHEN_CHOICES = ['off', 'hour', 'day', 'week', 'custom'] as const;
export type WhenChoice = (typeof WHEN_CHOICES)[number];

/** The seven days, Monday first, as the dialog lists them. */
export const WEEK_DAYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const;

/** What the dialog holds for a pattern. */
export type WhenShape = {
    when: WhenChoice;
    /** HH:MM, for Every day and Weekly. */
    time: string;
    /** One flag per day, Monday first, for Weekly. */
    days: boolean[];
    /** The pattern as written, for Custom. */
    pattern: string;
};

/** The words a choice that cannot be written is refused with. */
export type WhenRefusal = 'refused_time' | 'refused_days';

const MINUTE = '(0|[1-9]|[1-5]\\d)';
const HOUR = '(0|[1-9]|1\\d|2[0-3])';
const EVERY_DAY = new RegExp(`^${MINUTE} ${HOUR} \\* \\* \\*$`);
const WEEKLY = new RegExp(`^${MINUTE} ${HOUR} \\* \\* ([0-6](?:,[0-6])*)$`);
const TIME = /^([01]\d|2[0-3]):([0-5]\d)$/;

function clock(hour: string, minute: string): string {
    return `${hour.padStart(2, '0')}:${minute.padStart(2, '0')}`;
}

/** The cron day number (Sunday 0) of a day of the dialog's list (Monday first). */
function cronDay(index: number): number {
    return (index + 1) % 7;
}

/** The dialog's shape of a pattern; the empty pattern is Off. */
export function whenOf(pattern: string): WhenShape {
    const none = WEEK_DAYS.map(() => false);
    const custom: WhenShape = { when: 'custom', time: '07:00', days: none, pattern };
    if (pattern === '') return { when: 'off', time: '07:00', days: none, pattern: '' };
    if (pattern === '0 * * * *') return { when: 'hour', time: '07:00', days: none, pattern };
    const daily = EVERY_DAY.exec(pattern);
    if (daily !== null) {
        return { when: 'day', time: clock(daily[2], daily[1]), days: none, pattern };
    }
    const weekly = WEEKLY.exec(pattern);
    if (weekly === null) return custom;
    const numbers = weekly[3].split(',').map(Number);
    const ascending = numbers.every((day, at) => at === 0 || day > numbers[at - 1]);
    if (!ascending) return custom;
    const days = WEEK_DAYS.map((_, index) => numbers.includes(cronDay(index)));
    return { when: 'week', time: clock(weekly[2], weekly[1]), days, pattern };
}

/** The pattern a choice of the dialog writes, or the word it is refused with. */
export function patternOf(
    shape: Pick<WhenShape, 'when' | 'time' | 'days' | 'pattern'>
): { pattern: string } | { refused: WhenRefusal } {
    if (shape.when === 'off') return { pattern: '' };
    if (shape.when === 'hour') return { pattern: '0 * * * *' };
    if (shape.when === 'custom') return { pattern: shape.pattern.trim() };
    const time = TIME.exec(shape.time.trim());
    if (time === null) return { refused: 'refused_time' };
    const at = `${Number(time[2])} ${Number(time[1])}`;
    if (shape.when === 'day') return { pattern: `${at} * * *` };
    const chosen = WEEK_DAYS.map((_, index) => cronDay(index)).filter(
        (_, index) => shape.days[index]
    );
    if (chosen.length === 0) return { refused: 'refused_days' };
    return { pattern: `${at} * * ${chosen.sort((a, b) => a - b).join(',')}` };
}
