// Layer 2, server. A `status --porcelain=v1 -z` read taken record by record as git writes it, so
// a repository with any number of untracked files is read whole with no limit on the output, and a
// reader that has its answer ends git there. The module that runs the status (core/git/run.ts for
// the state read, server/git/git-write.ts and server/git/deposit/deposit-git.ts for the checks of
// the writes) starts git at its own call site and hands the process here; nothing here starts one.
//
// A record is two letters, a space and a path, never quoted, and the fields are separated by NUL: a
// field shorter than four characters is no record, and a record whose letters hold an R or a C (a
// rename or a copy) takes the field after it as the path it came from. A field is cut from the
// bytes at its NUL and decoded then, so a character is never split across two chunks.
//
// The read ends in one of these ways, which the caller turns into its own outcome: git exits 0, and
// the last field is read; the reader answers false for a record, and git is ended with nothing more
// read, which is no failure; the time limit runs out, and git is ended with an error marked
// `killed`, which parse.ts's `classifyFailure` names `timed-out`; Cancel aborts the signal, and the
// error is the one running.ts's `endWith` answers for it, `cancelled`; git cannot start, and the
// error is the one the process gave, with its text code; git exits with another status or is ended
// by a signal nothing here sent, and the error carries the status or the signal beside what git
// wrote to its error stream.

import type { ChildProcess } from 'node:child_process';
import type { StatusRecord } from './parse.ts';
import { endWith } from './running.ts';

/** What a reader does with one record: false ends the read, anything else reads on. */
export type RecordVisit = (record: StatusRecord) => unknown;

/** An error of a read, with the fields `classifyFailure` reads. */
export type RecordError = Error & { code?: unknown; killed?: boolean; signal?: unknown };

/**
 * How a read ended: the error, null when git exited 0 or the reader ended it, and what git wrote
 * to its error stream.
 */
export type RecordsEnd = { error: RecordError | null; stderr: string };

/** The limits of one read: milliseconds before git is ended (0 for none), and Cancel's signal. */
export type RecordLimits = { timeout: number; signal?: AbortSignal };

/** The fields of a status output, fed in chunks, handed to `visit` as records. */
function splitter(visit: RecordVisit): { push: (chunk: Buffer) => boolean; finish: () => void } {
    let rest = Buffer.alloc(0);
    let moving: StatusRecord | null = null;
    let going = true;
    const field = (bytes: Buffer): void => {
        const text = bytes.toString('utf8');
        if (moving !== null) {
            const record = { ...moving, from: text };
            moving = null;
            going = visit(record) !== false;
            return;
        }
        if (text.length < 4) return;
        const record: StatusRecord = { code: text.slice(0, 2), path: text.slice(3), from: null };
        if (/[RC]/.test(record.code)) moving = record;
        else going = visit(record) !== false;
    };
    return {
        push(chunk) {
            const data = rest.length === 0 ? chunk : Buffer.concat([rest, chunk]);
            let start = 0;
            for (let at = data.indexOf(0); going && at !== -1; at = data.indexOf(0, start)) {
                field(data.subarray(start, at));
                start = at + 1;
            }
            rest = Buffer.from(data.subarray(start));
            return going;
        },
        finish() {
            if (going && rest.length > 0) field(rest);
            if (going && moving !== null) {
                const record = moving;
                moving = null;
                visit(record);
            }
        }
    };
}

/** Hand every record of a whole status output to `visit`, until it answers false. */
export function visitText(output: string, visit: RecordVisit): void {
    const split = splitter(visit);
    if (split.push(Buffer.from(output, 'utf8'))) split.finish();
}

/** An error with the fields a failed `execFile` would carry. */
function errorOf(message: string, fields: Partial<RecordError>): RecordError {
    return Object.assign(new Error(message), fields);
}

/**
 * Read the status `child` writes, handing each record to `visit` as it arrives. Never rejects:
 * every way the read can end is an answer.
 */
export function readRecords(
    child: ChildProcess,
    limits: RecordLimits,
    visit: RecordVisit
): Promise<RecordsEnd> {
    return new Promise((answer) => {
        const ended =
            limits.signal === undefined
                ? (error: Error | null) => error
                : endWith(child, limits.signal);
        const split = splitter(visit);
        const errors: Buffer[] = [];
        let stopped = false;
        let late = false;
        let broken: RecordError | null = null;
        let settled = false;
        let timer: ReturnType<typeof setTimeout> | null = null;
        const settle = (error: RecordError | null): void => {
            if (settled) return;
            settled = true;
            if (timer !== null) clearTimeout(timer);
            answer({ error, stderr: Buffer.concat(errors).toString('utf8') });
        };
        if (limits.timeout > 0) {
            timer = setTimeout(() => {
                late = true;
                child.kill();
            }, limits.timeout);
        }
        child.stdout?.on('data', (chunk: Buffer) => {
            if (stopped || late) return;
            if (split.push(chunk)) return;
            stopped = true;
            child.stdout?.destroy();
            child.kill();
        });
        child.stderr?.on('data', (chunk: Buffer) => errors.push(chunk));
        child.on('error', (error: RecordError) => {
            broken = error;
            if (child.pid === undefined) settle(error);
        });
        child.on('close', (code: number | null, signal: NodeJS.Signals | null) => {
            if (stopped) {
                settle(null);
            } else if (late) {
                settle(errorOf('timed out', { killed: true, signal: signal ?? 'SIGTERM' }));
            } else if (broken !== null) {
                settle(broken);
            } else if (code === 0) {
                split.finish();
                settle(null);
            } else {
                const failure = errorOf(`git exited with ${code ?? signal ?? 'nothing'}`, {
                    ...(code === null ? {} : { code }),
                    ...(signal === null ? {} : { signal })
                });
                settle(ended(failure));
            }
        });
    });
}
