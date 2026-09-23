#!/usr/bin/env node
// Layer 4, tool. Write the launch note: one record per builder a launcher starts as a process of
// its own, so oculus draws that builder under the session that launched it.
//
// A builder that is a native subagent is named by its parent's transcript; one started as a
// separate process (a Codex worker, or `claude -p`) is named nowhere the parent wrote. The launcher
// runs this at the launch, again when it learns the builder's transcript, and once more when the
// builder exits. The note is `~/.oculus/dispatches.json`, resolved at the call, a JSON list of
// records with the fields below; server/sessions/stores/dispatches.ts reads it. Any skill that
// starts an agent process may write it, so nothing here knows about plans.
//
// Several launchers may write at one moment, so every write holds a lock beside the note: the lock
// file is created exclusively, a busy one is retried, and one whose holder is gone, or that is
// older than any write holds one, is cleared under a second lock that re-checks it first (see
// breakStale for the one case that second lock cannot rule out). The note is replaced whole, by a
// temporary copy renamed over it, so a reader never meets half a write, and what a writer killed
// mid-write left beside the note is removed by the next one. A missing or unreadable note starts a
// new list rather than failing the launch. Node's own modules only, so a skill in another
// repository calls it by path. Usage:
//
//     node bin/dispatch-note.mjs start --launcher <what> --label <work> --harness claude|codex
//         --parent <session id> --cwd <dir> [--model <model>] [--transcript <path>]
//     node bin/dispatch-note.mjs transcript <id> <path>
//     node bin/dispatch-note.mjs end <id>
//
// `start` prints the new record's id, which the other two take.

import { randomBytes, randomUUID } from 'node:crypto';
import {
    linkSync,
    mkdirSync,
    readFileSync,
    readdirSync,
    realpathSync,
    renameSync,
    rmSync,
    statSync,
    utimesSync,
    writeFileSync
} from 'node:fs';
import { homedir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

/** The harnesses a launch may name, which are the two session stores oculus reads. */
export const HARNESSES = ['claude', 'codex'];

/** The flags `start` takes, each a field of the record. */
export const START_FLAGS = ['launcher', 'label', 'harness', 'model', 'parent', 'cwd', 'transcript'];

/** The flags `start` refuses to go without. */
export const REQUIRED = ['launcher', 'label', 'harness', 'parent', 'cwd'];

/** Milliseconds between two tries at a busy lock, and how long to keep trying. */
export const LOCK_RETRY_MS = 20;
export const LOCK_WAIT_MS = 10000;

/** ~/.oculus/dispatches.json, resolved at the call so a test's HOME is the one read. */
export function notePath() {
    return join(homedir(), '.oculus', 'dispatches.json');
}

/** Wait without a timer, since every write here is synchronous. */
function pause(ms) {
    Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
}

/** Whether a process with this pid exists. Signal 0 asks the kernel and delivers nothing. */
function alive(pid) {
    if (!Number.isInteger(pid) || pid <= 0) return false;
    try {
        process.kill(pid, 0);
        return true;
    } catch (error) {
        // EPERM is a live process owned by another user.
        return error.code === 'EPERM';
    }
}

/** The pid a lock's content names, or 0 when it names none. */
function holderOf(content) {
    const pid = Number.parseInt(String(content).split(' ')[0] ?? '', 10);
    return Number.isInteger(pid) ? pid : 0;
}

function readText(path) {
    try {
        return readFileSync(path, 'utf8');
    } catch {
        return null;
    }
}

/** How long the breaker may stand before it counts as a dead clearer's; it is held for moments. */
export const BREAK_STALE_MS = 3000;

/** The lock's content and its age in milliseconds by mtime, or null when there is no lock. */
function lockState(lock) {
    const content = readText(lock);
    if (content === null) return null;
    try {
        return { content, age: Date.now() - statSync(lock).mtimeMs };
    } catch {
        return null;
    }
}

/**
 * Whether a lock is stale: its holder is gone, or it is older than any write holds one, which is
 * also what clears a lock whose pid a later, unrelated process has taken.
 */
function stale(state, waitMs) {
    return !alive(holderOf(state.content)) || state.age > waitMs;
}

/**
 * Remove a lock judged stale, but only after re-checking, under a second lock of its own, that the
 * lock is still the one judged: between the judgement and the removal its holder may have let it go
 * and another writer taken it. A breaker older than BREAK_STALE_MS was left by a clearer that died
 * holding it, and is removed by age. That removal is a look and then a removal, which the file
 * system gives no way to make one step, so two clearers may each remove such a breaker at once;
 * it needs a clearer killed in the moment it holds the breaker, and each clearer still removes
 * only a lock it re-read as the one judged.
 */
export function breakStale(lock, judged) {
    const breaker = `${lock}.break`;
    try {
        writeFileSync(breaker, String(process.pid), { mode: 0o600, flag: 'wx' });
    } catch (error) {
        if (error.code !== 'EEXIST') throw error;
        try {
            if (Date.now() - statSync(breaker).mtimeMs > BREAK_STALE_MS) rmSync(breaker);
        } catch {
            // Another clearer removed it first.
        }
        return;
    }
    try {
        if (readText(lock) === judged) rmSync(lock, { force: true });
    } finally {
        rmSync(breaker, { force: true });
    }
}

/** A file a writer keeps beside the note while it runs: its lock copy or its temporary note. */
const LITTER = /^dispatches\.json\.(?:lock\.)?(\d+)-[0-9a-f]+(?:\.tmp)?$/;

/**
 * Remove what a writer killed mid-write left beside the note: its own copy of the lock and its
 * temporary note, each named by its pid, removed only when that pid is not running.
 */
export function sweepLitter(folder) {
    let names;
    try {
        names = readdirSync(folder);
    } catch {
        return;
    }
    for (const name of names) {
        const found = LITTER.exec(name);
        if (found !== null && !alive(Number(found[1]))) rmSync(join(folder, name), { force: true });
    }
}

/**
 * Take the lock beside the note, or throw once the wait has passed with it held. The lock is
 * written whole under a name of this writer's own and then linked into place, which fails when a
 * lock is there: no other writer ever reads a lock that does not yet name its holder.
 */
export function takeLock(lock, waitMs = LOCK_WAIT_MS) {
    sweepLitter(dirname(lock));
    const content = `${process.pid} ${randomBytes(6).toString('hex')}`;
    const own = `${lock}.${process.pid}-${randomBytes(4).toString('hex')}`;
    writeFileSync(own, content, { mode: 0o600, flag: 'wx' });
    // Past the wait any lock that was there when the wait began is stale by age, so the deadline
    // leaves a moment beyond it for that lock to be cleared.
    const deadline = Date.now() + waitMs + 2000;
    try {
        for (;;) {
            try {
                // A hard link shares the copy's times, and a lock's age is what judges it stale, so
                // the copy is stamped now: a writer that waited long takes a lock born fresh.
                const now = new Date();
                utimesSync(own, now, now);
                linkSync(own, lock);
                return content;
            } catch (error) {
                if (error.code !== 'EEXIST') throw error;
            }
            wait(lock, deadline, waitMs);
        }
    } finally {
        rmSync(own, { force: true });
    }
}

/** One turn at a busy lock: clear it if it is stale, else pause, or throw past the deadline. */
function wait(lock, deadline, waitMs) {
    const state = lockState(lock);
    if (state !== null && stale(state, waitMs)) {
        breakStale(lock, state.content);
        pause(1);
        return;
    }
    if (Date.now() > deadline) {
        throw new Error(`the note is locked by ${lock} and its holder is still running`);
    }
    pause(LOCK_RETRY_MS);
}

/** Let the lock go, if it is still the one this writer took. */
function releaseLock(lock, content) {
    if (readText(lock) === content) rmSync(lock, { force: true });
}

/** The note's records, or a new list when the file is missing, unreadable or not a list. */
export function readNote(path) {
    const text = readText(path);
    if (text === null) return [];
    try {
        const value = JSON.parse(text);
        return Array.isArray(value)
            ? value.filter((item) => typeof item === 'object' && item !== null)
            : [];
    } catch {
        return [];
    }
}

/** Replace the note whole: a temporary copy beside it, then a rename, which is atomic. */
function writeNote(path, records) {
    const temporary = `${path}.${process.pid}-${randomBytes(6).toString('hex')}.tmp`;
    try {
        writeFileSync(temporary, `${JSON.stringify(records, null, 4)}\n`, { mode: 0o600 });
        renameSync(temporary, path);
    } catch (error) {
        rmSync(temporary, { force: true });
        throw error;
    }
}

/** Read, change and write the note under its lock; `change` returns what the command prints. */
export function update(path, change) {
    mkdirSync(dirname(path), { recursive: true, mode: 0o700 });
    const lock = `${path}.lock`;
    const content = takeLock(lock);
    try {
        const records = readNote(path);
        const printed = change(records);
        writeNote(path, records);
        return printed;
    } finally {
        releaseLock(lock, content);
    }
}

/** `--name value` pairs into a map, refusing a flag `start` does not take and a bare word. */
export function readFlags(argv) {
    const flags = {};
    for (let at = 0; at < argv.length; at += 2) {
        const flag = argv[at];
        const value = argv[at + 1];
        const name = flag.startsWith('--') ? flag.slice(2) : '';
        if (!START_FLAGS.includes(name)) throw new Error(`not a flag of start: ${flag}`);
        if (value === undefined) throw new Error(`${flag} needs a value`);
        if (name in flags) throw new Error(`${flag} is given twice`);
        flags[name] = value;
    }
    return flags;
}

/** The new record `start` writes, with the time it started and nothing ended yet. */
export function newRecord(flags, now = new Date()) {
    for (const name of REQUIRED) {
        if (!flags[name]) throw new Error(`start needs --${name}`);
    }
    if (!HARNESSES.includes(flags.harness)) {
        throw new Error(`--harness must be one of ${HARNESSES.join(', ')}: ${flags.harness}`);
    }
    return {
        id: randomUUID(),
        launcher: flags.launcher,
        label: flags.label,
        harness: flags.harness,
        model: flags.model ?? '',
        parent: flags.parent,
        cwd: resolve(flags.cwd),
        transcript: flags.transcript ? resolve(flags.transcript) : '',
        startedAt: now.toISOString(),
        endedAt: ''
    };
}

/** The record with this id, or a thrown error naming it. */
function recordOf(records, id) {
    const found = records.find((record) => record.id === id);
    if (found === undefined) throw new Error(`no launch with the id ${id}`);
    return found;
}

/** Run one command against the note at `path`, and return what it prints. */
export function run(argv, path = notePath()) {
    const [command, ...rest] = argv;
    if (command === 'start') {
        const record = newRecord(readFlags(rest));
        return update(path, (records) => {
            records.push(record);
            return record.id;
        });
    }
    if (command === 'transcript') {
        const [id, transcript] = rest;
        if (!id || !transcript || rest.length !== 2)
            throw new Error('usage: transcript <id> <path>');
        return update(path, (records) => {
            recordOf(records, id).transcript = resolve(transcript);
            return id;
        });
    }
    if (command === 'end') {
        const [id] = rest;
        if (!id || rest.length !== 1) throw new Error('usage: end <id>');
        return update(path, (records) => {
            const record = recordOf(records, id);
            // An end is one moment: a second `end` keeps the first stamp.
            if (!record.endedAt) record.endedAt = new Date().toISOString();
            return id;
        });
    }
    throw new Error('usage: start --launcher ... | transcript <id> <path> | end <id>');
}

/** Whether this file is the script node was asked to run, through a symlink or not. */
function isMain() {
    try {
        return realpathSync(process.argv[1] ?? '') === realpathSync(fileURLToPath(import.meta.url));
    } catch {
        return false;
    }
}

if (isMain()) {
    try {
        process.stdout.write(`${run(process.argv.slice(2))}\n`);
    } catch (error) {
        process.stderr.write(`dispatch-note: ${error instanceof Error ? error.message : error}\n`);
        process.exit(1);
    }
}
