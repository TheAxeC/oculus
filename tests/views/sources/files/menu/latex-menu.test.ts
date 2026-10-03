// Layer 3, view test. Open LaTeX in the Files row menu: which rows offer it (a `.tex` file, and a
// folder or root whose held listing has a `.tex` file directly in it), where it sits in the menu,
// and which folder the pick opens the LaTeX view on. The fact is read from the entries the fs store
// holds, never from a request, so a case hands the listing in as a function.
//
// What this does NOT cover: the menu opened by a right-click, and the view the pick opens, which
// need a DOM; tests/views/academic/latex.test.ts draws the view.

import { describe, expect, it, vi } from 'vitest';
import {
    ROW_LATEX,
    rowFacts,
    rootNameIn,
    rowMenu,
    rowPicker,
    type RowPickDeps
} from '../../../../../src/lib/views/sources/files/tree/menu/row-menu.ts';
import type { FsEntry, TreeRow } from '../../../../../src/lib/state/sources/fs.ts';
import type { MenuItem } from '../../../../../src/lib/ui/menu/menu-items.ts';

const words = (key: string): string => `@${key}`;

const entry = (name: string, kind: FsEntry['kind'] = 'file'): FsEntry => ({
    name,
    kind,
    size: 1,
    mtime: 1
});

const ROOT: TreeRow = {
    root: 'docs',
    path: '',
    name: 'Docs',
    kind: 'dir',
    size: 0,
    depth: 0,
    open: true
};
const FOLDER: TreeRow = { ...ROOT, path: 'proposal', name: 'proposal', depth: 1 };
const TEX: TreeRow = { ...ROOT, path: 'proposal/c.tex', name: 'c.tex', kind: 'file', depth: 2 };
const NOTE: TreeRow = { ...TEX, path: 'proposal/a.md', name: 'a.md' };

const explorer = { clipboard: () => null, compareFile: () => null };

/** The fact for a row, over a held listing keyed by `root:path`. */
function latexFact(row: TreeRow, held: Record<string, FsEntry[]> = {}): boolean | undefined {
    const entries = (root: string, path: string): FsEntry[] | null =>
        held[`${root}:${path}`] ?? null;
    return rowFacts(row, [], false, explorer, new Map(), undefined, {}, entries).latex;
}

/** Each item as its label, with `|` before an item that draws a rule above it. */
function drawn(items: MenuItem[]): string[] {
    return items.map((item) => `${item.rule === true ? '| ' : ''}${item.label}`);
}

describe('which rows offer Open LaTeX', () => {
    // Revert: read `latex` as false for a file in rowFacts of tree/menu/row-menu.ts.
    it('audits that it is offered on a .tex file and not on a Markdown file', () => {
        expect(latexFact(TEX)).toBe(true);
        expect(latexFact({ ...TEX, path: 'proposal/C.TEX', name: 'C.TEX' })).toBe(true);
        expect(latexFact(NOTE)).toBe(false);
    });

    // Revert: read `latex` as false for a folder in rowFacts of tree/menu/row-menu.ts.
    it('audits that it is offered on a folder or root whose held listing has a .tex file, and not otherwise', () => {
        const held = {
            'docs:proposal': [entry('notes.md'), entry('c.tex')],
            'docs:empty': [entry('notes.md'), entry('sub', 'dir')],
            'docs:': [entry('top.tex')],
            'docs:folderonly': [entry('x.tex', 'dir')]
        };

        expect(latexFact(FOLDER, held)).toBe(true);
        expect(latexFact({ ...FOLDER, path: 'empty' }, held)).toBe(false);
        expect(latexFact(ROOT, held)).toBe(true);
        expect(latexFact({ ...FOLDER, path: 'folderonly' }, held)).toBe(false);
    });

    it('audits that it is not offered on a folder whose listing is not held, since the fact asks for nothing', () => {
        expect(latexFact(FOLDER, {})).toBe(false);
    });
});

describe('where Open LaTeX sits in the menu', () => {
    const base = {
        removable: false,
        addable: false,
        clipboard: false,
        compareWith: null,
        selection: 1,
        markdown: false
    };

    // Revert: put the latex group before the reveal group in rowMenu.
    it('audits that it is a group of its own right after Reveal in Finder and the terminal, on every kind of row', () => {
        const file = drawn(rowMenu({ ...base, kind: 'file', path: 'a.tex', latex: true }, words));
        const dir = drawn(rowMenu({ ...base, kind: 'dir', path: 'a', latex: true }, words));
        const root = drawn(rowMenu({ ...base, kind: 'root', path: '', latex: true }, words));

        expect(file.slice(1, 4)).toEqual([
            '| @files.menu_reveal',
            '@files.menu_terminal',
            '| @files.menu_latex'
        ]);
        expect(dir.slice(2, 5)).toEqual([
            '| @files.menu_reveal',
            '@files.menu_terminal',
            '| @files.menu_latex'
        ]);
        expect(root.slice(2, 5)).toEqual([
            '| @files.menu_reveal',
            '@files.menu_terminal',
            '| @files.menu_latex'
        ]);
    });

    it('audits that it is not in the menu of a row without the fact, nor in the menu for a selection', () => {
        const none = rowMenu({ ...base, kind: 'file', path: 'a.md' }, words);
        const many = rowMenu(
            { ...base, kind: 'file', path: 'a.tex', latex: true, selection: 3 },
            words
        );

        // A Markdown file carries no LaTeX fact, so its menu has no entry for the view.
        expect(none.map((one) => one.id)).not.toContain(ROW_LATEX);
        // A selection of several rows has no single folder to open the view on.
        expect(many.map((one) => one.id)).not.toContain(ROW_LATEX);
    });
});

describe('what the tree calls a root', () => {
    // Revert: answer the root key in rootNameIn of tree/menu/row-menu.ts.
    it('audits that is the name of the root row, else the key', () => {
        const up: TreeRow = { ...ROOT, root: 'other', name: '..', up: true };
        const rows = [ROOT, FOLDER, TEX, up];

        expect(rootNameIn(rows, 'docs')).toBe('Docs');
        expect(rootNameIn(rows, 'other')).toBe('other');
        expect(rootNameIn([], 'docs')).toBe('docs');
    });

    it('audits that is the key when the tree is drawn from a folder below the root', () => {
        expect(rootNameIn([{ ...ROOT, path: 'proposal', name: 'proposal' }], 'docs')).toBe('docs');
    });
});

describe('what the Open LaTeX pick opens', () => {
    /** A picker whose view opens are recorded and whose root of a file is the given answer. */
    function picker(found: { root: string; path: string; main: string } | null): {
        pick: (row: TreeRow, id: string) => void;
        opened: ReturnType<typeof vi.fn>;
        rootOf: ReturnType<typeof vi.fn>;
    } {
        const opened = vi.fn(() => 'tab-1');
        const rootOf = vi.fn(() => Promise.resolve(found));
        const deps = {
            dirOf: () => '/tmp/docs',
            rootName: (root: string) => (root === 'docs' ? 'Docs' : root),
            openView: opened,
            rootOf
        } as unknown as RowPickDeps;
        return { pick: rowPicker(deps, words), opened, rootOf };
    }

    const settled = async (): Promise<void> => {
        for (let turn = 0; turn < 5; turn += 1) await Promise.resolve();
    };

    it('audits that the view opens on the folder of the main file a .tex file builds through', async () => {
        const { pick, opened, rootOf } = picker({ root: 'docs', path: 'thesis', main: 'main.tex' });

        pick(TEX, ROW_LATEX);
        await settled();

        expect(rootOf).toHaveBeenCalledExactlyOnceWith('docs', 'proposal/c.tex');
        expect(opened).toHaveBeenCalledExactlyOnceWith('latex', {
            root: 'docs',
            path: 'thesis',
            label: 'thesis'
        });
    });

    it("opens it on the file's own folder when the file builds through no main file", async () => {
        const { pick, opened } = picker(null);

        pick(TEX, ROW_LATEX);
        await settled();

        expect(opened).toHaveBeenCalledExactlyOnceWith('latex', {
            root: 'docs',
            path: 'proposal',
            label: 'proposal'
        });
    });

    it('audits that it opens on a folder itself without asking for a root, and on a root by its own name', async () => {
        const { pick, opened, rootOf } = picker(null);

        pick(FOLDER, ROW_LATEX);
        pick(ROOT, ROW_LATEX);
        await settled();

        expect(rootOf).not.toHaveBeenCalled();
        expect(opened.mock.calls).toEqual([
            ['latex', { root: 'docs', path: 'proposal', label: 'proposal' }],
            ['latex', { root: 'docs', path: '', label: 'Docs' }]
        ]);
    });

    // Revert: write the root key as the label of a root's own tab in latex() of row-menu.ts.
    it('audits that writes the same label for a root from the root row and from a .tex file at its top', async () => {
        const { pick, opened } = picker({ root: 'docs', path: '', main: 'top.tex' });
        const top: TreeRow = { ...TEX, path: 'top.tex', name: 'top.tex' };

        pick(ROOT, ROW_LATEX);
        pick(top, ROW_LATEX);
        await settled();

        const labels = opened.mock.calls.map((call) => (call as unknown[])[1]);
        expect(labels).toEqual([
            { root: 'docs', path: '', label: 'Docs' },
            { root: 'docs', path: '', label: 'Docs' }
        ]);
    });

    it('audits that opens one view for a pick made twice on the same file', async () => {
        const { pick, opened, rootOf } = picker({ root: 'docs', path: 'thesis', main: 'main.tex' });

        pick(TEX, ROW_LATEX);
        pick(TEX, ROW_LATEX);
        await settled();

        expect(rootOf).toHaveBeenCalledTimes(2);
        expect(opened).toHaveBeenCalledOnce();
    });

    // Revert: take the newest-pick check out of latex() in row-menu.ts.
    it('audits that opens only the newest pick when the root of the first one is answered after the second', async () => {
        const answers: ((found: { root: string; path: string; main: string }) => void)[] = [];
        const opened = vi.fn(() => 'tab-1');
        const deps = {
            dirOf: () => '/tmp/docs',
            rootName: (root: string) => root,
            openView: opened,
            rootOf: () =>
                new Promise((resolve) => {
                    answers.push(resolve);
                })
        } as unknown as RowPickDeps;
        const pick = rowPicker(deps, words);

        pick(TEX, ROW_LATEX);
        pick({ ...TEX, path: 'other/d.tex', name: 'd.tex' }, ROW_LATEX);
        answers[1]({ root: 'docs', path: 'other', main: 'main.tex' });
        await settled();
        answers[0]({ root: 'docs', path: 'proposal', main: 'main.tex' });
        await settled();

        expect(opened).toHaveBeenCalledExactlyOnceWith('latex', {
            root: 'docs',
            path: 'other',
            label: 'other'
        });
    });
});
