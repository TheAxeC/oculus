// Layer 2, client state, pure. What one file browser keeps about itself across a tab switch and a
// saved page: the record in the instance's own state, the shape every field of it is read through
// so a state from any source draws, and the functions that write part of it.
//
// A field a saved record lacks or holds wrongly is read as its default, so an old record opens as a
// browser with nothing selected and the sections as they start. The record is the one statement of
// what the view shows, which is what makes a tree left half open the same tree after a reload.

import { z } from 'zod';
import { fieldItemsShape, readAs } from '../../../../data/shapes/shapes.ts';
import { isMap } from '../../../../data/helpers/guards.ts';
import type { Naming } from '../naming.ts';
import { isLineForm, type FilesForms } from './forms.ts';
import type { ListingShown, RowRef } from './place.ts';

/** The view id of the file browser, whose instance records are the ones holding FilesForms. */
export const FILES_VIEW = 'files';

/**
 * One ask to show a path: the row asked for, which ask it is, whether the folder asked for is to
 * be shown open (`open`), whether the Timeline section is to be opened and scrolled to instead of
 * the row (`timeline`), and whether the view has read the folders on its way and selected what it
 * found (`settled`), which leaves only the scroll to it.
 */
export type RevealAsk = RowRef & {
    asked: number;
    settled: boolean;
    /** Set when the row asked for is a folder to be shown open as well as selected. */
    open?: true;
    /**
     * Set when the ask is for the file's history: the Timeline section opens and is scrolled to.
     */
    timeline?: true;
};

/**
 * What one ask came to: the path was found, it is not on the disk (the nearest folder on its way is
 * shown), a folder on its way could not be read (the last one read is shown, with the reason), the
 * workspace in force has no such root, or the roots of the workspace could not be read at all (with
 * the reason); in the last two nothing is shown.
 */
export type RevealOutcome = {
    kind: 'found' | 'missing' | 'unread' | 'no-root' | 'no-roots';
    asked: RowRef;
    shown: RowRef | null;
    error: string;
};

/**
 * What one file browser keeps about itself: the open folders, the cursor row (`selected`), the rows
 * selected with it (`selection`, empty while only the cursor row is selected) and the row a range
 * grows from (`anchor`), the filter text and whether it matches fuzzily, the sections under the
 * tree that are closed (`collapsed`) and the ones that start closed and the reader opened
 * (`opened`), its open form with what was typed into a line form, the refusal and outcome lines
 * that answered its last press, which come back with the form they answered, its toggles (hidden
 * files, the files git ignores, nested files), the folder a rooted tab is drawn from (`top`) and
 * the folder Open Folder found outside every root (`outside`), and the Timeline's pin and the two
 * lists it shows (`timelinePinned`, `timelineGit`, `timelineLocal`), and the order its sections are
 * drawn in (`sections`, every section's id once, the ones not drawn included). A bookmark form's
 * typed values are not here: they are the form drafts of state/forms/form-drafts.svelte.ts, kept
 * beside this record as every entry form's are.
 */
export type FilesView = FilesForms &
    ListingShown & {
        expanded: string[];
        selected: RowRef | null;
        selection: RowRef[];
        anchor: RowRef | null;
        filter: string;
        fuzzy: boolean;
        nesting: boolean;
        collapsed: string[];
        opened: string[];
        /**
         * The path another view asked this browser to show, until it is selected and scrolled to.
         */
        reveal: RevealAsk | null;
        /** What the last ask came to when it did not find its path, for the view's outcome line. */
        revealed: RevealOutcome | null;
        /**
         * How many times this browser has been asked to show a path, which tells one ask from the
         * next.
         */
        revealing: number;
        /**
         * What the last press was refused with, in the reader's words, and the empty string for
         * none.
         */
        note: string;
        /** What the bookmark form's last write answered, which is a report and not a refusal. */
        said: string;
        /** The name being typed for a new file or folder, or a renamed row; null for none. */
        naming: Naming | null;
        /** The folder a rooted tab is drawn from, or null for a tab that draws the workspace. */
        top: RowRef | null;
        /** The folder Open Folder found outside every root, or the empty string. */
        outside: string;
        /** The file the Timeline section is held on, or null while it follows the editor. */
        timelinePinned: RowRef | null;
        /** Whether the Timeline lists the commits that touched its file. */
        timelineGit: boolean;
        /** Whether the Timeline lists the copies of its file in the local history. */
        timelineLocal: boolean;
        /**
         * The order the sections are drawn in: every id of SECTION_ORDER once. A section that is
         * not drawn keeps its place here.
         */
        sections: string[];
    };

/** The sections of the view in the order a fresh Files tab draws them. */
const SECTION_ORDER: readonly string[] = [
    'editors',
    'files',
    'outline',
    'ast',
    'memory',
    'timeline',
    'bookmarks',
    'notes'
];

/**
 * The order a saved record names, read as a whole one: the ids it holds that are sections, each
 * once at its first place, then every section it lacks in the default order. A record that is no
 * list reads as the default order.
 */
function sectionsOf(held: string[]): string[] {
    const known = held.filter((id, at) => SECTION_ORDER.includes(id) && held.indexOf(id) === at);
    return [...known, ...SECTION_ORDER.filter((id) => !known.includes(id))];
}

/** A count a saved record holds, and 0 for anything that is not a whole number from 0 up. */
const countShape = z.number().int().min(0).catch(0);

/** A row a saved record names: a root key and a path. */
const refShape = z.object({ root: z.string(), path: z.string() }) satisfies z.ZodType<RowRef>;

/** The ask a saved record holds: a named root, a path, which ask it is and if it is settled. */
const askShape = z.object({
    root: z.string().min(1),
    path: z.string(),
    asked: z.number().int().min(1),
    settled: z.boolean(),
    open: z.literal(true).optional().catch(undefined),
    timeline: z.literal(true).optional().catch(undefined)
}) satisfies z.ZodType<RevealAsk>;

/** The outcome a saved record holds: a kind, the row asked, the row shown and the reason. */
const outcomeShape = z.object({
    kind: z.enum(['found', 'missing', 'unread', 'no-root', 'no-roots']),
    asked: refShape,
    shown: refShape.nullable().catch(null),
    error: z.string().catch('')
}) satisfies z.ZodType<RevealOutcome>;

/** A row a saved record names, which names a root. */
const selectedShape = z.object({ root: z.string().min(1), path: z.string() });

/** The rows a saved record holds as selected, a row that names no root left out. */
const selectionShape = z
    .array(z.unknown())
    .catch([])
    .transform((held) =>
        held.flatMap((one) => {
            const row = selectedShape.safeParse(one);
            return row.success ? [{ root: row.data.root, path: row.data.path }] : [];
        })
    );

/** The open form a saved record names, and no form for a name that is none of the three. */
const formShape = z.enum(['', 'root', 'workspace', 'bookmark']).catch('');

/** The pending name a saved record holds: a kind, a named root and a path. */
const namingShape = z.object({
    mode: z.enum(['file', 'folder', 'deck', 'rename']),
    root: z.string().min(1),
    path: z.string()
}) satisfies z.ZodType<Naming>;

/** A file browser's instance state with every field defaulted, so a state from any source draws. */
const filesViewShape = z
    .object({
        expanded: fieldItemsShape,
        selected: selectedShape.nullable().catch(null),
        filter: z.string().catch(''),
        collapsed: fieldItemsShape,
        form: formShape,
        editing: z.string().catch(''),
        typed: z.string().catch(''),
        opening: countShape,
        reveal: askShape.nullable().catch(null),
        revealed: outcomeShape.nullable().catch(null),
        revealing: countShape,
        note: z.string().catch(''),
        said: z.string().catch(''),
        naming: namingShape.nullable().catch(null),
        hidden: z.boolean().catch(false),
        ignored: z.boolean().catch(false),
        selection: selectionShape,
        anchor: selectedShape.nullable().catch(null),
        fuzzy: z.boolean().catch(false),
        nesting: z.boolean().catch(false),
        opened: fieldItemsShape,
        top: selectedShape.nullable().catch(null),
        outside: z.string().catch(''),
        timelinePinned: selectedShape.nullable().catch(null),
        timelineGit: z.boolean().catch(true),
        timelineLocal: z.boolean().catch(true),
        sections: fieldItemsShape
    })
    .transform((held): FilesView => ({
        ...held,
        sections: sectionsOf(held.sections),
        editing: held.form === 'bookmark' ? held.editing : '',
        typed: isLineForm(held.form) ? held.typed : '',
        // A rename names the row it renames, so a rename of no path is none.
        naming: held.naming?.mode === 'rename' && held.naming.path === '' ? null : held.naming
    }));

/** The file browser's instance state, every field defaulted, so a state from any source draws. */
export function filesViewOf(state: unknown): FilesView {
    return readAs(filesViewShape, state) ?? emptyFilesView();
}

/** A file browser with nothing open, selected or typed. */
function emptyFilesView(): FilesView {
    return {
        expanded: [],
        selected: null,
        filter: '',
        collapsed: [],
        form: '',
        editing: '',
        typed: '',
        opening: 0,
        reveal: null,
        revealed: null,
        revealing: 0,
        note: '',
        said: '',
        naming: null,
        hidden: false,
        ignored: false,
        selection: [],
        anchor: null,
        fuzzy: false,
        nesting: false,
        opened: [],
        top: null,
        outside: '',
        timelinePinned: null,
        timelineGit: true,
        timelineLocal: true,
        sections: [...SECTION_ORDER]
    };
}

/** The two toggles of one file browser, which is what each of its listings is asked with. */
export function shownOf(view: ListingShown): ListingShown {
    return { hidden: view.hidden, ignored: view.ignored };
}

/**
 * One instance's record with part of a file browser's own state written over it, keeping whatever
 * else the record holds. What the ui store has under an id is whatever was saved there, which may
 * be anything at all, so a record that is not a map is read as an empty one.
 */
export function patchedFilesView(kept: unknown, part: Partial<FilesView>): Record<string, unknown> {
    return { ...(isMap(kept) ? kept : {}), ...part };
}

/**
 * Whether one instance holds a root or workspace line no save has taken: a file browser whose line
 * form is open with text in it other than spaces, which the add would take as nothing. The view is
 * checked first, since another view's record may hold keys of the same names.
 */
export function filesLineTyped(view: string | undefined, state: unknown): boolean {
    return view === FILES_VIEW && filesViewOf(state).typed.trim() !== '';
}
