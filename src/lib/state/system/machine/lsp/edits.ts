// Layer 2, client state. The functions that make the edit a language server asks for: a
// `workspace/applyEdit` request, the edit of a code action and the answer to a rename all come to
// `apply`, with the workspace edit as the relay gave it (the page's addresses of each file).
// `apply` is two steps that a Refactor Preview runs apart: `plan` makes every check and reads what
// the edit needs, `commit` makes the edit the plan describes.
//
// A file a tab of this page holds, whatever its language or whether a server serves it, is edited
// in the tab: the text of its draft is changed, unsaved, which the editor shows as one undo stop in
// every tab of the file. A tab holds a file when the file is the one the tab shows on disk,
// whatever root key either is named under (data/helpers/hub-names.ts decides it from the served
// roots). Every other file is written to disk by one `lsp-edit` operation
// (server/files/fs/lsp-edit.ts), posted before any tab is touched, so a refusal leaves nothing
// applied. The text edits are applied with data/prose/text-edits.ts, which the server applies the
// same way.
//
// The edits were computed against the text the asking server holds of a file (`held`, the text of
// each document held by the clients of every language the server's entry serves). A tab of such a
// file is edited when its draft is that text, and refused when it is not (a second tab of the file
// with other text). A tab of a file the server holds no document of (a tab not mounted since a
// reload, a tab no server serves) is edited only when its draft is the file on disk, which is the
// text the server read.
//
// The plan refuses the whole edit, with the notice that names the file, when
// - a file is a library file, outside the served roots, under a `node_modules` or dot folder, or in
//   the `secrets` folder of every hub or `~/.oculus`,
// - the roots are not read yet and a source tab is open, so no tab can be told from a file,
// - an entry creates, renames or deletes a file, or one file is named twice,
// - a file it names is open in a tab of another page (asked of the relay), whether or not a tab of
//   this page holds it too,
// - a tab's text no longer matches the positions of its edits, or the tab is read-only,
// - a tab's text is not the text the server computed the edit on,
// - a file that no tab holds cannot be read, is larger than the write limit or is not UTF-8 text
//   throughout, or its text no longer matches the positions of its edits, or
// - the edit is the rename of a hub key (it carries the change annotation of that rename) and a
//   file does not hold the old key at an edited place.
//
// The commit reads the tabs again and refuses when a planned tab was closed, is read-only or no
// longer holds the text it was planned on, or when a tab now holds a file the plan posts. It
// refuses when a tab's draft changed while the files were posted (after, the files stay written,
// History undoes them, and the tabs are left as typed), and when the server refuses what it was
// asked to write. The hash an `lsp-edit` file carries is that of the bytes the plan read, which the
// server checks again as it writes, so a file that moved since the plan is refused by the server.

import { WRITE_MAX_MEGABYTES, type LspEditFile } from '../../../../data/file-ops.ts';
import { diskRelation, sameDiskFile, type RootFolder } from '../../../../data/helpers/hub-names.ts';
import type { LspPlace } from '../../../../data/model/index.ts';
import { libraryOf, placeOf } from '../../../../data/prose/lsp-addresses.ts';
import {
    RENAME_ANNOTATION,
    applyTextEdits,
    type LspEditNotice,
    type TextEdit
} from '../../../../data/prose/text-edits.ts';
import { holdsKey } from '../../../../data/helpers/files/yaml/collection-text.ts';
import type { Outcome } from '../../../sources/explorer/ops.svelte.ts';

/** How an edit ended: made, or refused with the notice that says why and the words it uses. */
export type LspEditOutcome =
    { applied: true } | { applied: false; notice: LspEditNotice; words: string[] };

/** A file as the page reads it: its text and the SHA-256 of the bytes the text was decoded from. */
type ReadFile = { text: string; hash: string };

/** Why the page could not read a file whole: it is over the write limit, or not UTF-8 text. */
type Unreadable = 'too_large' | 'not_text';

/** What the edits read of the page. */
export type LspEditsParts = {
    /** Every open tab: its id and its view. */
    tabs: () => { id: string; view: string }[];
    /** The source tabs' drafts: the file as `root/path`, the text, and whether it may be edited. */
    draft: (id: string) => {
        file: string;
        text: string;
        saved: string;
        loaded: boolean;
        readonly: boolean;
    };
    /** Replace a draft's text. */
    edit: (id: string, text: string, edits: TextEdit[]) => void;
    /**
     * A file as the disk holds it now, up to the most a write may carry: null when it cannot be
     * read, else the text and hash, or why the page cannot have the file whole.
     */
    read: (root: string, path: string) => Promise<ReadFile | Unreadable | null>;
    /** Which of some files another page holds open in a tab; null when it was not answered. */
    askHeld: (files: LspPlace[]) => Promise<LspPlace[] | null>;
    /** Tell the relay which files this page's tabs hold. */
    publishTabs: (files: LspPlace[]) => void;
    /** Post an `lsp-edit` of files no tab holds. */
    write: (files: LspEditFile[]) => Promise<Outcome>;
    /** The roots the file browser serves, which decide whether two names are one file on disk. */
    roots: () => readonly RootFolder[];
    /**
     * Whether a file is in a folder no edit is made in: the `secrets` folder of every hub and
     * `~/.oculus`.
     */
    withheld: (place: LspPlace) => boolean;
};

/** One file of a planned edit. */
export type PlannedFile = {
    place: LspPlace;
    /** The file as `root/path`. */
    name: string;
    /** The text the edits apply to: the draft of the tabs that hold the file, else the disk's. */
    text: string;
    /** The edits in the order given. */
    edits: TextEdit[];
    /** The SHA-256 of the bytes the text was read from; empty for a file a tab holds. */
    hash: string;
    /** The tabs that hold the file, each with the draft text its edits were planned on. */
    tabs: { id: string; from: string }[];
};

/** The edit a plan describes: the checks passed and the texts read. */
export type EditPlan = {
    /** The key a rename changes and the key it becomes, for the rename of a hub key. */
    rename: { from: string; to: string } | null;
    /** Whether the edit asks to be confirmed before it is made (a change annotation says so). */
    confirm: boolean;
    files: PlannedFile[];
};

/** A plan, or the refusal that stopped it. */
type Planned = { ok: true; plan: EditPlan } | { ok: false; outcome: LspEditOutcome };

/** Whether the edit at an index of a file is made. */
type Keep = (name: string, index: number) => boolean;

export type LspEdits = {
    /**
     * Make an edit; `held` is the text the asking server holds of each document, by the page's
     * address of the file, over every language its entry serves.
     */
    apply: (edit: unknown, held?: ReadonlyMap<string, string>) => Promise<LspEditOutcome>;
    /** Make every check of `apply` and read what the edit needs, and make nothing. */
    plan: (edit: unknown, held?: ReadonlyMap<string, string>) => Promise<Planned>;
    /** Make the edit a plan describes, the edits `keep` chooses only (all by default). */
    commit: (plan: EditPlan, keep?: Keep) => Promise<LspEditOutcome>;
    /** Tell the relay the files the tabs hold now; called whenever the tabs change. */
    publish: () => void;
};

/** One file of an edit: where it is and the edits made in it, in the order given. */
type Named = { place: LspPlace; name: string; address: string; edits: TextEdit[] };

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}

const refuse = (notice: LspEditNotice, ...words: string[]): LspEditOutcome => ({
    applied: false,
    notice,
    words
});

/** A text with its line ends as `\n`, which is how a draft and a model compare. */
function lf(text: string): string {
    return text.replace(/\r\n/g, '\n');
}

/** The name a file is told to a reader by. */
function nameOf(place: LspPlace): string {
    return `${place.root}/${place.path}`;
}

/** The root and path of a tab's `root/path` name. */
function placeOfName(name: string): LspPlace {
    const at = name.indexOf('/');
    return { root: name.slice(0, at), path: name.slice(at + 1) };
}

/** Whether an edit is never made in a file: under a `node_modules` folder or a dot folder. */
function inLibraryFolder(path: string): boolean {
    return path
        .split('/')
        .slice(0, -1)
        .some((part) => part === 'node_modules' || part.startsWith('.') || part === '..');
}

/**
 * The files a workspace edit names with the edits of each, or the refusal: an entry that creates,
 * renames or deletes a file, an address that is a library file or is no file of the page, or a
 * file `withheld` names.
 */
function namedBy(edit: unknown, withheld: LspEditsParts['withheld']): Named[] | LspEditOutcome {
    if (!isRecord(edit)) return refuse('lsp_edit_empty');
    const files = new Map<string, Named>();
    const add = (address: string, edits: unknown): LspEditOutcome | null => {
        if (libraryOf(address) !== null)
            return refuse('lsp_edit_library', libraryOf(address)?.name ?? '');
        const place = placeOf(address);
        if (place === null || inLibraryFolder(place.path) || withheld(place))
            return refuse('lsp_edit_outside', address);
        const key = nameOf(place);
        // A file named twice is refused as the server refuses it, so the answer does not depend on
        // which of the two entries was meant.
        if (files.has(key)) return refuse('lsp_edit_failed', key);
        files.set(key, {
            place,
            name: key,
            address,
            edits: Array.isArray(edits) ? (edits as TextEdit[]) : []
        });
        return null;
    };
    if (isRecord(edit.changes)) {
        for (const [address, edits] of Object.entries(edit.changes)) {
            const refused = add(address, edits);
            if (refused !== null) return refused;
        }
    }
    if (Array.isArray(edit.documentChanges)) {
        for (const change of edit.documentChanges as unknown[]) {
            const document = isRecord(change) ? change.textDocument : null;
            if (!isRecord(change) || !isRecord(document) || typeof document.uri !== 'string') {
                const target = isRecord(change) ? (change.uri ?? change.oldUri) : null;
                return refuse('lsp_edit_structure', typeof target === 'string' ? target : '');
            }
            const refused = add(document.uri, change.edits);
            if (refused !== null) return refused;
        }
    }
    return files.size === 0 ? refuse('lsp_edit_empty') : [...files.values()];
}

/** The change annotations of an edit, by id. */
function annotationsOf(edit: unknown): Record<string, unknown> {
    const held = isRecord(edit) ? edit.changeAnnotations : null;
    return isRecord(held) ? held : {};
}

/** The key a rename of a hub key changes and what it becomes, from its change annotation. */
function renameOf(edit: unknown): EditPlan['rename'] {
    const one = annotationsOf(edit)[RENAME_ANNOTATION];
    if (!isRecord(one) || typeof one.label !== 'string') return null;
    return { from: one.label, to: typeof one.description === 'string' ? one.description : '' };
}

/** Whether an edit has a change annotation that asks to be confirmed before it is made. */
function confirms(edit: unknown): boolean {
    return Object.values(annotationsOf(edit)).some(
        (one) => isRecord(one) && one.needsConfirmation === true
    );
}

/** The notice for a refusal of the server's `lsp-edit`. */
function refusedWrite(outcome: Extract<Outcome, { ok: false }>, first: string): LspEditOutcome {
    const name = outcome.failed ?? first;
    const done = outcome.done?.length ?? 0;
    if (done === 1) return refuse('lsp_edit_partial_one', name);
    if (done > 0) return refuse('lsp_edit_partial', name, String(done));
    if (outcome.error === 'outside') return refuse('lsp_edit_outside', name);
    if (outcome.error === 'changed') return refuse('lsp_edit_changed', name);
    return refuse('lsp_edit_failed', name);
}

export function createLspEdits(parts: LspEditsParts): LspEdits {
    /** The source tabs of the page with the file each shows. */
    function sourceTabs(): { id: string; file: string }[] {
        return parts
            .tabs()
            .filter((tab) => tab.view === 'source')
            .map((tab) => ({ id: tab.id, file: parts.draft(tab.id).file }))
            .filter((tab) => tab.file !== '');
    }

    /** The tabs that show a file, whatever root key the tab and the edit name it under. */
    function holding(place: LspPlace): { id: string; file: string }[] {
        const roots = parts.roots();
        return sourceTabs().filter((tab) => sameDiskFile(placeOfName(tab.file), place, roots));
    }

    async function plan(
        edit: unknown,
        held: ReadonlyMap<string, string> = new Map()
    ): Promise<Planned> {
        const stop = (outcome: LspEditOutcome): Planned => ({ ok: false, outcome });
        const named = namedBy(edit, parts.withheld);
        if (!Array.isArray(named)) return stop(named);
        // With the roots unread no tab can be told from the file: nothing is written until they
        // are.
        const roots = parts.roots();
        const unknown = named.find((one) =>
            sourceTabs().some(
                (tab) => diskRelation(placeOfName(tab.file), one.place, roots) === 'unread'
            )
        );
        if (unknown !== undefined) return stop(refuse('lsp_edit_loading', unknown.name));
        // The edits of every tab are computed first, so a text the edit no longer fits refuses all.
        const files: PlannedFile[] = named.map((one) => ({
            place: one.place,
            name: one.name,
            text: '',
            edits: one.edits,
            hash: '',
            tabs: holding(one.place).map((tab) => ({ id: tab.id, from: '' }))
        }));
        for (const file of files) {
            for (const tab of file.tabs) {
                const draft = parts.draft(tab.id);
                if (!draft.loaded || draft.readonly)
                    return stop(refuse('lsp_edit_readonly', file.name));
                if (!applyTextEdits(draft.text, file.edits).ok) {
                    return stop(refuse('lsp_edit_changed', file.name));
                }
                tab.from = draft.text;
                file.text = draft.text;
            }
        }
        const elsewhere = await parts.askHeld(named.map((one) => one.place));
        if (elsewhere === null) return stop(refuse('lsp_edit_failed', named[0].name));
        if (elsewhere.length > 0) return stop(refuse('lsp_edit_elsewhere', nameOf(elsewhere[0])));
        // The edit's positions are those of the text the server holds, or of the file on disk when
        // it holds none, so a tab is edited only when its draft is that text.
        const served = new Map(
            [...held].flatMap(([address, text]) => {
                const place = placeOf(address);
                return place === null ? [] : [[nameOf(place), lf(text)] as const];
            })
        );
        for (const file of files) {
            const text = served.get(file.name);
            for (const tab of file.tabs) {
                if (text !== undefined) {
                    if (text !== lf(tab.from)) return stop(refuse('lsp_edit_changed', file.name));
                    continue;
                }
                // The server holds no document of it, so the edit's positions are the disk's.
                const draft = parts.draft(tab.id);
                const disk = await parts.read(file.place.root, file.place.path);
                const onDisk = typeof disk === 'object' ? disk?.text : undefined;
                if (draft.text !== draft.saved || onDisk !== draft.saved) {
                    return stop(refuse('lsp_edit_changed', file.name));
                }
            }
            if (file.tabs.length > 0) continue;
            // A file no tab holds is read once: the text and the hash are of the same bytes.
            const read = await parts.read(file.place.root, file.place.path);
            if (read === 'too_large') {
                return stop(refuse('lsp_edit_too_large', file.name, String(WRITE_MAX_MEGABYTES)));
            }
            if (read === 'not_text') return stop(refuse('lsp_edit_not_text', file.name));
            if (read === null) return stop(refuse('lsp_edit_failed', file.name));
            if (!applyTextEdits(read.text, file.edits).ok) {
                return stop(refuse('lsp_edit_changed', file.name));
            }
            file.text = read.text;
            file.hash = read.hash;
        }
        const rename = renameOf(edit);
        if (rename !== null) {
            for (const file of files) {
                if (!file.edits.every((one) => holdsKey(file.text, one.range, rename.from))) {
                    return stop(refuse('lsp_edit_changed', file.name));
                }
            }
        }
        const moved = files
            .flatMap((file) => file.tabs.map((tab) => ({ file, tab })))
            .find(({ tab }) => parts.draft(tab.id).text !== tab.from);
        if (moved !== undefined) return stop(refuse('lsp_edit_changed', moved.file.name));
        return { ok: true, plan: { rename, confirm: confirms(edit), files } };
    }

    async function commit(planned: EditPlan, keep?: Keep): Promise<LspEditOutcome> {
        const chosen = planned.files
            .map((file) => ({
                ...file,
                edits:
                    keep === undefined
                        ? file.edits
                        : file.edits.filter((_, at) => keep(file.name, at))
            }))
            .filter((file) => file.edits.length > 0);
        const open = sourceTabs();
        const texts: { id: string; name: string; from: string; text: string; edits: TextEdit[] }[] =
            [];
        for (const file of chosen) {
            for (const tab of file.tabs) {
                if (!open.some((one) => one.id === tab.id)) return refuse('lsp_edit_gone');
                const draft = parts.draft(tab.id);
                if (!draft.loaded || draft.readonly) return refuse('lsp_edit_readonly', file.name);
                if (draft.text !== tab.from) return refuse('lsp_edit_changed', file.name);
                const made = applyTextEdits(draft.text, file.edits);
                if (!made.ok) return refuse('lsp_edit_changed', file.name);
                texts.push({
                    id: tab.id,
                    name: file.name,
                    from: tab.from,
                    text: made.text,
                    edits: file.edits
                });
            }
        }
        const onDisk = chosen.filter((file) => file.tabs.length === 0);
        const opened = onDisk.find((file) => holding(file.place).length > 0);
        if (opened !== undefined) return refuse('lsp_edit_changed', opened.name);
        const posts: LspEditFile[] = onDisk.map((file) => ({
            ...file.place,
            hash: file.hash,
            edits: file.edits
        }));
        // The first tab whose draft is no longer the text its edit was computed from, if any.
        const moved = () => texts.find((one) => parts.draft(one.id).text !== one.from);
        if (posts.length > 0) {
            const written = await parts.write(posts);
            if (!written.ok) return refusedWrite(written, onDisk[0].name);
            // Text typed into a tab while the post was out is kept: the files are written already.
            const after = moved();
            if (after !== undefined) {
                return posts.length === 1
                    ? refuse('lsp_edit_typed_one', after.name)
                    : refuse('lsp_edit_typed', after.name, String(posts.length));
            }
        } else {
            const before = moved();
            if (before !== undefined) return refuse('lsp_edit_changed', before.name);
        }
        for (const one of texts) parts.edit(one.id, one.text, one.edits);
        return { applied: true };
    }

    async function apply(
        edit: unknown,
        held: ReadonlyMap<string, string> = new Map()
    ): Promise<LspEditOutcome> {
        const planned = await plan(edit, held);
        return planned.ok ? commit(planned.plan) : planned.outcome;
    }

    let last = '';

    function publish(): void {
        const seen = new Set<string>();
        const files: LspPlace[] = [];
        for (const tab of sourceTabs()) {
            const at = tab.file.indexOf('/');
            if (at < 0 || seen.has(tab.file)) continue;
            seen.add(tab.file);
            files.push({ root: tab.file.slice(0, at), path: tab.file.slice(at + 1) });
        }
        const text = JSON.stringify(files);
        if (text === last) return;
        last = text;
        parts.publishTabs(files);
    }

    return { apply, plan, commit, publish };
}
