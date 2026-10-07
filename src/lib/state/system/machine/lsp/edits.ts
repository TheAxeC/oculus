// Layer 2, client state. The one function that makes the edit a language server asks for: a
// `workspace/applyEdit` request, the edit of a code action and the answer to a rename all come to
// `apply`, with the workspace edit as the relay gave it (the page's addresses of each file).
//
// A file a tab of this page holds, whatever its language or whether a server serves it, is edited
// in the tab: the text of its draft is changed, unsaved, which the editor shows as one undo stop in
// every tab of the file. Every other file is written to disk by one `lsp-edit` operation
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
// The whole edit is refused, with the notice that names the file, when
// - a file is a library file, outside the served roots, or under a `node_modules` or dot folder,
// - an entry creates, renames or deletes a file, or one file is named twice,
// - a file it names is open in a tab of another page (asked of the relay), whether or not a tab of
//   this page holds it too,
// - a tab's text no longer matches the positions of its edits, or the tab is read-only,
// - a tab's text is not the text the server computed the edit on,
// - a tab's draft changed while the edit waited, before the files were written (after, the files
//   stay written, History undoes them, and the tabs are left as typed), or
// - the server refuses what it was asked to write.
//
// The hash an `lsp-edit` file carries is that of the bytes read from the file just before the
// request, which the server checks again as it writes.

import type { LspEditFile } from '../../../../data/file-ops.ts';
import type { LspPlace } from '../../../../data/model/index.ts';
import { libraryOf, placeOf } from '../../../../data/prose/lsp-addresses.ts';
import {
    applyTextEdits,
    type LspEditNotice,
    type TextEdit
} from '../../../../data/prose/text-edits.ts';
import type { Outcome } from '../../../sources/explorer/ops.svelte.ts';

/** How an edit ended: made, or refused with the notice that says why and the words it uses. */
type LspEditOutcome =
    { applied: true } | { applied: false; notice: LspEditNotice; words: string[] };

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
    /** The text of a file as the disk holds it now; null when it cannot be read. */
    diskText: (root: string, path: string) => Promise<string | null>;
    /** Which of some files another page holds open in a tab; null when it was not answered. */
    askHeld: (files: LspPlace[]) => Promise<LspPlace[] | null>;
    /** Tell the relay which files this page's tabs hold. */
    publishTabs: (files: LspPlace[]) => void;
    /** Post an `lsp-edit` of files no tab holds. */
    write: (files: LspEditFile[]) => Promise<Outcome>;
    /**
     * The SHA-256 of a file's bytes as they are now, lower-case hex; null when it cannot be read.
     */
    hashOf: (root: string, path: string) => Promise<string | null>;
};

export type LspEdits = {
    /**
     * Make an edit; `held` is the text the asking server holds of each document, by the page's
     * address of the file, over every language its entry serves.
     */
    apply: (edit: unknown, held?: ReadonlyMap<string, string>) => Promise<LspEditOutcome>;
    /** Tell the relay the files the tabs hold now; called whenever the tabs change. */
    publish: () => void;
};

/** One file of an edit: where it is and the edits made in it, in the order given. */
type Named = { place: LspPlace; name: string; address: string; edits: TextEdit[] };

/** A tab's new text, with the draft text it was computed from. */
type Computed = {
    id: string;
    place: LspPlace;
    name: string;
    from: string;
    text: string;
    edits: TextEdit[];
};

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

/** Whether an edit is never made in a file: under a `node_modules` folder or a dot folder. */
function inLibraryFolder(path: string): boolean {
    return path
        .split('/')
        .slice(0, -1)
        .some((part) => part === 'node_modules' || part.startsWith('.') || part === '..');
}

/**
 * The files a workspace edit names with the edits of each, or the refusal: an entry that creates,
 * renames or deletes a file, an address that is a library file or is no file of the page.
 */
function namedBy(edit: unknown): Named[] | LspEditOutcome {
    if (!isRecord(edit)) return refuse('lsp_edit_empty');
    const files = new Map<string, Named>();
    const add = (address: string, edits: unknown): LspEditOutcome | null => {
        if (libraryOf(address) !== null)
            return refuse('lsp_edit_library', libraryOf(address)?.name ?? '');
        const place = placeOf(address);
        if (place === null || inLibraryFolder(place.path))
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

/** The notice for a refusal of the server's `lsp-edit`. */
function refusedWrite(outcome: Extract<Outcome, { ok: false }>, first: string): LspEditOutcome {
    const name = outcome.failed ?? first;
    const done = outcome.done?.length ?? 0;
    if (done === 1) return refuse('lsp_edit_partial_one', name);
    if (done > 0) return refuse('lsp_edit_partial', name, String(done));
    if (outcome.error === 'outside') return refuse('lsp_edit_outside', name);
    if (outcome.error === 'protected') return refuse('lsp_edit_protected', name);
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

    async function apply(
        edit: unknown,
        held: ReadonlyMap<string, string> = new Map()
    ): Promise<LspEditOutcome> {
        const named = namedBy(edit);
        if (!Array.isArray(named)) return named;
        const tabs = sourceTabs();
        const inTabs = (one: Named) => tabs.filter((tab) => tab.file === one.name);
        const onDisk = named.filter((one) => inTabs(one).length === 0);
        // The edits of every tab are computed first, so a text the edit no longer fits refuses all.
        const texts: Computed[] = [];
        for (const one of named) {
            for (const tab of inTabs(one)) {
                const draft = parts.draft(tab.id);
                if (!draft.loaded || draft.readonly) return refuse('lsp_edit_protected', one.name);
                const made = applyTextEdits(draft.text, one.edits);
                if (!made.ok) return refuse('lsp_edit_changed', one.name);
                texts.push({
                    id: tab.id,
                    place: one.place,
                    name: one.name,
                    from: draft.text,
                    text: made.text,
                    edits: one.edits
                });
            }
        }
        const elsewhere = await parts.askHeld(named.map((one) => one.place));
        if (elsewhere === null) return refuse('lsp_edit_failed', named[0].name);
        if (elsewhere.length > 0) return refuse('lsp_edit_elsewhere', nameOf(elsewhere[0]));
        // The edit's positions are those of the text the server holds, or of the file on disk when
        // it holds none, so a tab is edited only when its draft is that text.
        const served = new Map(
            [...held].flatMap(([address, text]) => {
                const place = placeOf(address);
                return place === null ? [] : [[nameOf(place), lf(text)] as const];
            })
        );
        for (const one of texts) {
            const text = served.get(one.name);
            if (text !== undefined) {
                if (text !== lf(one.from)) return refuse('lsp_edit_changed', one.name);
                continue;
            }
            const draft = parts.draft(one.id);
            const disk = await parts.diskText(one.place.root, one.place.path);
            if (draft.text !== draft.saved || disk !== draft.saved) {
                return refuse('lsp_edit_changed', one.name);
            }
        }
        const files: LspEditFile[] = [];
        for (const one of onDisk) {
            const hash = await parts.hashOf(one.place.root, one.place.path);
            if (hash === null) return refuse('lsp_edit_failed', one.name);
            files.push({ ...one.place, hash, edits: one.edits });
        }
        // The first tab whose draft is no longer the text its edit was computed from, if any.
        const moved = () => texts.find((one) => parts.draft(one.id).text !== one.from);
        const before = moved();
        if (before !== undefined) return refuse('lsp_edit_changed', before.name);
        if (files.length > 0) {
            const written = await parts.write(files);
            if (!written.ok) return refusedWrite(written, onDisk[0].name);
            // Text typed into a tab while the post was out is kept: the files are written already.
            const after = moved();
            if (after !== undefined) {
                return files.length === 1
                    ? refuse('lsp_edit_typed_one', after.name)
                    : refuse('lsp_edit_typed', after.name, String(files.length));
            }
        }
        for (const one of texts) parts.edit(one.id, one.text, one.edits);
        return { applied: true };
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

    return { apply, publish };
}
