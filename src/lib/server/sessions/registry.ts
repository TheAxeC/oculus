// Layer 2, server. Which sessions are actually running, from Claude Code's own registry.
//
// A transcript cannot answer that: it records what happened, not what is happening. The registry
// at ~/.claude/sessions holds one <pid>.json per session with the pid and a status of `busy` or
// `idle`, so liveness is that file plus the kernel: the process must exist, and its start time
// must match the one the registry wrote, because a pid is reused by unrelated processes.
//
// The only thing sent to any pid here is signal 0, which asks the kernel whether the process
// exists and delivers nothing. No pid found in the registry is ever signalled for real.

import { readdirSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import type { LiveEntry, SessionRecord } from '../../data/model.ts';
import { isMap, readJson, text, whole } from './stores/json.ts';

/** Seconds of disagreement allowed between the registry's stamp and what `ps` reports. */
export const PROC_START_SLACK = 2;
export const PS_TIMEOUT_SEC = 3;

/**
 * The registry's own words for what a session is doing, mapped onto the vocabulary the views draw.
 * Anything else it reports passes through untouched rather than being flattened to `unknown`.
 */
export const REGISTRY_STATES: Record<string, string> = { busy: 'working', idle: 'idle' };

/** ~/.claude/sessions, resolved at the call so a test never depends on the real home directory. */
export function defaultRegistry(): string {
    return join(homedir(), '.claude', 'sessions');
}

/**
 * What the liveness check asks of the system. It is injected so a test can answer for it: the real
 * one signals and shells out, and a test's does neither.
 */
export type Probe = {
    /** Whether a process with this pid exists. */
    running(pid: number): boolean;
    /** pid to process start time in epoch seconds, for every pid at once. */
    starts(pids: number[]): Map<number, number>;
};

/** One registry file, reduced to what a record needs, plus the two fields only the check uses. */
type Candidate = LiveEntry & { sessionId: string; pid: number; procStart: string };

export const systemProbe: Probe = {
    running(pid: number): boolean {
        if (pid <= 0) return false;
        try {
            // Signal 0 asks the kernel whether the pid exists without touching the process.
            process.kill(pid, 0);
            return true;
        } catch (error) {
            // EPERM is a live process owned by another user.
            return (error as NodeJS.ErrnoException).code === 'EPERM';
        }
    },
    starts(pids: number[]): Map<number, number> {
        const wanted = [...new Set(pids.filter((pid) => pid > 0))].sort((a, b) => a - b);
        const starts = new Map<number, number>();
        if (wanted.length === 0) return starts;
        const args = ['-o', 'pid=,lstart='];
        for (const pid of wanted) args.push('-p', String(pid));
        // List arguments, never a shell, and a timeout: a hung `ps` must not hang a scan.
        const done = spawnSync('ps', args, {
            encoding: 'utf8',
            timeout: PS_TIMEOUT_SEC * 1000
        });
        if (done.error !== undefined || typeof done.stdout !== 'string') return starts;
        for (const line of done.stdout.split('\n')) {
            const parts = line.trim().split(/\s+/);
            if (parts.length < 6) continue;
            const pid = Number.parseInt(parts[0], 10);
            if (!Number.isInteger(pid)) continue;
            // `ps` prints a start time as `Wed Sep  9 14:08:35 2026`, in local time.
            const clock = parseStamp(parts.slice(1, 6).join(' '));
            if (clock !== null) starts.set(pid, clock.local);
        }
        return starts;
    }
};

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/**
 * `Wed Sep  9 14:08:35 2026` read twice, as UTC and as local time, both in epoch seconds. The two
 * readings exist because the registry writes the stamp in UTC and `ps` prints local time.
 */
export function parseStamp(value: string): { utc: number; local: number } | null {
    const parts = value.trim().split(/\s+/);
    if (parts.length !== 5) return null;
    const month = MONTHS.indexOf(parts[1]);
    const day = Number.parseInt(parts[2], 10);
    const year = Number.parseInt(parts[4], 10);
    const clock = parts[3].split(':').map((piece) => Number.parseInt(piece, 10));
    if (month < 0 || !Number.isInteger(day) || !Number.isInteger(year)) return null;
    if (clock.length !== 3 || clock.some((piece) => !Number.isInteger(piece))) return null;
    const [hour, minute, second] = clock;
    return {
        utc: Date.UTC(year, month, day, hour, minute, second) / 1000,
        local: new Date(year, month, day, hour, minute, second).getTime() / 1000
    };
}

/** Format a moment the way `ps` and the registry both write it. Used by the tests and the probe. */
export function formatStamp(seconds: number, utc = true): string {
    const when = new Date(seconds * 1000);
    const day = utc ? when.getUTCDate() : when.getDate();
    const pad = (value: number): string => String(value).padStart(2, '0');
    const weekday = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][
        utc ? when.getUTCDay() : when.getDay()
    ];
    const month = MONTHS[utc ? when.getUTCMonth() : when.getMonth()];
    const clock = utc
        ? `${pad(when.getUTCHours())}:${pad(when.getUTCMinutes())}:${pad(when.getUTCSeconds())}`
        : `${pad(when.getHours())}:${pad(when.getMinutes())}:${pad(when.getSeconds())}`;
    const year = utc ? when.getUTCFullYear() : when.getFullYear();
    return `${weekday} ${month} ${String(day).padStart(2, ' ')} ${clock} ${year}`;
}

/** One registry file, reduced to the fields the record needs. Null when it is not usable. */
function candidate(path: string): Candidate | null {
    const data = readJson(path);
    if (!isMap(data)) return null;
    const ident = data.sessionId;
    const pid = data.pid;
    if (typeof ident !== 'string' || !ident) return null;
    if (typeof pid !== 'number' || !Number.isInteger(pid)) return null;
    return {
        sessionId: ident,
        pid,
        status: text(data.status),
        name: text(data.name),
        kind: text(data.kind),
        entrypoint: text(data.entrypoint),
        cwd: text(data.cwd),
        startedAt: whole(data.startedAt),
        procStart: text(data.procStart)
    };
}

/**
 * A pid can be reused by an unrelated process, so the registry's `procStart` must agree with the
 * start time the pid actually has. The registry writes that stamp in UTC while `ps` reports local
 * time, so both readings are tried; an unreadable or missing stamp accepts the pid check alone.
 */
function sameProcess(claimed: string, actual: number | undefined): boolean {
    if (actual === undefined || !claimed) return true;
    const parsed = parseStamp(claimed);
    if (parsed === null) return true;
    return (
        Math.abs(parsed.utc - actual) <= PROC_START_SLACK ||
        Math.abs(parsed.local - actual) <= PROC_START_SLACK
    );
}

/**
 * Session id to live entry, for the sessions whose process is really running. Never throws: a
 * malformed, vanished or unreadable file drops that one entry. The `.key` files beside the
 * registry entries hold credentials and are never opened.
 */
export function liveSessions(
    registry?: string,
    probe: Probe = systemProbe
): Map<string, LiveEntry> {
    const folder = registry ?? defaultRegistry();
    let names: string[];
    try {
        names = readdirSync(folder);
    } catch {
        return new Map();
    }
    const candidates: Candidate[] = [];
    for (const name of names) {
        if (!name.endsWith('.json')) continue;
        const entry = candidate(join(folder, name));
        if (entry !== null && probe.running(entry.pid)) candidates.push(entry);
    }
    const starts = probe.starts(candidates.map((entry) => entry.pid));
    const live = new Map<string, LiveEntry>();
    for (const entry of candidates) {
        if (!sameProcess(entry.procStart, starts.get(entry.pid))) continue;
        // sessionId is the key and procStart was a check, so neither goes on the entry.
        live.set(entry.sessionId, {
            pid: entry.pid,
            status: entry.status,
            name: entry.name,
            kind: entry.kind,
            entrypoint: entry.entrypoint,
            cwd: entry.cwd,
            startedAt: entry.startedAt
        });
    }
    return live;
}

/**
 * Fold one live entry into a record. Without one the session has ended, whatever the tail of its
 * transcript looks like; with one, the registry's status replaces the transcript's guess.
 */
export function mergeLive(
    record: SessionRecord,
    entry: LiveEntry | undefined,
    dismissed: Set<string>
): void {
    if (entry === undefined) {
        record.live = false;
        record.liveStatus = null;
        record.pid = null;
        record.registryName = null;
        record.state = 'ended';
        record.hidden = dismissed.has(record.id);
        return;
    }
    // A running session is never hidden, whatever the overrides file says: it is on screen because
    // it is running, and having it vanish and reappear would read as a bug.
    record.live = true;
    record.liveStatus = entry.status || null;
    record.pid = entry.pid;
    record.registryName = entry.name || null;
    record.hidden = false;
    const state = REGISTRY_STATES[entry.status] ?? entry.status;
    if (state) record.state = state;
}
