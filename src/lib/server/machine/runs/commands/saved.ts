// Layer 2, server. The commands a reader saved through the form: one machine-local file,
// `~/.oculus/commands.json`, a map from a repository's absolute real path to the list of its
// commands, each `{ name, run, cwd?, depends_on?, default? }` as in `.oculus/commands.yml`.
//
// The file is read whole and written whole by a rename, then read back, and a write whose
// read-back is not what was written is refused. A file that is not JSON or not a map of lists is
// one finding when listed and is never written over: a save or a remove over it is refused with
// the reason, so what the reader put there is not replaced.

import { readFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { z } from 'zod';
import { readJsonChecked, writeTextAtomic } from '../../../core/json.ts';
import { collect, fileFinding, type Entry, type Reading, type Taken } from './files.ts';

/** The mode of the file: it names the folders of this machine. */
const FILE_MODE = 0o600;

/** ~/.oculus/commands.json, resolved at the call rather than at import. */
export function savedPath(): string {
    return join(homedir(), '.oculus', 'commands.json');
}

const savedShape = z.record(z.string(), z.array(z.unknown()));

type Saved = Record<string, unknown[]>;

type Loaded = { ok: true; saved: Saved } | { ok: false; reason: string };

/** The file as it stands: empty when it is not there, and the reason when it does not read. */
function load(file: string): Loaded {
    const read = readJsonChecked(file);
    if (!read.ok) return read;
    if (read.value === undefined) return { ok: true, saved: {} };
    if (!savedShape.safeParse(read.value).success) {
        return { ok: false, reason: 'is not a map of repositories to lists' };
    }
    return { ok: true, saved: read.value as Saved };
}

/** The commands saved for a repository, with a finding when the file does not read. */
export function readSavedCommands(file: string, repo: string, taken: Taken): Reading {
    const loaded = load(file);
    if (!loaded.ok) return fileFinding(file, loaded.reason);
    const items = Object.hasOwn(loaded.saved, repo) ? loaded.saved[repo] : [];
    return collect(items, { repo, file, label: repo, source: 'saved' }, taken);
}

/**
 * Every saved command of every repository the file holds, each as its repository's real path and
 * its name, in the file's order; the reason when the file does not read. A missing file holds
 * none. The commands are those readSavedCommands lists for each repository, so a command whose
 * entry does not read is not here either.
 */
export function readAllSaved(
    file: string
): { ok: true; commands: { folder: string; name: string }[] } | { ok: false; reason: string } {
    const loaded = load(file);
    if (!loaded.ok) return loaded;
    const commands = Object.entries(loaded.saved).flatMap(([repo, items]) =>
        collect(items, { repo, file, label: repo, source: 'saved' }, new Set()).commands.map(
            (one) => ({ folder: repo, name: one.name })
        )
    );
    return { ok: true, commands };
}

/** What a save or a remove changed, for the change log: the entry before and after. */
export type SavedChange = { before: unknown; after: unknown };

/** The entry as it is stored: only the fields that hold something. */
function stored(entry: Entry): Record<string, unknown> {
    return {
        name: entry.name,
        run: entry.run,
        ...(entry.cwd ? { cwd: entry.cwd } : {}),
        ...(entry.depends_on && entry.depends_on.length > 0
            ? { depends_on: entry.depends_on }
            : {}),
        ...(entry.default ? { default: entry.default } : {})
    };
}

function nameOf(raw: unknown): unknown {
    return typeof raw === 'object' && raw !== null && 'name' in raw ? raw.name : undefined;
}

/** The refusal of a save or a remove, left to the route to answer. */
function refusal(file: string, reason: string): { ok: false; error: string } {
    return { ok: false, error: `commands.json ${reason}: ${file}` };
}

/** Write the map whole, private, and read it back: it throws when what is there is not it. */
function write(file: string, saved: Saved): void {
    const content = `${JSON.stringify(saved, null, 2)}\n`;
    writeTextAtomic(file, content, FILE_MODE);
    if (readFileSync(file, 'utf8') !== content) {
        throw new Error('what was read back is not what was written');
    }
}

/**
 * Save a command for the repository: a command of the same name is replaced where it stands, a new
 * one is added at the end. Answers what changed, or the reason the file was left as it was.
 */
export function saveCommand(
    file: string,
    repo: string,
    entry: Entry
): { ok: true; change: SavedChange } | { ok: false; error: string } {
    const loaded = load(file);
    if (!loaded.ok) return refusal(file, loaded.reason);
    const saved = loaded.saved;
    const list = Object.hasOwn(saved, repo) ? [...saved[repo]] : [];
    const at = list.findIndex((raw) => nameOf(raw) === entry.name);
    const before = at < 0 ? null : list[at];
    const after = stored(entry);
    if (at < 0) list.push(after);
    else list[at] = after;
    try {
        write(file, { ...saved, [repo]: list });
    } catch (error) {
        return refusal(
            file,
            `cannot be written: ${error instanceof Error ? error.message : String(error)}`
        );
    }
    return { ok: true, change: { before, after } };
}

/**
 * Remove the saved command of that name. `missing` is true when the repository has none of that
 * name; the file is then left as it was. A repository left with no command loses its key.
 */
export function removeCommand(
    file: string,
    repo: string,
    name: string
): { ok: true; change: SavedChange } | { ok: false; error: string; missing?: true } {
    const loaded = load(file);
    if (!loaded.ok) return refusal(file, loaded.reason);
    const saved = loaded.saved;
    const list = Object.hasOwn(saved, repo) ? saved[repo] : [];
    const at = list.findIndex((raw) => nameOf(raw) === name);
    if (at < 0)
        return {
            ok: false,
            error: `${name} is not a saved command of this repository`,
            missing: true
        };
    const before = list[at];
    const rest = list.filter((_, index) => index !== at);
    // The repository keeps its place among the others, or goes when its last command did.
    const next = Object.fromEntries(
        Object.entries(saved).flatMap(([key, raws]) => {
            if (key !== repo) return [[key, raws]];
            return rest.length === 0 ? [] : [[key, rest]];
        })
    );
    try {
        write(file, next);
    } catch (error) {
        return refusal(
            file,
            `cannot be written: ${error instanceof Error ? error.message : String(error)}`
        );
    }
    return { ok: true, change: { before, after: null } };
}
