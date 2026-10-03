// Layer 1, data. What the Processes view reads: one row per listed process and the payload of one
// read of the machine's process table.

/** The state of a read: `failed` carries the rows of the last good read under the error. */
type ProcessesStatus = 'ok' | 'failed';

/** One listed process, with the figures `ps` reports for it. */
export type ProcessRow = {
    pid: number;
    /** The parent's pid; 0 when the table gave none. */
    ppid: number;
    user: string;
    /** When the process started, an ISO time in UTC; empty when the table's value did not parse. */
    started: string;
    /** The percentage of one core `ps` reports, at least 0. */
    cpu: number;
    /** The resident set in bytes. */
    memory: number;
    /** The program path and its arguments, cut at 1,000 characters with `...`. */
    command: string;
    /** The process's working folder; empty when `lsof` did not answer for it. */
    folder: string;
    /** The id of the oculus terminal whose tree holds the process; absent for a matched process. */
    terminal?: string;
};

/** The `processes` channel: one complete read. */
export type ProcessesPayload = {
    status: ProcessesStatus;
    /** When the rows were read; empty before the first good read. */
    updated: string;
    /** Oculus's own processes grouped by terminal, then the matched processes by CPU. */
    rows: ProcessRow[];
    /** The `claude` and `codex` programs on the machine, one per tree of the same program. */
    agents: number;
    /** The projects an oculus terminal or an agent works in. */
    projects: number;
    /** The sentence of the failure while `status` is `failed`. */
    error?: string;
};
