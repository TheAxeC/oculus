// Layer 2, client state. What a source tab holds and how it is read: the tab's state, the draft
// kept for it, the reads that fill it (a file as the disk holds it, a version at HEAD or in the
// index) and the file's own mode on this machine.
//
// Whether a file may be saved is the file's own mode, asked of the source route when the tab opens
// and held with the draft: no list of extensions decides it, so a tab over a file this machine
// locks shows it and says so, and a tab over anything else is an editor. The read is cut at the
// same limit the file route's readers use, and a draft that was cut saves nothing: writing back a
// copy that stops at two megabytes would take the rest of the file off the disk. A file read whole
// is tested as UTF-8 throughout (data/helpers/files/text-kind.ts), and a draft of a file that fails
// is drawn by the code window and saves nothing, since its decoded text is not the file on disk.
//
// A draft over a file on disk holds `base`, the hash of the bytes it last read or wrote, which a
// save sends so that the server refuses a file that is not the one the tab read, and `disk`, what
// the server's channel for the file last said of it (disk.svelte.ts).

import { z } from 'zod';
import { isWholeText } from '../../../data/helpers/files/text-kind.ts';
import { optionalTextShape, readAs, readJson } from '../../../data/shapes/shapes.ts';
import { TEXT_LIMIT } from '../../sources/fs.ts';
import { headUrl } from '../../sources/repositories/repositories.ts';
import type { HeadStage } from '../../sources/repositories/file-git.ts';
import { fileBytesUrl } from '../../sources/fs.svelte.ts';
import { digestOf, readCappedBytes } from '../../sources/fs-transport.ts';
import { refusedAnswer } from '../../shared/answers/answers.ts';
import { t } from '../../shared/words/text.ts';

/**
 * How a file indents: with tabs or with spaces, and how wide one step is. It is declared here, with
 * the draft that holds it, and the editor's text rules in state/workbench/navigation read it from
 * here.
 */
export type Indent = { tabs: boolean; size: number };

/**
 * What a read of a file answers: its text, whether the read stopped at the limit, the hash of the
 * bytes read (`base`; empty for a version at HEAD or in the index) and whether those bytes are not
 * UTF-8 text throughout, or the sentence to say and the status of a refusal (0 for none).
 */
export type SourceLoad =
    | { ok: true; content: string; truncated: boolean; base: string; notText: boolean }
    | { ok: false; error: string; status: number };
/** What the read of a library file answers: its text and language, or the sentence to say. */
export type LibraryAnswer =
    { ok: true; text: string; language: string } | { ok: false; error: string };
export type SourceTabState = {
    root: string;
    path: string;
    label: string;
    /** The line the tab scrolls to once the draft has loaded, for a tab opened at one. */
    line?: number;
    /**
     * The column of the place the tab was opened at, from one: the word there is selected once the
     * draft has loaded. A state without it, or with anything but a positive number, names none.
     */
    column?: number;
    /**
     * Where the range opened at ends: the line from one and the column from one. A place with an
     * end selects the range; a state with the column but no line, or an end before the start,
     * names none.
     */
    endLine?: number;
    endColumn?: number;
    /**
     * The number the page gave this open of the place, and the last one the editor went to. The
     * editor goes to the place when `asked` differs from `wentTo` and then writes `wentTo`, so a
     * second open of the same place goes there again and a reload does not.
     */
    asked?: number;
    wentTo?: number;
    /** False for an open that leaves the keyboard where it is, such as a press in a list. */
    focus?: boolean;
    /**
     * The library address of a tab over a library file a language server named, which has no root
     * and no path: `root` and `path` are empty and `id` is the address.
     */
    library?: string;
    /** The tab's identity, for a tab that is one of several over the same file. */
    id?: string;
    /** Which version of the file the tab holds, for a tab over the file at HEAD or in the index. */
    head?: HeadStage;
};

export type { HeadStage };

/**
 * What the server's channel last said of a file a tab holds: it is as read, it moved, or it is not
 * there.
 */
type DiskState = 'same' | 'changed' | 'gone';

export type SourceDraft = {
    text: string;
    saved: string;
    /**
     * The hex SHA-256 of the bytes the tab last read or wrote, which a save sends; empty for an
     * untitled text and for a version at HEAD or in the index.
     */
    base: string;
    /** What the file on disk is, compared with `base`, as the file's channel last said. */
    disk: DiskState;
    /**
     * Whether the last save was refused because the file is not the one the tab read, which the tab
     * answers with Compare, Overwrite and Revert.
     */
    conflict: boolean;
    loaded: boolean;
    /**
     * The page lifetime the disk was last read in; another value means the draft came from storage.
     */
    readIn?: string;
    error: string;
    message: string;
    /** Whether `message` says a save failed, which the bar draws with the cross glyph before it. */
    failed: boolean;
    /** Whether the rendered half is drawn beside the editor, for a file that has one. */
    rendered: boolean;
    /** Whether the blame of each line is drawn in the gutter, VS Code's Toggle Blame. */
    blame: boolean;
    /**
     * Whether this machine's mode on the file refuses a write, which the tab draws instead of an
     * editor.
     */
    readonly: boolean;
    /**
     * Whether the read stopped at the limit, which is the other way a tab holds no complete file.
     */
    truncated: boolean;
    /**
     * Whether the bytes of a file read whole are not UTF-8 text throughout, which the tab draws
     * with the code window and never saves over.
     */
    notText: boolean;
    /**
     * The file the draft was read for, as `root/path`, so a read that lands after the tab was
     * pointed at another file is thrown away.
     */
    file: string;
    /**
     * The language the reader chose for the tab from the status bar, by the highlighter's name,
     * or the empty string for the one the file's own name gives.
     */
    language: string;
    /**
     * The indentation the reader chose for the tab from the status bar, or null for the one the
     * file's own lines give.
     */
    indent: Indent | null;
    /**
     * The word wrap the reader set with Alt+Z for the tab, or null for the configured one. It is
     * kept as the reader set it and taken only when the options catalog's `editor.word_wrap` takes
     * it (`resolveEditor`).
     */
    wrap: string | null;
    /**
     * The first line the editor shows, from one: where a copy of the tab, or the tab in another
     * window, opens the text.
     */
    first: number;
};

/**
 * An indentation kept in storage: tabs or spaces and a whole width. Whether the width is one the
 * catalog's `editor.tab_size` takes is decided where it is used (`resolveEditor`).
 */
const indentShape = z.object({
    tabs: z.boolean(),
    size: z.int()
}) satisfies z.ZodType<Indent>;

/**
 * The fields of a draft kept in the instance's state, each as typed or at its default. A tab that
 * has never been told otherwise shows the source alone, as VS Code opens a Markdown file; the
 * rendered half is the Preview control's.
 */
const draftShape = z
    .object({
        text: z.string().catch(''),
        saved: z.string().catch(''),
        base: z.string().catch(''),
        disk: z.enum(['same', 'changed', 'gone']).catch('same'),
        conflict: z.boolean().catch(false),
        loaded: z.boolean().catch(false),
        readIn: optionalTextShape,
        error: z.string().catch(''),
        message: z.string().catch(''),
        failed: z.boolean().catch(false),
        rendered: z.boolean().catch(false),
        blame: z.boolean().catch(false),
        readonly: z.boolean().catch(false),
        truncated: z.boolean().catch(false),
        notText: z.boolean().catch(false),
        file: z.string().catch(''),
        language: z.string().catch(''),
        indent: indentShape.nullable().catch(null),
        wrap: z.string().nullable().catch(null),
        first: z.int().min(1).catch(1)
        // A draft always carries `readIn`, with undefined when the state names none.
    })
    .transform((draft) => ({ readIn: undefined, ...draft })) satisfies z.ZodType<SourceDraft>;

/**
 * The draft an instance's state holds: state that is no map holds none, so every field is at its
 * default.
 */
export function draftOf(state: unknown): SourceDraft {
    return draftShape.safeParse(state).data ?? draftShape.parse({});
}

/** Whether the file's own facts say its mode refuses a write. */
const modeShape = z.object({ readonly: z.boolean().catch(false) });

/** The `head` of a tab's state: one of the two stages, or absent. */
const headShape = z.object({ head: z.enum(['head', 'index']).optional().catch(undefined) });

/** What the head read of the git route answers: the text, a file the stage lacks, or a blob. */
const headAnswerShape = z.object({
    ok: z.boolean().catch(false),
    text: z.string().optional().catch(undefined),
    missing: z.boolean().optional().catch(undefined),
    binary: z.boolean().optional().catch(undefined)
});

/** What the `file` of a draft over a library file starts with. */
export const LIBRARY_FILE = 'library:';

/** One token per page lifetime: a draft carrying it was read from disk since the page loaded. */
export const LIFETIME = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;

/**
 * The state that identifies one source tab and labels it with the file name. A caller that knows
 * which line the reader was sent to names it, and the tab scrolls there once its draft has loaded;
 * one that knows the column names it too, and the tab selects the word there.
 */
export function sourceTabState(
    root: string,
    path: string,
    line?: number,
    column?: number,
    more?: PlaceMore
): SourceTabState {
    const state: SourceTabState = {
        root,
        path,
        label: path.split('/').filter(Boolean).at(-1) ?? path
    };
    return placed(state, line, column, more);
}

/**
 * The state of a tab over a library file: the address names it, so a second go to definition into
 * the same file activates the tab that holds it, and the file's own name is the label.
 */
export function libraryTabState(
    address: string,
    name: string,
    line?: number,
    column?: number,
    more?: PlaceMore
): SourceTabState {
    return placed(
        { root: '', path: '', label: name, id: address, library: address },
        line,
        column,
        more
    );
}

/** What a place adds to its line and column: where its range ends, the ask and the keyboard. */
export type PlaceMore = Pick<SourceTabState, 'endLine' | 'endColumn' | 'asked' | 'focus'>;

/**
 * Whether a range's end lies before its start: on an earlier line, or on the start's line at an
 * earlier column. A place whose end does so has no end, in a state written and in a state read.
 */
export function endsBeforeStart(
    start: { line: number; column: number },
    end: { line: number; column: number }
): boolean {
    return end.line < start.line || (end.line === start.line && end.column < start.column);
}

/**
 * A state opened at a line and, when the line is named, at a column of it, the end of its range,
 * the ask that made it and whether the keyboard goes to the editor. Each key is written only when
 * it is named, none is written without a line, and an end before the start is not written.
 */
function placed(
    state: SourceTabState,
    line?: number,
    column?: number,
    more: PlaceMore = {}
): SourceTabState {
    if (line === undefined) return state;
    const { endLine, endColumn, ...rest } = more;
    const reversed =
        endLine !== undefined &&
        endsBeforeStart({ line, column: column ?? 0 }, { line: endLine, column: endColumn ?? 0 });
    const named = Object.entries({
        line,
        column,
        ...rest,
        ...(reversed ? {} : { endLine, endColumn })
    }).filter(([, value]) => value !== undefined);
    return { ...state, ...Object.fromEntries(named) };
}

/** The version a tab's state names, or undefined for a tab over the file on disk. */
export function headOf(state: unknown): HeadStage | undefined {
    return readAs(headShape, state)?.head;
}

/** The api/source address the file's own facts are read at. */
export function sourceInfoUrl(root: string, path: string): string {
    return `/api/source?root=${encodeURIComponent(root)}&path=${encodeURIComponent(path)}`;
}

/**
 * Read one file's text from the existing file route, cut at the limit every reader of it uses. The
 * route lets a browser keep an answer for a minute, so the read asks the server each time: a text
 * a write is based on, or a tab shows after a change, is the file's text now.
 */
export async function loadSource(root: string, path: string): Promise<SourceLoad> {
    try {
        const response = await fetch(fileBytesUrl(root, path), { cache: 'no-cache' });
        if (!response.ok) {
            return { ok: false, error: refusedAnswer(response.status), status: response.status };
        }
        const held = await readCappedBytes(response, TEXT_LIMIT);
        return {
            ok: true,
            content: new TextDecoder().decode(held.bytes),
            truncated: held.truncated,
            base: await digestOf(held.bytes),
            notText: !held.truncated && !isWholeText(held.bytes)
        };
    } catch (error) {
        return failure(error instanceof Error ? error.message : String(error));
    }
}

/** A read that got no text and no refusal of the server's: the sentence says why. */
function failure(error: string): SourceLoad {
    return { ok: false, error, status: 0 };
}

/** Read a tracked file as HEAD or the index holds it, from the git route's head read. */
export async function loadHeadFile(
    root: string,
    path: string,
    stage: HeadStage
): Promise<SourceLoad> {
    try {
        const response = await fetch(headUrl(root, path, stage));
        const answer = readAs(headAnswerShape, await readJson(response));
        if (!response.ok || !answer?.ok) {
            return {
                ok: false,
                error: `HTTP ${String(response.status)}`,
                status: response.status
            };
        }
        if (answer.missing === true) return failure(t('source.head_missing'));
        if (answer.binary === true) return failure(t('source.head_binary'));
        return { ok: true, content: answer.text ?? '', truncated: false, base: '', notText: false };
    } catch (error) {
        return failure(error instanceof Error ? error.message : String(error));
    }
}

/**
 * Whether the file is locked by its mode on this machine. A request that fails answers false: the
 * save is what refuses a file that cannot be written, and an editor nobody could open over a
 * hiccup in one request would be worse than one whose save says so.
 */
export async function loadSourceReadonly(root: string, path: string): Promise<boolean> {
    try {
        const response = await fetch(sourceInfoUrl(root, path));
        if (!response.ok) return false;
        return readAs(modeShape, await readJson(response))?.readonly ?? false;
    } catch {
        return false;
    }
}

/** The prefixes of the `file` of a draft that is not a file on disk. */
const NOT_ON_DISK = ['head:', 'index:', 'untitled:', LIBRARY_FILE];

/**
 * The root and the path of the file on disk a draft holds, or null for a draft of a version at HEAD
 * or in the index, an untitled text, a library file, or one not read yet.
 */
export function diskFileOf(file: string): { root: string; path: string } | null {
    if (NOT_ON_DISK.some((prefix) => file.startsWith(prefix))) return null;
    const at = file.indexOf('/');
    return at <= 0 || at === file.length - 1
        ? null
        : { root: file.slice(0, at), path: file.slice(at + 1) };
}
