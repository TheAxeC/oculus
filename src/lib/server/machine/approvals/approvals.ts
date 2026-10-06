// Layer 2, server. The approvals file DESIGN.md's "Approval" paragraph describes, as the project
// commands use it: one file of the texts a reader approved to run on this machine, each under a key
// made from its kind and the SHA-256 of the exact text, so a changed text asks again. The text a
// project command is approved by is the whole chain a press runs, with the repository's path.
//
// The shape is the one every user of the processes rule shares, `{ version: 1, approved: { "<kind>:
// <sha256>": { label, at, folder? } } }`. There are three kinds of key. A command is approved under
// `command:<sha256>` of its chain text. An app is approved under `app:<sha256>` of its content,
// with the real path of its folder, and at most one `app` entry is live per folder. A Python
// interpreter a repository holds is approved under `interpreter:<sha256>` of the JSON `[repository
// real path, interpreter path]`, so a changed path or another repository asks again. An entry of a
// kind a call does not write is kept as it stood. The file is private to its owner (mode 0600), and
// the default file's folder, `~/.oculus`, is made mode 0700 when it is looser; the file is written
// whole by a rename and read back to check the write. A file that is not JSON, or not that shape,
// is read as holding no approvals, which asks again for everything and approves nothing by mistake,
// and a write over it is refused with the reason, so the bytes the reader put there are never
// replaced.

import { createHash } from 'node:crypto';
import { chmodSync, mkdirSync, readFileSync, statSync } from 'node:fs';
import { homedir } from 'node:os';
import { basename, dirname, join, relative } from 'node:path';
import { z } from 'zod';
import type { ChainLine } from '../../../data/model/index.ts';
import { readJsonChecked, writeTextAtomic } from '../../core/json.ts';

/** The mode of the file: the texts it holds name commands of this machine's repositories. */
const FILE_MODE = 0o600;

/** The mode a folder made for the file gets. */
const FOLDER_MODE = 0o700;

/** ~/.oculus/approvals.json, resolved at the call rather than at import. */
export function defaultApprovalsPath(): string {
    return join(homedir(), '.oculus', 'approvals.json');
}

/** One approved entry. An app's carries its folder too, kept when the file is rewritten. */
const entryShape = z.looseObject({ label: z.string(), at: z.string() });

const approvalsShape = z.object({
    version: z.literal(1),
    approved: z.record(z.string(), entryShape)
});

export type Approvals = z.infer<typeof approvalsShape>;

/** The key of a command text: `command:` and the SHA-256 of the text as hex. */
function commandKey(text: string): string {
    return `command:${createHash('sha256').update(text, 'utf8').digest('hex')}`;
}

/**
 * The lines of a chain as the reader approves them: for each command in run order, its folder
 * relative to the repository (`.` for the repository itself) and its line before any placeholder is
 * replaced.
 */
export function chainLines(repo: string, chain: { cwd: string; run: string }[]): ChainLine[] {
    return chain.map((command) => ({
        folder: relative(repo, command.cwd) || '.',
        run: command.run
    }));
}

/**
 * The text a chain is approved by: the repository's real path and the lines of the chain in run
 * order, so a changed line, folder, dependency or repository asks again. It is JSON, so a tab or a
 * line break inside a folder or a line cannot read as the boundary between two.
 */
export function chainText(repo: string, lines: ChainLine[]): string {
    return JSON.stringify({ repo, chain: lines.map((line) => [line.folder, line.run]) }, null, 1);
}

type Loaded = { ok: true; approvals: Approvals } | { ok: false; error: string };

/** The file as it stands: empty when it is not there, and the reason when it does not read. */
function load(file: string): Loaded {
    const read = readJsonChecked(file);
    if (!read.ok) return { ok: false, error: `${basename(file)} ${read.reason}: ${file}` };
    if (read.value === undefined) return { ok: true, approvals: { version: 1, approved: {} } };
    if (!approvalsShape.safeParse(read.value).success) {
        return { ok: false, error: `${basename(file)} is not the approvals shape: ${file}` };
    }
    // The schema accepts or refuses; the parsed value is what the file holds, so an entry's
    // fields the schema does not name are kept.
    return { ok: true, approvals: read.value as Approvals };
}

/** The approvals the file holds, or none for a file that is not there or does not read. */
function readApprovals(file: string): Approvals {
    const loaded = load(file);
    return loaded.ok ? loaded.approvals : { version: 1, approved: {} };
}

/** Whether the exact text was approved. */
export function isApproved(file: string, text: string): boolean {
    return commandKey(text) in readApprovals(file).approved;
}

/**
 * Make the folder of the approvals file mode 0700 when it is looser, so the file is private in it
 * as well as in itself. A folder another user owns is left as it is. It is called only for the
 * default file under `~/.oculus`, a folder that holds oculus's own state; a file the `approvals`
 * key puts elsewhere leaves the mode of its folder as it stands, which may be the home folder.
 */
function privateFolder(folder: string): void {
    const found = statSync(folder);
    if (found.uid === process.getuid?.() && (found.mode & 0o077) !== 0) {
        chmodSync(folder, FOLDER_MODE);
    }
}

/** What a write of the file answers: done, or the reason the file was left as it was. */
export type ApprovalWrite = { ok: true } | { ok: false; error: string };

/** Write the approved entries whole by a rename, read them back, and say what went wrong. */
function store(file: string, approved: Approvals['approved']): ApprovalWrite {
    const content = `${JSON.stringify({ version: 1, approved }, null, 2)}\n`;
    try {
        mkdirSync(dirname(file), { recursive: true, mode: FOLDER_MODE });
        if (file === defaultApprovalsPath()) privateFolder(dirname(file));
        writeTextAtomic(file, content, FILE_MODE);
        chmodSync(file, FILE_MODE);
        if (readFileSync(file, 'utf8') !== content) {
            return { ok: false, error: `${basename(file)} was not written as asked: ${file}` };
        }
    } catch (error) {
        const why = error instanceof Error ? error.message : String(error);
        return { ok: false, error: `${basename(file)} cannot be written: ${why}` };
    }
    return { ok: true };
}

/**
 * Approve the texts: one entry for each, none added for a text already held, so an approval
 * pressed twice leaves one. Answers `{ ok: true }`, or the reason the file was left as it was.
 */
export function approveTexts(file: string, texts: string[], now: Date = new Date()): ApprovalWrite {
    const loaded = load(file);
    if (!loaded.ok) return loaded;
    const approved = { ...loaded.approvals.approved };
    for (const text of texts) {
        const key = commandKey(text);
        if (!(key in approved)) approved[key] = { label: text, at: now.toISOString() };
    }
    return store(file, approved);
}

/**
 * The text an interpreter is approved by: the repository's real path and the interpreter's path.
 */
function interpreterText(repo: string, interpreter: string): string {
    return JSON.stringify([repo, interpreter]);
}

/** The key of an interpreter: `interpreter:` and the SHA-256 of its text as hex. */
function interpreterKey(repo: string, interpreter: string): string {
    const hash = createHash('sha256').update(interpreterText(repo, interpreter), 'utf8');
    return `interpreter:${hash.digest('hex')}`;
}

/** Whether the reader approved this repository's interpreter on this machine. */
export function isInterpreterApproved(file: string, repo: string, interpreter: string): boolean {
    return interpreterKey(repo, interpreter) in readApprovals(file).approved;
}

/**
 * Approve a repository's interpreter: one entry for the pair, none added for a pair already held.
 * Answers `{ ok: true }`, or the reason the file was left as it was.
 */
export function approveInterpreter(
    file: string,
    repo: string,
    interpreter: string,
    now: Date = new Date()
): ApprovalWrite {
    const loaded = load(file);
    if (!loaded.ok) return loaded;
    const key = interpreterKey(repo, interpreter);
    if (key in loaded.approvals.approved) return { ok: true };
    const approved = { ...loaded.approvals.approved };
    approved[key] = { label: interpreterText(repo, interpreter), at: now.toISOString() };
    return store(file, approved);
}

/** The key of an app: `app:` and the content hash the watcher computed, as hex. */
function appKey(hash: string): string {
    return `app:${hash}`;
}

/** The folder an `app` entry was approved for, or null for an entry that names none. */
function folderOf(entry: Record<string, unknown>): string | null {
    return typeof entry.folder === 'string' ? entry.folder : null;
}

/** The entries of the file without the `app` entries of this folder, and only those. */
function withoutApp(approved: Approvals['approved'], folder: string): Approvals['approved'] {
    return Object.fromEntries(
        Object.entries(approved).filter(
            ([key, entry]) => !(key.startsWith('app:') && folderOf(entry) === folder)
        )
    );
}

/** The content hashes of the apps the file holds approved, none for a file that does not read. */
export function approvedApps(file: string): Set<string> {
    return new Set(
        Object.keys(readApprovals(file).approved)
            .filter((key) => key.startsWith('app:'))
            .map((key) => key.slice('app:'.length))
    );
}

/**
 * Approve an app by its content hash: its entry is written with the real path of its folder, and
 * the `app` entries of that folder, and only those, are removed, so one approval per folder is
 * live. Answers `{ ok: true }`, or the reason the file was left as it was.
 */
export function approveApp(
    file: string,
    app: { hash: string; folder: string; label: string },
    now: Date = new Date()
): ApprovalWrite {
    const loaded = load(file);
    if (!loaded.ok) return loaded;
    const approved = withoutApp(loaded.approvals.approved, app.folder);
    approved[appKey(app.hash)] = {
        label: app.label,
        at: now.toISOString(),
        folder: app.folder
    };
    return store(file, approved);
}

/**
 * Take back the approval of the app in this folder: its `app` entries are removed and nothing else
 * is. A file that holds none is left as it is. Answers `{ ok: true }`, or the reason the file was
 * left as it was.
 */
export function revokeApp(file: string, folder: string): ApprovalWrite {
    const loaded = load(file);
    if (!loaded.ok) return loaded;
    const approved = withoutApp(loaded.approvals.approved, folder);
    if (Object.keys(approved).length === Object.keys(loaded.approvals.approved).length) {
        return { ok: true };
    }
    return store(file, approved);
}
