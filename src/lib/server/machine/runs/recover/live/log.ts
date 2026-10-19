// Layer 2, server. Recover's record of a dataset: every request, command and result with its time,
// one line each, in `~/.oculus/recover/<hub>/<key>.log` on this Mac, where the fetch script appends
// curl's lines too. On the cluster the fetch script writes the same lines to `recover.log` in the
// dataset's folder and the check job to its own output, both read back through the runner
// (cluster.ts). A line names files, addresses and codes, never a credential.

import { appendFileSync, readFileSync } from 'node:fs';

/** The name of the log a fetch script writes in the dataset's folder on the cluster. */
export const CLUSTER_LOG = 'recover.log';

/** How many lines of a log the view is sent. */
export const LOG_LINES = 200;

/** A line with the time in front, as the fetch script's `say` writes it. */
function stamped(line: string, now: Date = new Date()): string {
    return `${now.toISOString().replace(/\.\d{3}Z$/, 'Z')} ${line}`;
}

/** Append one stamped line to a log; a log that cannot be written loses the line. */
export function logLine(file: string, line: string): void {
    try {
        appendFileSync(file, `${stamped(line)}\n`, { mode: 0o600 });
    } catch {
        // The view reads the run's state from the disk and the process, never from the log.
    }
}

/** The last lines of a text. */
export function lastLines(text: string, count: number = LOG_LINES): string[] {
    const lines = text.split('\n').filter((line) => line !== '');
    return lines.slice(-count);
}

/** The last lines of a log; none when it is absent. */
export function logTail(file: string, count: number = LOG_LINES): string[] {
    try {
        return lastLines(readFileSync(file, 'utf8'), count);
    } catch {
        return [];
    }
}
