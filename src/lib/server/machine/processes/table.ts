// Layer 2, server. The reader of one line of the process table. ps.ts runs `ps` with the columns
// pid, ppid, user, pcpu, rss, lstart and command, and this turns each line into a row: `pcpu` is
// the percentage `ps` reports, `rss` the resident set in kilobytes, `lstart` the start as the
// machine's local wall-clock time in the fixed English form `Thu Oct  2 11:53:00 2026`, and the
// command is the rest of the line, the program and its arguments as `ps` printed them. The start is
// turned into an instant by a Date built from those local fields, so it carries the offset in force
// on the start's own date and not today's. A line that does not read is left out. Nothing here runs
// `ps` or reads the machine.

/** One process of the table, before its folder is known. */
export type Entry = {
    pid: number;
    ppid: number;
    user: string;
    started: string;
    cpu: number;
    memory: number;
    command: string;
};

/** The longest command line a row carries, the ellipsis included. */
const COMMAND_LIMIT = 1000;

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/**
 * pid, ppid, user, pcpu, rss, then the five words of lstart (weekday, month, day, time, year), then
 * the command. A line with fewer fields, or a number that is not one, does not match.
 */
const LINE =
    /^\s*(\d+)\s+(\d+)\s+(\S+)\s+(\d+(?:\.\d+)?)\s+(\d+)\s+[A-Z][a-z]{2}\s+([A-Z][a-z]{2})\s+(\d{1,2})\s+(\d{2}):(\d{2}):(\d{2})\s+(\d{4})\s+(\S.*)$/;

/** The UTC ISO time of a local wall-clock time, or empty when the fields are no such time. */
function instantOf(fields: number[]): string {
    const [year, month, day, hour, minute, second] = fields;
    const date = new Date(year, month, day, hour, minute, second);
    const same =
        date.getFullYear() === year &&
        date.getMonth() === month &&
        date.getDate() === day &&
        date.getHours() === hour &&
        date.getMinutes() === minute &&
        date.getSeconds() === second;
    return same ? date.toISOString() : '';
}

/** The command line cut at the limit. */
function cut(line: string): string {
    return line.length > COMMAND_LIMIT ? `${line.slice(0, COMMAND_LIMIT - 3)}...` : line;
}

/** The row of one line of `ps` output, or null when the line does not read. */
export function entryOf(line: string): Entry | null {
    const found = LINE.exec(line);
    if (found === null) return null;
    const month = MONTHS.indexOf(found[6]);
    const pid = Number(found[1]);
    const ppid = Number(found[2]);
    if (!Number.isSafeInteger(pid) || pid <= 0 || !Number.isSafeInteger(ppid)) return null;
    const started = instantOf([
        Number(found[11]),
        month,
        Number(found[7]),
        Number(found[8]),
        Number(found[9]),
        Number(found[10])
    ]);
    if (started === '') return null;
    return {
        pid,
        ppid,
        user: found[3],
        started,
        cpu: Number(found[4]),
        memory: Number(found[5]) * 1024,
        command: cut(found[12])
    };
}
