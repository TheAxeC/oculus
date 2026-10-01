// Layer 3, view test. What the Files row menu's file operations do over the stores
// (views/sources/files/tree/row-ops.ts): the picks of the menu, the upload of the files a chooser
// hands over, the delete question that precedes a trash, and the sentences the view says: the
// question words and the refusal words of files.yml, and the compare refusals the diff pane says.
//
// The stores are the real client's over a stub of `fetch`; the questions are calls handed in, so a
// case answers yes or no for the page. The words are the real catalog.
//
// What this does NOT cover: the questions drawn, the name input (Enter, blur, Escape, the
// selection), the chooser's dialog and the faded cut row, which need a DOM and are seen at the
// look; the stores' own cases are tests/state/sources/explorer/ops.test.ts.

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MAX_UPLOAD_BYTES } from '../../../../src/lib/data/file-ops.ts';
import { engineDir, loadConfig, textCatalog } from '../../../../src/lib/data/sources/config.ts';
import { setCatalog, t } from '../../../../src/lib/state/shared/words/text.ts';
import type { TreeRow } from '../../../../src/lib/state/sources/fs.ts';
import { compareSentence } from '../../../../src/lib/views/sources/repositories/diff/compare-words.ts';
import {
    ROW_COPY,
    ROW_CUT,
    ROW_DELETE,
    ROW_PASTE,
    ROW_SELECT_COMPARE,
    ROW_UPLOAD,
    holdsContents,
    rowOpsPicker,
    type RowOpsDeps
} from '../../../../src/lib/views/sources/files/tree/row-ops.ts';
import { createClientState, type ClientState } from '../../../fixtures/client.ts';

const catalog = textCatalog(loadConfig(engineDir()).config);
setCatalog(catalog);

const words = (key: string, ...args: (string | number)[]): string =>
    args.length === 0 ? `@${key}` : `@${key}(${args.join(',')})`;

type Body = Record<string, unknown>;

let client: ClientState;
let posted: Body[];
let answers: (body: Body, at: number) => Body;
let reads: string[];

const folder: TreeRow = {
    root: 'hub',
    path: 'sub',
    name: 'sub',
    kind: 'dir',
    size: 0,
    depth: 1,
    open: true
};
const note: TreeRow = { ...folder, path: 'sub/a.md', name: 'a.md', kind: 'file', depth: 2 };

beforeEach(() => {
    vi.stubGlobal('window', {});
    client = createClientState();
    client.writes.setToken('token');
    posted = [];
    reads = [];
    answers = () => ({ ok: true, path: 'sub/x', paths: ['sub/x'] });
    vi.stubGlobal('fetch', (url: string, init?: RequestInit) => {
        if (url === '/api/ops' && init?.method === 'POST') {
            const body = JSON.parse(typeof init.body === 'string' ? init.body : '{}') as Body;
            posted.push(body);
            const made = answers(body, posted.length - 1);
            return Promise.resolve(
                new Response(JSON.stringify(made), {
                    status: made.ok === true ? 200 : 409,
                    headers: { 'content-type': 'application/json' }
                })
            );
        }
        return Promise.resolve(
            new Response(JSON.stringify({ entries: [] }), {
                headers: { 'content-type': 'application/json' }
            })
        );
    });
    vi.stubGlobal(
        'FileReader',
        class {
            result = '';
            onload: (() => void) | null = null;
            onerror: (() => void) | null = null;
            readAsDataURL(file: File): void {
                reads.push(file.name);
                this.result = `data:application/octet-stream;base64,${file.name}`;
                this.onload?.();
            }
        }
    );
});

afterEach(() => vi.unstubAllGlobals());

/**
 * What a case hands the picker: the real explorer store, and calls that record what the view did.
 */
function setup(changes: Partial<RowOpsDeps> = {}): {
    pick: (row: TreeRow, id: string) => void;
    said: string[];
    asked: unknown[];
} {
    const said: string[] = [];
    const asked: unknown[] = [];
    const deps: RowOpsDeps = {
        explorer: client.explorer,
        say: (note: string) => said.push(note),
        confirm: (question: unknown) => {
            asked.push(question);
            return Promise.resolve(true);
        },
        choose: () => Promise.resolve([] as File[]),
        startName: vi.fn(),
        openCompare: vi.fn(),
        draftOf: () => false,
        ...changes
    };
    return { pick: rowOpsPicker(deps, words), said, asked };
}

async function settled(): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, 0));
}

/** A file of the size given, not read: only its name and its size are looked at. */
function sized(name: string, size: number): File {
    const file = new File(['x'], name);
    Object.defineProperty(file, 'size', { value: size });
    return file;
}

describe('Upload... from the menu', () => {
    // Revert: post the file over MAX_UPLOAD_BYTES as well.
    it('audits that skips a file over the limit with the too_large sentence, and posts the others', async () => {
        const { pick, said } = setup({
            choose: () =>
                Promise.resolve([
                    sized('one', 3),
                    sized('big.bin', MAX_UPLOAD_BYTES + 1),
                    sized('two', 4)
                ])
        });
        pick(folder, ROW_UPLOAD);
        await settled();
        expect(posted).toEqual([
            { op: 'upload', root: 'hub', path: 'sub', name: 'one', data: 'one', replace: false },
            { op: 'upload', root: 'hub', path: 'sub', name: 'two', data: 'two', replace: false }
        ]);
        expect(reads).toEqual(['one', 'two']);
        expect(said).toHaveLength(1);
        expect(said[0]).toContain('@files.upload_done(2)');
        expect(said[0]).toContain('@files.upload_refused(big.bin,@files.refused_too_large)');
    });

    it('audits that takes a file of exactly the limit', async () => {
        const { pick } = setup({
            choose: () => Promise.resolve([sized('edge', MAX_UPLOAD_BYTES)])
        });
        pick(folder, ROW_UPLOAD);
        await settled();
        expect(posted.map((body) => body.name)).toEqual(['edge']);
    });

    // Revert: send replace: true without asking.
    it('audits that asks the replace question per file on a taken name, with the irreversible detail, and posts again on yes', async () => {
        answers = (body, at) =>
            at === 0
                ? { ok: false, error: 'exists', done: [], failed: String(body.name) }
                : { ok: true, path: 'sub/one' };
        const { pick, asked } = setup({ choose: () => Promise.resolve([sized('one', 3)]) });
        pick(folder, ROW_UPLOAD);
        await settled();
        expect(asked).toEqual([{ kind: 'replace', name: 'one', upload: true }]);
        expect(posted.map((body) => body.replace)).toEqual([false, true]);
    });

    it('audits that lands nothing and says so when the chooser hands over no file', async () => {
        const { pick, said } = setup();
        pick(folder, ROW_UPLOAD);
        await settled();
        expect(posted).toEqual([]);
        expect(said).toEqual([]);
    });

    it('audits that names a file the server refused, with the sentence of its refusal', async () => {
        answers = () => ({ ok: false, error: 'denied', done: [], failed: '' });
        const { pick, said } = setup({ choose: () => Promise.resolve([sized('one', 3)]) });
        pick(folder, ROW_UPLOAD);
        await settled();
        expect(said[0]).toContain('@files.upload_refused(one,@files.refused_denied)');
    });
});

describe('Delete from the menu', () => {
    // Revert: post the trash before the question is answered.
    it('audits that asks first, and posts the trash only on yes', async () => {
        const no = setup({ confirm: () => Promise.resolve(false) });
        no.pick(note, ROW_DELETE);
        await settled();
        expect(posted).toEqual([]);
        const yes = setup();
        yes.pick(note, ROW_DELETE);
        await settled();
        expect(yes.asked).toEqual([
            { kind: 'delete', name: 'a.md', folder: false, unsaved: false }
        ]);
        expect(posted).toEqual([{ op: 'trash', root: 'hub', paths: ['sub/a.md'] }]);
    });

    it('audits that asks the folder question for a folder, and says an unsaved draft would be lost', async () => {
        const { pick, asked } = setup({ draftOf: () => true });
        pick(folder, ROW_DELETE);
        await settled();
        expect(asked).toEqual([{ kind: 'delete', name: 'sub', folder: true, unsaved: true }]);
    });

    // Revert: choose the folder question for every row of kind dir, a link included.
    it('audits that asks the file question for a link to a folder, which removes only the link', async () => {
        const link: TreeRow = { ...folder, path: 'docs', name: 'docs', link: true };
        const { pick, asked } = setup({ draftOf: (row) => holdsContents(row) });
        pick(link, ROW_DELETE);
        await settled();
        expect(asked).toEqual([{ kind: 'delete', name: 'docs', folder: false, unsaved: false }]);
        expect(holdsContents(folder)).toBe(true);
        expect(holdsContents(note)).toBe(false);
    });

    it("says a refusal on the tree's line", async () => {
        answers = () => ({ ok: false, error: 'denied', done: [], failed: 'sub/a.md' });
        const { pick, said } = setup();
        pick(note, ROW_DELETE);
        await settled();
        expect(said.at(-1)).toContain('@files.refused_denied');
    });
});

describe('Cut, Copy, Paste and Select for Compare from the menu', () => {
    it('audits that puts the row on the clipboard as cut or copied, and pastes it into a folder', async () => {
        const { pick } = setup();
        pick(note, ROW_CUT);
        expect(client.explorer.clipboard()).toEqual({
            mode: 'cut',
            items: [{ root: 'hub', path: 'sub/a.md' }]
        });
        pick(note, ROW_COPY);
        expect(client.explorer.clipboard()?.mode).toBe('copy');
        pick({ ...folder, path: 'other', name: 'other' }, ROW_PASTE);
        await settled();
        expect(posted[0]).toMatchObject({ op: 'paste', mode: 'copy', root: 'hub', path: 'other' });
    });

    it('audits that holds the row as the file selected for compare', () => {
        const { pick } = setup();
        pick(note, ROW_SELECT_COMPARE);
        expect(client.explorer.compareFile()).toEqual({ root: 'hub', path: 'sub/a.md' });
    });
});

describe('the words of the operations', () => {
    const asked = (key: string): string => catalog[key];

    // Revert: word the question as anything but VS Code's (fileActions.ts:90, :121, :176,
    // :278-281).
    it("words the delete question as VS Code's", () => {
        expect(asked('files.delete_question')).toBe("Are you sure you want to delete '{0}'?");
        expect(asked('files.delete_question_folder')).toBe(
            "Are you sure you want to delete '{0}' and its contents?"
        );
        expect(asked('files.delete_detail')).toBe('You can restore this file from the Trash.');
        expect(asked('files.delete_detail_unsaved')).toBe(
            "Your changes will be lost if you don't save them."
        );
        expect(asked('files.delete_button')).toBe('Move to Trash');
    });

    it("words the permanent-delete question as VS Code's (fileActions.ts:222-231)", () => {
        expect(asked('files.permanent_question')).toBe(
            'Failed to delete using the Trash. Do you want to permanently delete instead?'
        );
        expect(asked('files.permanent_button')).toBe('Delete Permanently');
        expect(asked('files.permanent_detail')).toBe('This action is irreversible!');
    });

    it("words the replace question as VS Code's (fileActions.ts:489, fileImportExport.ts:864-866)", () => {
        expect(asked('files.replace_question')).toBe(
            "A file or folder with the name '{0}' already exists in the destination folder. Do you want to replace it?"
        );
        expect(asked('files.replace_button')).toBe('Replace');
        expect(asked('files.replace_detail_upload')).toBe('This action is irreversible!');
    });

    it("words every menu item as VS Code's", () => {
        expect(asked('files.menu_new_file')).toBe('New File...');
        expect(asked('files.menu_new_folder')).toBe('New Folder...');
        expect(asked('files.menu_upload')).toBe('Upload...');
        expect(asked('files.menu_paste')).toBe('Paste');
        expect(asked('files.menu_find')).toBe('Find in Folder...');
        expect(asked('files.menu_cut')).toBe('Cut');
        expect(asked('files.menu_copy')).toBe('Copy');
        expect(asked('files.menu_rename')).toBe('Rename...');
        expect(asked('files.menu_delete')).toBe('Delete');
        expect(asked('files.menu_select_compare')).toBe('Select for Compare');
        expect(asked('files.menu_compare_with')).toBe('Compare with Selected');
        expect(asked('files.menu_compare_selected')).toBe('Compare Selected');
        expect(asked('files.menu_reveal')).toBe('Reveal in Finder');
    });

    it('audits that has a sentence for every refusal word of the server', () => {
        for (const word of [
            'outside',
            'missing',
            'root',
            'protected',
            'invalid_name',
            'exists',
            'into_itself',
            'not_a_folder',
            'denied',
            'trash_failed',
            'too_large',
            'not_base64'
        ]) {
            expect(asked(`files.refused_${word}`), word).toBeTypeOf('string');
            expect(asked(`files.refused_${word}`).trim(), word).not.toBe('');
        }
    });
});

describe('the sentences of a refused comparison', () => {
    it('audits that maps each refusal of the compare to a sentence of files.yml', () => {
        expect(compareSentence('outside', t)).toBe(t('files.compare_outside'));
        expect(compareSentence('missing', t)).toBe(t('files.compare_missing'));
        expect(compareSentence('not_a_folder', t)).toBe(t('files.compare_not_a_file'));
        expect(compareSentence('too_large', t)).toBe(t('files.compare_too_large'));
        const sentences = ['outside', 'missing', 'not_a_folder', 'too_large'].map((word) =>
            compareSentence(word, t)
        );
        expect(new Set(sentences).size).toBe(4);
        for (const sentence of sentences) expect(sentence).not.toMatch(/^files\./);
    });

    it("says the pane's own failure sentence for a word it does not know", () => {
        expect(compareSentence('something else', t)).toBe(t('repositories.diff_failed'));
        expect(compareSentence('', t)).toBe(t('repositories.diff_failed'));
    });
});
