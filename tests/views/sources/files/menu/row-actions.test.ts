// Layer 3, view test. What the Files row menu and the keys do with several rows selected, the
// hints the menu shows, the delete question for one row and for several, the drops of the tree and
// the upload of files: views/shared/explorer/tree/menu/row-menu.ts, row-ops.ts and row-drop.ts.
//
// The explorer store is a fake that records its calls; the questions are calls that answer yes or
// no for the page; the words are the real catalog or, where a key is asserted, a stand-in `t`.
//
// What this does NOT cover: the menu opened by a right-click, the drag events and the keys pressed
// (a browser), and the store behind each call (tests/state/sources/explorer/acts/store.test.ts).

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MAX_UPLOAD_BYTES } from '../../../../../src/lib/data/file-ops.ts';
import { engineDir, loadConfig, textCatalog } from '../../../../../src/lib/data/sources/config.ts';
import { setCatalog } from '../../../../../src/lib/state/shared/words/text.ts';
import {
    chordHint,
    filesKeymap,
    keyWords,
    keyPlan
} from '../../../../../src/lib/state/sources/explorer/acts/keys.ts';
import type { Outcome } from '../../../../../src/lib/state/sources/explorer/ops.svelte.ts';
import type { TreeRow } from '../../../../../src/lib/state/sources/fs.ts';
import { rowDropper } from '../../../../../src/lib/views/shared/explorer/tree/menu/row-drop.ts';
import {
    ROW_COPY_PATH,
    ROW_COPY_RELATIVE,
    ROW_REMOVE_ROOT,
    menuHints,
    pickOfKey,
    rowFacts,
    rowMenu,
    type RowMenuFacts
} from '../../../../../src/lib/views/shared/explorer/tree/menu/row-menu.ts';
import {
    ROW_COMPARE_SELECTED,
    ROW_COPY,
    ROW_CUT,
    ROW_DELETE,
    askedWords,
    rowOpsPicker,
    uploader,
    type AskedQuestion,
    type RowOpsDeps
} from '../../../../../src/lib/views/shared/explorer/tree/menu/row-ops.ts';
import type { MenuItem } from '../../../../../src/lib/ui/menu/menu-items.ts';

const catalog = textCatalog(loadConfig(engineDir()).config);
setCatalog(catalog);

const words = (key: string, ...args: (string | number)[]): string =>
    args.length === 0 ? `@${key}` : `@${key}(${args.join(',')})`;

const real = (key: string, ...args: (string | number)[]): string =>
    (catalog[key] ?? key).replace(/\{(\d+)\}/g, (_all, at: string) =>
        String(args[Number(at)] ?? '')
    );

const row = (
    path: string,
    kind: 'file' | 'dir' = 'file',
    extra: Partial<TreeRow> = {}
): TreeRow => ({
    root: 'hub',
    path,
    name: path.slice(path.lastIndexOf('/') + 1),
    kind,
    size: 1,
    depth: 1,
    open: false,
    ...extra
});

const labelsOf = (items: MenuItem[]): string[] => items.map((item) => item.label);

function facts(kind: RowMenuFacts['kind'], over: Partial<RowMenuFacts> = {}): RowMenuFacts {
    return {
        kind,
        path: kind === 'root' ? '' : 'a',
        removable: false,
        addable: false,
        clipboard: false,
        compareWith: null,
        selection: 1,
        markdown: false,
        ...over
    };
}

describe('the menu over a selection', () => {
    // Revert: draw the single-row menu whatever the selection.
    it('audits that offers Compare Selected, Cut, Copy, the two copies and Delete for exactly two files', () => {
        const items = rowMenu(facts('file', { selection: 2, selectedFiles: 2 }), words);

        expect(labelsOf(items)).toEqual([
            '@files.menu_compare_selected',
            '@files.menu_cut',
            '@files.menu_copy',
            '@files.menu_copy_path',
            '@files.menu_copy_relative',
            '@files.menu_delete'
        ]);
        expect(items.some((one) => one.id === ROW_COMPARE_SELECTED)).toBe(true);
    });

    // Revert: offer Compare Selected for three rows or for a file and a folder.
    it('audits that offers Compare Selected for no other selection', () => {
        const ids = (over: Partial<RowMenuFacts>): string[] =>
            rowMenu(facts('file', over), words).map((one) => one.id);

        // three files are one more than a comparison takes
        expect(ids({ selection: 3, selectedFiles: 3 })).not.toContain(ROW_COMPARE_SELECTED);
        // a file and a folder cannot be compared with each other
        expect(ids({ selection: 2, selectedFiles: 1 })).not.toContain(ROW_COMPARE_SELECTED);
        expect(ids({ selection: 2 })).toContain(ROW_COMPARE_SELECTED);
    });

    // Revert: leave Rename out of the selection's menu check.
    it('audits that offers neither Rename nor the creating items over a selection', () => {
        const labels = labelsOf(rowMenu(facts('dir', { selection: 4 }), words));

        // a rename takes one row, and four are selected
        expect(labels).not.toContain('@files.menu_rename');
        // a new file has no single folder to go into over four rows
        expect(labels).not.toContain('@files.menu_new_file');
    });
});

describe('the key hints', () => {
    const hints = (mac: boolean) =>
        menuHints(
            filesKeymap(mac),
            keyWords((k) => real(k), mac)
        );

    // Revert: drop an item from HINTED.
    it('audits that shows each key as VS Code does on macOS', () => {
        expect(hints(true)).toEqual({
            rename: 'Enter',
            delete: 'Cmd+Backspace',
            cut: 'Cmd+X',
            copy: 'Cmd+C',
            paste: 'Cmd+V',
            'copy-path': 'Option+Cmd+C',
            'copy-relative': 'Option+Shift+Cmd+C'
        });
    });

    // Revert: give every platform the macOS words.
    it('audits that shows Ctrl and Alt where the platform has no Cmd and Option', () => {
        expect(hints(false).delete).toBe('Ctrl+Backspace');
        expect(hints(false)['copy-path']).toBe('Ctrl+Alt+C');
    });

    // Revert: leave `hint` off the items in rowMenu.
    it('audits that puts the hint on the item it belongs to, and none on an item without one', () => {
        const items = rowMenu(facts('file', { hints: hints(true) }), real);
        const of = (id: string) => items.find((one) => one.id === id);

        expect(of(ROW_DELETE)?.hint).toBe('Cmd+Backspace');
        expect(of(ROW_COPY_PATH)?.hint).toBe('Option+Cmd+C');
        expect(of(ROW_COPY_RELATIVE)?.hint).toBe('Option+Shift+Cmd+C');
        expect(of('reveal')?.hint).toBeUndefined();
    });

    // Revert: return a pick for the open key.
    it('audits that maps a key plan that does what a menu item does to that item, and the rest to none', () => {
        expect(pickOfKey('rename')).toBe('rename');
        expect(pickOfKey('delete')).toBe(ROW_DELETE);
        expect(pickOfKey('cut')).toBe(ROW_CUT);
        expect(pickOfKey('copy-relative')).toBe(ROW_COPY_RELATIVE);
        expect(pickOfKey('open-preview')).toBeNull();
        expect(pickOfKey('toggle')).toBeNull();
        expect(pickOfKey('undo')).toBeNull();
    });

    // Revert: take the first chord of another action in chordHint.
    it('audits that reads the hint of the first chord that asks for the action', () => {
        const map = filesKeymap(true);
        const write = keyWords((k) => real(k), true);

        expect(chordHint(map, 'rename', write)).toBe('Enter');
        expect(
            keyPlan('rename', { root: false, kind: 'file', acting: 1, actable: 1, cutting: false })
        ).toBe('rename');
    });
});

describe('the facts of a row', () => {
    const explorer = { clipboard: () => null, compareFile: () => null };

    // Revert: take the root test from `depth` out of rowFacts.
    it('audits that calls a depth-zero row a root and offers its removal when the reader added it', () => {
        const root = row('', 'dir', { root: 'notes', depth: 0 });

        expect(rowFacts(root, ['hub'], false, explorer, new Map()).kind).toBe('root');
        expect(rowFacts(root, ['hub'], false, explorer, new Map()).removable).toBe(true);
        expect(rowFacts(root, ['notes'], false, explorer, new Map()).removable).toBe(false);
        expect(
            rowMenu(rowFacts(root, [], false, explorer, new Map()), words).map((one) => one.id)
        ).toContain(ROW_REMOVE_ROOT);
    });

    // Revert: ignore the selection handed in.
    it('audits that carries the selection and its file count into the menu', () => {
        const made = rowFacts(
            row('a.md'),
            [],
            false,
            explorer,
            new Map(),
            { size: 3, files: 2 },
            { copy: 'x' }
        );

        expect(made).toMatchObject({ selection: 3, selectedFiles: 2, hints: { copy: 'x' } });
    });
});

describe('the picks over a selection', () => {
    let calls: unknown[][];
    let said: string[];
    let asked: AskedQuestion[];
    let answer: boolean;
    let confirmDelete: boolean;
    let trashed: Outcome;

    function setup() {
        const explorer = {
            copy: (items: unknown) => calls.push(['copy', items]),
            cut: (items: unknown) => calls.push(['cut', items]),
            paste: vi.fn(),
            trash: (items: unknown) => {
                calls.push(['trash', items]);
                return Promise.resolve(trashed);
            },
            upload: vi.fn(),
            selectForCompare: vi.fn(),
            compareFile: () => null,
            clipboard: () => null
        };
        const deps: RowOpsDeps = {
            explorer,
            say: (note) => said.push(note),
            confirm: (question) => {
                asked.push(question);
                return Promise.resolve(answer);
            },
            choose: () => Promise.resolve([]),
            startName: vi.fn(),
            openCompare: vi.fn(),
            draftOf: (one) => one.path === 'dirty.md',
            acting: () => [row('f1'), row('f2'), row('dirty.md')],
            confirmDelete: () => confirmDelete
        };
        return rowOpsPicker(deps, words);
    }

    beforeEach(() => {
        calls = [];
        said = [];
        asked = [];
        answer = true;
        confirmDelete = true;
        trashed = { ok: true, paths: [] };
    });

    const settle = (): Promise<void> => new Promise((resolve) => setTimeout(resolve, 0));

    // Revert: ask once per row in remove().
    it('audits that asks once for the three files and sends one trash with all three paths', async () => {
        const pick = setup();
        pick(row('f1'), ROW_DELETE);
        await settle();

        expect(asked).toEqual([
            {
                kind: 'delete-many',
                names: ['f1', 'f2', 'dirty.md'],
                files: 3,
                folders: 0,
                unsaved: true
            }
        ]);
        expect(calls).toEqual([
            [
                'trash',
                [
                    { root: 'hub', path: 'f1' },
                    { root: 'hub', path: 'f2' },
                    { root: 'hub', path: 'dirty.md' }
                ]
            ]
        ]);
    });

    // Revert: send the trash after a no.
    it('audits that sends nothing when the question is answered no', async () => {
        answer = false;
        setup()(row('f1'), ROW_DELETE);
        await settle();

        expect(calls).toEqual([]);
    });

    // Revert: ignore confirmDelete.
    it('goes to the Trash without the question while `files.confirm_delete` is off', async () => {
        confirmDelete = false;
        setup()(row('f1'), ROW_DELETE);
        await settle();

        expect(asked).toEqual([]);
        expect(calls[0]?.[0]).toBe('trash');
    });

    // Revert: let a root row be acted on.
    it('leaves a root, the `..` line and a name being typed out of what Cut acts on', () => {
        const deps: RowOpsDeps = {
            explorer: {
                copy: vi.fn(),
                cut: (items: unknown) => calls.push(['cut', items]),
                paste: vi.fn(),
                trash: vi.fn(),
                upload: vi.fn(),
                selectForCompare: vi.fn(),
                compareFile: () => null,
                clipboard: () => null
            },
            say: vi.fn(),
            confirm: () => Promise.resolve(true),
            choose: () => Promise.resolve([]),
            startName: vi.fn(),
            openCompare: vi.fn(),
            draftOf: () => false,
            acting: () => [
                row('', 'dir', { depth: 0 }),
                row('up', 'dir', { up: true }),
                row('x', 'file', { editing: 'new' }),
                row('ok')
            ]
        };
        rowOpsPicker(deps, words)(row('ok'), ROW_CUT);

        expect(calls).toEqual([['cut', [{ root: 'hub', path: 'ok' }]]]);
        expect(ROW_COPY).toBe('copy');
    });
});

describe('the words of the questions', () => {
    // Revert: say "files" for a selection that holds folders.
    it('audits that says files, directories, or both by what is selected, with the count', () => {
        const q = (files: number, folders: number): string =>
            askedWords(
                { kind: 'delete-many', names: ['a', 'b', 'c'], files, folders, unsaved: false },
                real
            ).message;

        expect(q(3, 0)).toBe('Are you sure you want to delete the following 3 files?');
        expect(q(0, 3)).toBe(
            'Are you sure you want to delete the following 3 directories and their contents?'
        );
        expect(q(1, 2)).toBe(
            'Are you sure you want to delete the following 3 files and directories and their contents?'
        );
    });

    // Revert: leave the names out of the detail.
    it('audits that lists the names, ten at most, and the count of the rest', () => {
        const names = Array.from({ length: 12 }, (_one, at) => `n${String(at)}`);
        const detail = askedWords(
            { kind: 'delete-many', names, files: 12, folders: 0, unsaved: true },
            words
        ).detail;

        expect(detail.split('\n').slice(0, 10)).toEqual(names.slice(0, 10));
        expect(detail).toContain('@files.names_more(2)');
        expect(detail).toContain('@files.delete_detail_unsaved');
    });

    // Revert: make every question forgettable.
    it('audits that lets only a delete to the Trash be silenced', () => {
        const forgettable = (question: AskedQuestion): boolean =>
            askedWords(question, words).forgettable;

        expect(forgettable({ kind: 'delete', name: 'a', folder: false, unsaved: false })).toBe(
            true
        );
        expect(
            forgettable({
                kind: 'delete-many',
                names: ['a', 'b'],
                files: 2,
                folders: 0,
                unsaved: false
            })
        ).toBe(true);
        expect(forgettable({ kind: 'permanent', name: 'a' })).toBe(false);
        expect(forgettable({ kind: 'move', names: ['a'], into: 'd' })).toBe(false);
        expect(forgettable({ kind: 'undo-delete' })).toBe(false);
    });

    // Revert: ask the move question with the folder's path instead of its name.
    it('audits that asks a move by the name moved and the folder it goes into, and a drag of several by their count', () => {
        expect(askedWords({ kind: 'move', names: ['a.txt'], into: 'd' }, words).message).toBe(
            '@files.move_question(a.txt,d)'
        );
        expect(askedWords({ kind: 'move', names: ['a', 'b'], into: 'd' }, words).message).toBe(
            '@files.move_question_many(2,d)'
        );
    });

    // Revert: draw the undo question with the delete label empty.
    it('audits that asks the undo of a delete before it runs', () => {
        const asked = askedWords({ kind: 'undo-delete' }, words);

        expect(asked.message).toBe('@files.undo_question(@files.undo_delete_label)');
        expect(asked.confirm).toBe('@files.undo_button');
    });
});

describe('the drops of the tree', () => {
    let drops: unknown[][];
    let uploads: unknown[][];
    let said: string[];
    let questions: AskedQuestion[];
    let answer: boolean;

    function setup() {
        return rowDropper(
            {
                explorer: {
                    drop: (items, into, copy) => {
                        drops.push([items, into, copy]);
                        return Promise.resolve({ ok: true, paths: [] });
                    },
                    upload: (into, name) => {
                        uploads.push([into, name]);
                        return Promise.resolve({ ok: true, paths: [] });
                    }
                },
                say: (note) => said.push(note),
                confirm: (question) => {
                    questions.push(question);
                    return Promise.resolve(answer);
                }
            },
            words
        );
    }

    beforeEach(() => {
        drops = [];
        uploads = [];
        said = [];
        questions = [];
        answer = true;
        vi.stubGlobal(
            'FileReader',
            class {
                result = 'data:application/octet-stream;base64,eA==';
                onload: (() => void) | null = null;
                onerror: (() => void) | null = null;
                readAsDataURL(): void {
                    this.onload?.();
                }
            }
        );
    });

    const file = (name: string): { name: string; directory: boolean; file: File } => ({
        name,
        directory: false,
        file: new File(['x'], name)
    });

    // Revert: move without the question.
    it('audits that asks before a move and moves after a yes', async () => {
        await setup().rows(
            [{ root: 'hub', path: 'a.txt', kind: 'file' }],
            { root: 'hub', path: 'd', kind: 'dir' },
            false,
            false
        );

        expect(questions).toEqual([{ kind: 'move', names: ['a.txt'], into: 'd' }]);
        expect(drops).toEqual([
            [[{ root: 'hub', path: 'a.txt' }], { root: 'hub', path: 'd' }, false]
        ]);
    });

    // Revert: send the drop after a no.
    it('audits that does nothing after a no', async () => {
        answer = false;
        await setup().rows(
            [{ root: 'hub', path: 'a.txt', kind: 'file' }],
            { root: 'hub', path: 'd', kind: 'dir' },
            false,
            false
        );

        expect(drops).toEqual([]);
    });

    // Revert: ask before a copy.
    it('audits that copies at once with Option held, without the question', async () => {
        await setup().rows(
            [{ root: 'hub', path: 'a.txt', kind: 'file' }],
            { root: 'hub', path: 'd', kind: 'dir' },
            true,
            false
        );

        expect(questions).toEqual([]);
        expect(drops[0]?.[2]).toBe(true);
    });

    // Revert: drop onto the row's own folder.
    it('audits that asks nothing and sends nothing for a drop that comes to nothing', async () => {
        await setup().rows(
            [{ root: 'hub', path: 'd/a.txt', kind: 'file' }],
            { root: 'hub', path: 'd', kind: 'dir' },
            false,
            false
        );
        await setup().rows(
            [{ root: 'hub', path: 'x', kind: 'dir' }],
            { root: 'hub', path: 'x/y', kind: 'dir' },
            false,
            false
        );

        expect(questions).toEqual([]);
        expect(drops).toEqual([]);
    });

    // Revert: upload on a typing row.
    it('audits that uploads the two files of a Finder drop into the folder and says how many landed', async () => {
        await setup().outside(
            [file('a.txt'), file('b.txt')],
            { root: 'hub', path: 'd', kind: 'dir' },
            false
        );

        expect(uploads).toEqual([
            [{ root: 'hub', path: 'd' }, 'a.txt'],
            [{ root: 'hub', path: 'd' }, 'b.txt']
        ]);
        expect(said[0]).toContain('@files.upload_done(2)');
    });

    // Revert: upload the folder too.
    it('audits that refuses a Finder folder with its name and uploads nothing for it', async () => {
        await setup().outside(
            [{ name: 'pics', directory: true, file: null }],
            { root: 'hub', path: 'd', kind: 'dir' },
            false
        );

        expect(uploads).toEqual([]);
        expect(said).toEqual(['@files.drop_folder_refused(pics)']);
    });

    // Revert: drop onto a name being typed.
    it('audits that does nothing for a Finder drop onto a row being typed in', async () => {
        await setup().outside([file('a.txt')], { root: 'hub', path: 'd', kind: 'dir' }, true);

        expect(uploads).toEqual([]);
        expect(said).toEqual([]);
    });

    // Revert: lands a file dropped on a file in the file itself.
    it('audits that lands a Finder drop on a file in the folder holding the file', async () => {
        await setup().outside(
            [file('a.txt')],
            { root: 'hub', path: 'd/x.md', kind: 'file' },
            false
        );

        expect(uploads[0]?.[0]).toEqual({ root: 'hub', path: 'd' });
    });
});

describe('the upload of files', () => {
    // Revert: upload a file over the limit.
    it('audits that refuses a file over the limit with its name and the reason, and goes on with the rest', async () => {
        const uploaded: string[] = [];
        vi.stubGlobal(
            'FileReader',
            class {
                result = 'data:application/octet-stream;base64,eA==';
                onload: (() => void) | null = null;
                onerror: (() => void) | null = null;
                readAsDataURL(): void {
                    this.onload?.();
                }
            }
        );
        const big = new File(['x'], 'big.bin');
        Object.defineProperty(big, 'size', { value: MAX_UPLOAD_BYTES + 1 });
        const send = uploader(
            {
                explorer: {
                    upload: (_into, name) => {
                        uploaded.push(name);
                        return Promise.resolve({ ok: true, paths: [] });
                    }
                },
                confirm: () => Promise.resolve(true)
            },
            words
        );
        const line = await send({ root: 'hub', path: 'd' }, [big, new File(['y'], 'ok.txt')]);

        expect(uploaded).toEqual(['ok.txt']);
        expect(line).toContain('@files.upload_done(1)');
        expect(line).toContain('@files.upload_refused(big.bin,@files.refused_too_large)');
        vi.unstubAllGlobals();
    });
});
