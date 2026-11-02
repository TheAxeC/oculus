// Layer 2, client state. The link between a session and the terminal it runs in, in both
// directions by one set of rules, so a session's Terminal tab, its box and the terminal rows of a
// page agree. A pure reading of the terminals and the session records a caller hands it.

import type { SessionRecord, Terminal } from '../../../../data/model/index.ts';

/** What the rules read of a terminal. */
export type LinkTerminal = Pick<Terminal, 'id' | 'foreign' | 'resumes' | 'pid' | 'cwd' | 'agent'>;

/** What the rules read of a session's record. */
export type LinkRecord = Pick<SessionRecord, 'id' | 'pid' | 'tool' | 'cwd' | 'live'>;

/** Whether a record is a running Codex session, which names no pid, in a folder. */
function codexIn(record: LinkRecord, cwd: string | null): boolean {
    return record.tool === 'codex' && record.live && record.pid === null && record.cwd === cwd;
}

/**
 * The terminal a Codex record with no pid runs in: the one terminal running `codex` in its folder,
 * while one such record stands there and the terminal's `resumes` names no other session.
 */
function codexTerminal<T extends LinkTerminal>(
    terminals: readonly T[],
    record: LinkRecord,
    records: readonly LinkRecord[]
): T | null {
    if (!codexIn(record, record.cwd)) return null;
    const here = terminals.filter((one) => one.agent?.tool === 'codex' && one.cwd === record.cwd);
    if (here.length !== 1 || records.filter((one) => codexIn(one, record.cwd)).length !== 1) {
        return null;
    }
    const [only] = here;
    return only.resumes === null || only.resumes.id === record.id ? only : null;
}

/**
 * The terminal a session runs in: the one that resumed it, the one whose pane process is the
 * session's own, since tmux runs an agent's argv directly, the one whose detected agent is, or
 * `codexTerminal`'s. Null for a session that runs in a terminal of its own.
 */
export function sessionTerminal<T extends LinkTerminal>(
    terminals: readonly T[],
    record: LinkRecord | null,
    records: readonly LinkRecord[]
): T | null {
    if (record === null) return null;
    const all = terminals.filter((one) => one.foreign !== true);
    const { pid } = record;
    return (
        all.find((one) => one.resumes?.id === record.id) ??
        all.find((one) => pid !== null && one.pid !== 0 && one.pid === pid) ??
        all.find((one) => pid !== null && one.agent?.pid === pid) ??
        codexTerminal(all, record, records)
    );
}

/** The session a terminal runs, by `sessionTerminal`'s rules; null for none. */
export function terminalSession<T extends LinkTerminal, R extends LinkRecord>(
    terminal: T,
    terminals: readonly T[],
    records: readonly R[]
): R | null {
    const runs = (one: R): boolean => sessionTerminal(terminals, one, records)?.id === terminal.id;
    return records.find(runs) ?? null;
}
