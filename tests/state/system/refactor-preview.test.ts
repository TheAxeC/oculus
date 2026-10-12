// Layer 4, state test. The Refactor Preview store (state/system/machine/refactor/preview.svelte.ts)
// over the page's one function for editing (state/system/machine/lsp/edits.ts), the guarded entry
// G68: a rename of a hub key is shown and nothing is written while it is shown; Discard writes
// nothing and edits no tab; Apply writes the checked edits only and no file with none checked; a
// second preview waits for the reader's answer; an Apply after a tab changed writes nothing.
//
// The page is a set of recording parts: the drafts of the tabs, the disk's text of each closed file
// and the post of `lsp-edit`. A tab is edited only through the part that replaces its draft, so
// the calls of that part and of the post are what is read.
//
// What this does NOT cover: the view that draws the preview, the diff pane that reads `sides`
// (tests/views/sources/repositories/diff/diff-read.test.ts reads the key it derives), and the
// server's own checks of the post (tests/routes/replace/lsp-edit.test.ts).

import { describe, expect } from 'vitest';
import { it } from '../../fixtures/scratch.ts';
import type { LspEditFile } from '../../../src/lib/data/file-ops.ts';
import { pageUri } from '../../../src/lib/data/prose/lsp-addresses.ts';
import { createLspEdits } from '../../../src/lib/state/system/machine/lsp/edits.ts';
import { createRefactor } from '../../../src/lib/state/system/machine/refactor/preview.svelte.ts';
import type { Outcome } from '../../../src/lib/state/sources/explorer/ops.svelte.ts';
import { RENAME_ANNOTATION } from '../../../src/lib/data/prose/text-edits.ts';

/** The files of the disk by `root/path`, each with its text. */
const DISK: Record<string, string> = {
    'hub/open.yml': 'venue: old\n',
    'hub/two.yml': 'a: old\nb: old\n',
    'hub/one.yml': 'c: old\n'
};

const open = pageUri({ root: 'hub', path: 'open.yml' });
const two = pageUri({ root: 'hub', path: 'two.yml' });
const one = pageUri({ root: 'hub', path: 'one.yml' });

/** The text edit that renames the `old` at a line, after `key: `. */
function at(line: number, column: number) {
    return {
        range: {
            start: { line, character: column },
            end: { line, character: column + 3 }
        },
        newText: 'new'
    };
}

/** The rename the YAML entry answers: three files, four places, one change annotation. */
function renameEdit(): unknown {
    return {
        documentChanges: [
            { textDocument: { uri: open, version: 1 }, edits: [at(0, 7)] },
            { textDocument: { uri: two, version: null }, edits: [at(0, 3), at(1, 3)] },
            { textDocument: { uri: one, version: null }, edits: [at(0, 3)] }
        ],
        changeAnnotations: {
            [RENAME_ANNOTATION]: { label: 'old', description: 'new', needsConfirmation: true }
        }
    };
}

/** What a case reads back of the page. */
type Page = {
    store: ReturnType<typeof createRefactor>;
    posted: LspEditFile[][];
    edited: { id: string; text: string }[];
    shown: { count: number };
    typeInto: (text: string) => void;
    held: ReadonlyMap<string, string>;
};

/** A page whose one tab holds `hub/open.yml`. */
function page(): Page {
    let draft = 'venue: old\n';
    const posted: LspEditFile[][] = [];
    const edited: { id: string; text: string }[] = [];
    const shown = { count: 0 };
    const lspEdits = createLspEdits({
        tabs: () => [{ id: 't1', view: 'source' }],
        draft: () => ({
            file: 'hub/open.yml',
            text: draft,
            saved: draft,
            loaded: true,
            readonly: false
        }),
        edit: (id, text) => {
            edited.push({ id, text });
            draft = text;
        },
        read: (root, path) => {
            const name = `${root}/${path}`;
            return Promise.resolve(
                name in DISK ? { text: DISK[name], hash: `hash-${path}` } : null
            );
        },
        askHeld: () => Promise.resolve([]),
        publishTabs: () => undefined,
        write: (files) => {
            posted.push(files);
            return Promise.resolve({ ok: true, paths: [] } satisfies Outcome);
        },
        roots: () => [{ key: 'hub', dir: '/work/hub', real: '/work/hub' }],
        withheld: () => false
    });
    const store = createRefactor({
        lspEdits,
        show: () => {
            shown.count += 1;
        }
    });
    return {
        store,
        posted,
        edited,
        shown,
        typeInto: (text) => {
            draft = text;
        },
        held: new Map([[open, 'venue: old\n']])
    };
}

const options = {
    preview: false,
    applied: () => Promise.resolve(),
    words: (notice: string, words: string[]) => [notice, ...words].join(' ')
};

describe('the rename preview', () => {
    it('shows the edit and writes nothing and edits no tab while it is shown', async () => {
        const made = page();
        const outcome = await made.store.submit(renameEdit(), made.held, options);
        expect(outcome).toEqual({ applied: true });
        expect(made.store.pending()?.rename).toEqual({ from: 'old', to: 'new' });
        expect(made.store.pending()?.files.map((file) => file.name)).toEqual([
            'hub/open.yml',
            'hub/two.yml',
            'hub/one.yml'
        ]);
        expect(made.shown.count).toBe(1);
        expect([made.posted, made.edited]).toEqual([[], []]);
    });

    it('writes nothing and edits no tab on Discard', async () => {
        const made = page();
        await made.store.submit(renameEdit(), made.held, options);
        made.store.discard();
        await made.store.apply();
        expect(made.store.pending()).toBeNull();
        expect([made.posted, made.edited]).toEqual([[], []]);
    });

    it('writes the checked edits only, and nothing for a file with none checked', async () => {
        const made = page();
        let applied = 0;
        await made.store.submit(renameEdit(), made.held, {
            ...options,
            applied: () => {
                applied += 1;
                return Promise.resolve();
            }
        });
        made.store.setEdit('hub/two.yml', 1, false);
        made.store.setFile('hub/one.yml', false);
        await made.store.apply();
        expect(made.posted).toEqual([
            [{ root: 'hub', path: 'two.yml', hash: 'hash-two.yml', edits: [at(0, 3)] }]
        ]);
        expect(made.edited).toEqual([{ id: 't1', text: 'venue: new\n' }]);
        expect(made.store.pending()).toBeNull();
        expect(applied).toBe(1);
    });

    it('shows the two texts of a file with the checked edits applied', async () => {
        const made = page();
        await made.store.submit(renameEdit(), made.held, options);
        const id = made.store.pending()?.id ?? '';
        made.store.setEdit('hub/two.yml', 0, false);
        expect(made.store.sides(id, 'hub', 'two.yml')).toEqual({
            original: 'a: old\nb: old\n',
            modified: 'a: old\nb: new\n'
        });
        expect(made.store.revision(id)).toBe(1);
    });

    it('holds a second preview as incoming, posting nothing, and Continue replaces the first', async () => {
        const made = page();
        await made.store.submit(renameEdit(), made.held, options);
        const first = made.store.pending()?.id;
        await made.store.submit(renameEdit(), made.held, options);
        expect(made.store.pending()?.id).toBe(first);
        expect(made.store.incoming()).not.toBeNull();
        expect([made.posted, made.edited]).toEqual([[], []]);
        made.store.cancelIncoming();
        expect([made.store.pending()?.id, made.store.incoming()]).toEqual([first, null]);
        await made.store.submit(renameEdit(), made.held, options);
        made.store.continueIncoming();
        expect(made.store.pending()?.id).not.toBe(first);
        expect(made.store.incoming()).toBeNull();
        expect([made.posted, made.edited]).toEqual([[], []]);
    });

    it('writes nothing on Apply when a planned tab was typed into after the preview opened', async () => {
        const made = page();
        await made.store.submit(renameEdit(), made.held, options);
        made.typeInto('venue: old\n# typed\n');
        await made.store.apply();
        expect([made.posted, made.edited]).toEqual([[], []]);
        expect(made.store.failed()).toBe('lsp_edit_changed hub/open.yml');
        expect(made.store.pending()).not.toBeNull();
    });

    it('makes an edit with no annotation at once, unless the reader asked to preview it', async () => {
        const made = page();
        const plain = { changes: { [one]: [at(0, 3)] } };
        expect(await made.store.submit(plain, made.held, options)).toEqual({ applied: true });
        expect(made.store.pending()).toBeNull();
        expect(made.posted).toHaveLength(1);
        await made.store.submit(plain, made.held, { ...options, preview: true });
        expect(made.store.pending()?.rename).toBeNull();
        expect(made.posted).toHaveLength(1);
    });
});
