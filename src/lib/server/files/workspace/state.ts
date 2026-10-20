// Layer 2, server. The machine state of the workspace: which workspace file is open, the files
// opened lately, and the folders of the unsaved workspace, in `workspace.json` of the state folder
// (`~/.oculus`). Oculus alone writes it. A state that is missing, does not parse or is not this
// shape reads as an unsaved workspace with no folders; a state that is there and does not parse is
// never written over, so a write onto it is refused with the reason.
//
// The state folder is a dependency of the server context, so a test points it at a scratch folder
// and the file of the person running the test is never read or written.

import { homedir } from 'node:os';
import { join } from 'node:path';
import { z } from 'zod';
import { readJsonChecked, writeJsonAtomic } from '../../core/json.ts';

/** How many files the recent list keeps. */
const RECENT_KEPT = 10;

/** The name of the state file inside the state folder. */
const STATE_NAME = 'workspace.json';

/** One folder of the unsaved workspace, as the state holds it: the name and the path as written. */
export type StateFolder = { name: string; path: string };

/** The state file's content. */
export type WorkspaceState = {
    /** The absolute path of the open workspace file, or null while the workspace is unsaved. */
    open: string | null;
    /** The absolute paths of the workspace files opened lately, the latest first. */
    recent: string[];
    /** The unsaved workspace: its folders and the name of its primary. */
    unsaved: { folders: StateFolder[]; primary?: string };
};

/** The folder the state lives in, `~/.oculus`, resolved at the call. */
export function defaultStateFolder(): string {
    return join(homedir(), '.oculus');
}

/** The state file of a state folder. */
export function stateFileOf(folder: string): string {
    return join(folder, STATE_NAME);
}

/** The state that nothing is saved reads as. A fresh object each call, since a write changes it. */
function emptyState(): WorkspaceState {
    return { open: null, recent: [], unsaved: { folders: [] } };
}

const folderShape = z.object({ name: z.string(), path: z.string() });

const stateShape = z.object({
    open: z.string().nullable().catch(null),
    recent: z.array(z.string()).catch(() => []),
    unsaved: z
        .object({
            folders: z.array(z.unknown()).catch(() => []),
            primary: z.string().optional().catch(undefined)
        })
        .catch(() => ({ folders: [], primary: undefined }))
});

/** The state a parsed value holds, or null when it is not a map. */
function foldState(raw: unknown): WorkspaceState | null {
    if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) return null;
    const read = stateShape.parse(raw);
    const folders = read.unsaved.folders.flatMap((one) => {
        const parsed = folderShape.safeParse(one);
        return parsed.success ? [parsed.data] : [];
    });
    const state: WorkspaceState = {
        open: read.open,
        recent: read.recent,
        unsaved: { folders }
    };
    if (read.unsaved.primary !== undefined) state.unsaved.primary = read.unsaved.primary;
    return state;
}

/** What a read of the state answers: the state, and why the file that is there does not read. */
export type StateRead = { state: WorkspaceState; unreadable: string | null };

/**
 * The state of a state folder. A file that is not there is the empty state; one that does not read
 * is the empty state and the reason, which a write refuses with.
 */
export function readState(folder: string): StateRead {
    const file = stateFileOf(folder);
    const read = readJsonChecked(file);
    if (!read.ok) {
        return { state: emptyState(), unreadable: file };
    }
    if (read.value === undefined) return { state: emptyState(), unreadable: null };
    const state = foldState(read.value);
    if (state === null) {
        return { state: emptyState(), unreadable: file };
    }
    return { state, unreadable: null };
}

/** Write the state whole and atomically. Throws when the file cannot be written. */
export function writeState(folder: string, state: WorkspaceState): void {
    const { open, recent, unsaved } = state;
    writeJsonAtomic(stateFileOf(folder), {
        open,
        recent: recent.slice(0, RECENT_KEPT),
        unsaved: {
            folders: unsaved.folders,
            ...(unsaved.primary === undefined ? {} : { primary: unsaved.primary })
        }
    });
}

/** The recent list with `file` first, once, and the list cut to what is kept. */
export function withRecent(recent: readonly string[], file: string): string[] {
    return [file, ...recent.filter((one) => one !== file)].slice(0, RECENT_KEPT);
}
