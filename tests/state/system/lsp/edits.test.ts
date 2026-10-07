// Layer 4, state test. The page's one function for the edit a language server asks for
// (state/system/machine/lsp/edits.ts): the refusals G2 files (a library file, a path outside, an
// entry that creates, renames or deletes a file, a file open in a tab of another page), and the
// refusal of an edit whose tab was typed into while the edit waited (G8), each leaving every tab
// and every file as it was.
//
// The page is a set of recording parts: the tabs' drafts, the answer of the relay about another
// page's tabs, the file's hash and the post of `lsp-edit`. A tab is edited only through the
// part that replaces its draft, so the calls of that part are what is read.
//
// What this does NOT cover: the editor's undo stop for the draft's new text; the refusals of a
// file named twice and of a tab whose text is not the one the server holds, which no guarded entry
// names, so no row here tests them; and the server's own checks of the post, which
// tests/routes/replace/lsp-edit.test.ts runs.

import { describe, expect } from 'vitest';
import { it } from '../../../fixtures/scratch.ts';
import type { LspEditFile } from '../../../../src/lib/data/file-ops.ts';
import { pageUri } from '../../../../src/lib/data/prose/lsp-addresses.ts';
import {
    createLspEdits,
    type LspEditsParts
} from '../../../../src/lib/state/system/machine/lsp/edits.ts';
import type { LspPlace } from '../../../../src/lib/data/model/index.ts';
import type { Outcome } from '../../../../src/lib/state/sources/explorer/ops.svelte.ts';

type Draft = ReturnType<LspEditsParts['draft']>;

/** What a case hands the edits and reads back of them. */
type Page = {
    parts: LspEditsParts;
    written: LspEditFile[][];
    edited: { id: string; text: string }[];
};

/**
 * A page whose tabs are the drafts given. `during` runs while the answer about other pages is
 * awaited and `afterWrite` once the post answered, as typing into a tab would.
 */
function page(options: {
    drafts?: Record<string, Draft>;
    during?: () => void;
    afterWrite?: () => void;
    /** The files another page holds open in a tab, which the relay answers with. */
    elsewhere?: LspPlace[];
}): Page {
    const drafts = options.drafts ?? {};
    const made: Page = { parts: null as never, written: [], edited: [] };
    made.parts = {
        tabs: () => Object.keys(drafts).map((id) => ({ id, view: 'source' })),
        draft: (id) => drafts[id],
        edit: (id, text) => {
            made.edited.push({ id, text });
        },
        diskText: () => Promise.resolve(null),
        askHeld: (files) => {
            options.during?.();
            const asked = (one: LspPlace) =>
                files.some((file) => file.root === one.root && file.path === one.path);
            return Promise.resolve((options.elsewhere ?? []).filter(asked));
        },
        publishTabs: () => undefined,
        write: (files) => {
            made.written.push(files);
            options.afterWrite?.();
            return Promise.resolve({ ok: true, paths: [] } satisfies Outcome);
        },
        hashOf: () => Promise.resolve('abc')
    };
    return made;
}

const tab = (file: string, text: string, extra: Partial<Draft> = {}): Draft => ({
    file,
    text,
    saved: text,
    loaded: true,
    readonly: false,
    ...extra
});

/** The edit that renames the first three letters of the first line of each address. */
function rename(...addresses: string[]): unknown {
    return {
        documentChanges: addresses.map((uri) => ({
            textDocument: { uri, version: null },
            edits: [
                {
                    range: { start: { line: 0, character: 0 }, end: { line: 0, character: 3 } },
                    newText: 'new'
                }
            ]
        }))
    };
}

const a = pageUri({ root: 'hub', path: 'a.py' });
const b = pageUri({ root: 'hub', path: 'sub/b.py' });
const c = pageUri({ root: 'hub', path: 'sub/c.py' });

describe('the edit a language server asks for', () => {
    it('refuses a library file, a file under node_modules or a dot folder, and a path outside', async () => {
        const open = page({ drafts: { t1: tab('hub/a.py', 'old = 1\n') } });
        const edits = createLspEdits(open.parts);
        const library = 'oculus-lib:///token/os.py';
        const modules = pageUri({ root: 'hub', path: 'node_modules/x/y.js' });
        const dotted = pageUri({ root: 'hub', path: '.venv/lib/z.py' });
        expect(await edits.apply(rename(a, library))).toMatchObject({
            notice: 'lsp_edit_library',
            words: ['os.py']
        });
        expect(await edits.apply(rename(a, modules))).toMatchObject({ notice: 'lsp_edit_outside' });
        expect(await edits.apply(rename(a, dotted))).toMatchObject({ notice: 'lsp_edit_outside' });
        expect(await edits.apply(rename(a, 'file:///etc/passwd'))).toMatchObject({
            notice: 'lsp_edit_outside'
        });
        expect([open.edited, open.written]).toEqual([[], []]);
    });

    it('refuses an entry that creates, renames or deletes a file', async () => {
        const open = page({ drafts: { t1: tab('hub/a.py', 'old = 1\n') } });
        const edits = createLspEdits(open.parts);
        for (const kind of ['create', 'rename', 'delete']) {
            const change = kind === 'rename' ? { kind, oldUri: b, newUri: a } : { kind, uri: b };
            const edit = { documentChanges: [rename(a), change].flatMap(entries) };
            expect(await edits.apply(edit)).toMatchObject({
                applied: false,
                notice: 'lsp_edit_structure'
            });
        }
        expect([open.edited, open.written]).toEqual([[], []]);
    });

    it('refuses an edit that names a file open in a tab of another page, whether or not a tab of this page holds it', async () => {
        const open = page({
            drafts: { t1: tab('hub/a.py', 'old = 1\n') },
            elsewhere: [{ root: 'hub', path: 'a.py' }]
        });
        const held = new Map([[a, 'old = 1\n']]);
        expect(await createLspEdits(open.parts).apply(rename(a, b), held)).toEqual({
            applied: false,
            notice: 'lsp_edit_elsewhere',
            words: ['hub/a.py']
        });
        expect([open.edited, open.written]).toEqual([[], []]);
    });

    it('does not overwrite a tab typed into while the edit waited, and writes nothing before it notices', async () => {
        const drafts = { t1: tab('hub/a.py', 'old = 1\n') };
        const held = new Map([[a, 'old = 1\n']]);
        const waiting = page({
            drafts,
            during: () => {
                drafts.t1 = { ...drafts.t1, text: 'old = 1\nx = 2\n' };
            }
        });
        expect(await createLspEdits(waiting.parts).apply(rename(a, b), held)).toEqual({
            applied: false,
            notice: 'lsp_edit_changed',
            words: ['hub/a.py']
        });
        expect([waiting.edited, waiting.written]).toEqual([[], []]);

        drafts.t1 = tab('hub/a.py', 'old = 1\n');
        const posting = page({
            drafts,
            afterWrite: () => {
                drafts.t1 = { ...drafts.t1, text: 'old = 1\nx = 2\n' };
            }
        });
        expect(await createLspEdits(posting.parts).apply(rename(a, b), held)).toEqual({
            applied: false,
            notice: 'lsp_edit_typed_one',
            words: ['hub/a.py']
        });
        expect(posting.edited).toEqual([]);
        expect(posting.written).toHaveLength(1);

        drafts.t1 = tab('hub/a.py', 'old = 1\n');
        const several = page({
            drafts,
            afterWrite: () => {
                drafts.t1 = { ...drafts.t1, text: 'old = 1\nx = 2\n' };
            }
        });
        expect(await createLspEdits(several.parts).apply(rename(a, b, c), held)).toEqual({
            applied: false,
            notice: 'lsp_edit_typed',
            words: ['hub/a.py', '2']
        });
        expect([several.edited, several.written]).toEqual([[], [expect.any(Array)]]);
    });
});

/** The entries of an edit's `documentChanges`, whether given as an edit or as one entry. */
function entries(value: unknown): unknown[] {
    const changes = (value as { documentChanges?: unknown[] }).documentChanges;
    return changes ?? [value];
}
