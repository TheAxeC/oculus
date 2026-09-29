// Layer 3, view test. The Files view's right-click menu on a row, built by
// views/sources/files/tree/row-menu.ts: which items a file, a folder and a root offer, in VS Code's
// order with a rule between its groups, and the two paths Copy Path and Copy Relative Path put on
// the clipboard; and what a pick runs, over the calls a view hands the picker.
//
// The words are a stand-in `t` that answers each key as `@key`, so an item is asserted by the key
// it is worded by.
//
// What this does NOT cover: the menu opened by a right-click or by Shift+F10 on a row, and each
// pick's effect in a browser (a tab opened beside, a shell drawn, the clipboard written), which
// need a DOM and are seen at the look.

import { describe, expect, it, vi } from 'vitest';
import { openShell } from '../../../../src/lib/state/shared/stores/shell.ts';
import {
    ROW_COPY_PATH,
    ROW_COPY_RELATIVE,
    ROW_FIND,
    ROW_REVEAL,
    ROW_TERMINAL,
    rowMenu,
    rowPaths,
    rowPicker,
    type RowMenuFacts,
    type RowPickDeps
} from '../../../../src/lib/views/sources/files/tree/row-menu.ts';
import type { MenuItem } from '../../../../src/lib/ui/menu/menu-items.ts';
import type { TreeRow } from '../../../../src/lib/state/sources/fs.ts';

// The one start-and-show path of a shell, watched so a case sees the picker reach it.
vi.mock('../../../../src/lib/state/shared/stores/shell.ts', { spy: true });

const words = (key: string, ...args: (string | number)[]): string =>
    args.length === 0 ? `@${key}` : `@${key}(${args.join(',')})`;

/** Each item as its label, with `|` before an item that draws a rule above it. */
function drawn(items: MenuItem[]): string[] {
    return items.map((item) => `${item.rule === true ? '| ' : ''}${item.label}`);
}

function file(path: string): RowMenuFacts {
    return { kind: 'file', path, removable: true, addable: true };
}

describe('the Files row menu', () => {
    // Revert: put Download... in the same group as Open in Integrated Terminal in rowMenu.
    it('audits that offers a Markdown file every item it has, in order, with the rules between groups', () => {
        expect(drawn(rowMenu(file('notes/a.md'), words))).toEqual([
            '@files.menu_open_side',
            '| @files.menu_terminal',
            '| @files.menu_download',
            '| @files.menu_copy_path',
            '@files.menu_copy_relative',
            '| @files.menu_preview'
        ]);
    });

    // Revert: offer Open Preview on every file in rowMenu.
    it('audits that offers a file that is no Markdown the same items without Open Preview', () => {
        expect(drawn(rowMenu(file('src/x.py'), words))).toEqual([
            '@files.menu_open_side',
            '| @files.menu_terminal',
            '| @files.menu_download',
            '| @files.menu_copy_path',
            '@files.menu_copy_relative'
        ]);
    });

    // Revert: offer Find in Workspace... on a folder as on a root.
    it('audits that offers a folder its reveal, its shell and its two paths', () => {
        const items = rowMenu(
            { kind: 'dir', path: 'notes', removable: true, addable: true },
            words
        );
        expect(items.map((item) => item.label)).toEqual([
            '@files.menu_reveal',
            '@files.menu_terminal',
            '@files.menu_copy_path',
            '@files.menu_copy_relative'
        ]);
    });

    // Revert: offer Remove Folder from Workspace whatever `removable` says.
    it('audits that offers a configured root no removal, and a root the reader added its removal last', () => {
        const fixed = rowMenu({ kind: 'root', path: '', removable: false, addable: true }, words);
        expect(fixed.map((item) => item.label)).toEqual([
            '@files.menu_reveal',
            '@files.menu_terminal',
            '@files.menu_find',
            '@files.menu_copy_path',
            '@files.menu_copy_relative',
            '@files.menu_add_root'
        ]);
        const added = rowMenu({ kind: 'root', path: '', removable: true, addable: true }, words);
        expect(added.map((item) => item.label)).toEqual([
            ...fixed.map((item) => item.label),
            '@files.menu_remove_root'
        ]);
    });

    // Revert: offer Add Folder to Workspace... whatever `addable` says.
    it('audits that offers no Add Folder to Workspace... while the add-root form is open', () => {
        const open = rowMenu({ kind: 'root', path: '', removable: true, addable: false }, words);
        expect(open.map((item) => item.label)).toEqual([
            '@files.menu_reveal',
            '@files.menu_terminal',
            '@files.menu_find',
            '@files.menu_copy_path',
            '@files.menu_copy_relative',
            '@files.menu_remove_root'
        ]);
    });

    // Revert: give Copy Relative Path the id ROW_COPY_PATH.
    it('audits that gives every item of every row an id of its own', () => {
        for (const facts of [
            file('notes/a.md'),
            { kind: 'dir' as const, path: 'notes', removable: true, addable: true },
            { kind: 'root' as const, path: '', removable: true, addable: true }
        ]) {
            const ids = rowMenu(facts, words).map((item) => item.id);
            expect(new Set(ids).size).toBe(ids.length);
            expect(ids.every((id) => id !== '')).toBe(true);
        }
    });
});

describe('the two paths a row copies', () => {
    // Revert: make rowPaths return the absolute path as the relative one.
    it('audits that copies a file under a root as its absolute path and as its path under the root', () => {
        expect(rowPaths('/tmp/r', 'notes/a.md')).toEqual({
            absolute: '/tmp/r/notes/a.md',
            relative: 'notes/a.md'
        });
    });

    // Revert: make rowPaths return the empty path for the root.
    it('audits that copies the root itself as its folder and as `.`', () => {
        expect(rowPaths('/tmp/r', '')).toEqual({ absolute: '/tmp/r', relative: '.' });
        expect(rowPaths('/tmp/r/', '')).toEqual({ absolute: '/tmp/r', relative: '.' });
    });
});

describe('what a pick from a row menu runs', () => {
    const root: TreeRow = {
        root: 'r',
        path: '',
        name: 'r',
        kind: 'dir',
        size: 0,
        depth: 0,
        open: true
    };
    const folder: TreeRow = { ...root, path: 'notes', name: 'notes', depth: 1 };
    const note: TreeRow = { ...root, path: 'notes/a.md', name: 'a.md', kind: 'file', depth: 2 };

    /**
     * A picker over fakes that record each call, the folder answering as `answer` and a shell
     * refused with `refusal` when it is not empty.
     */
    function picker(
        answer: { ok: boolean; error?: string },
        refusal = ''
    ): {
        pick: (row: TreeRow, id: string) => void;
        calls: string[];
    } {
        const calls: string[] = [];
        const deps = {
            dirOf: (key: string) => (key === 'r' ? '/tmp/r' : ''),
            openFolder: (dir: string) => {
                calls.push(`openFolder:${dir}`);
                return Promise.resolve(answer);
            },
            openFile: (key: string, path: string) => {
                calls.push(`openFile:${key},${path}`);
                return Promise.resolve(answer);
            },
            startTerminal: (kind: string, cwd: string) => {
                calls.push(`start:${kind},${cwd}`);
                return Promise.resolve(
                    refusal === ''
                        ? { ok: true, id: 'term-1', error: '' }
                        : { ok: false, id: '', error: refusal }
                );
            },
            showTerminal: (id: string, label: string) => calls.push(`show:${id},${label}`),
            openView: (view: string) => {
                calls.push(`openView:${view}`);
                return 'tab-1';
            },
            setSearchState: (id: string, state: unknown) =>
                calls.push(`search:${id},${JSON.stringify(state)}`),
            copy: (text: string) => calls.push(`copy:${text}`),
            say: (note: string) => calls.push(`say:${note}`)
        } as unknown as RowPickDeps;
        return { pick: rowPicker(deps, words), calls };
    }

    async function settled(): Promise<void> {
        for (let turn = 0; turn < 5; turn += 1) await Promise.resolve();
    }

    // Revert: reveal every row through openFile(row.root, row.path) in rowPicker.
    it('audits that reveals a root by its folder and a folder by its root and path', async () => {
        const { pick, calls } = picker({ ok: true });
        pick(root, ROW_REVEAL);
        pick(folder, ROW_REVEAL);
        await settled();
        expect(calls).toEqual(['openFolder:/tmp/r', 'openFile:r,notes']);
    });

    // Revert: drop the `say` call from reveal in rowPicker.
    it('audits that says a refused reveal on the refusal line', async () => {
        const { pick, calls } = picker({ ok: false, error: 'no Finder' });
        pick(folder, ROW_REVEAL);
        await settled();
        expect(calls.at(-1)).toBe('say:@files.reveal_failed(no Finder)');
    });

    // Revert: start the shell in `dir` instead of shellFolder(dir, row).
    it('audits that starts a shell in the folder of a file and shows it by that folder name', async () => {
        const { pick, calls } = picker({ ok: true });
        pick(note, ROW_TERMINAL);
        await settled();
        expect(calls).toEqual(['start:shell,/tmp/r/notes', 'show:term-1,notes']);
    });

    // Revert: start and show the shell in rowPicker with its own copy of openShell's body.
    it('audits that starts the shell through the one start-and-show path', async () => {
        const { pick } = picker({ ok: true });
        vi.mocked(openShell).mockClear();
        pick(note, ROW_TERMINAL);
        await settled();
        expect(vi.mocked(openShell)).toHaveBeenCalledTimes(1);
        expect(vi.mocked(openShell).mock.calls[0].slice(1)).toEqual(['/tmp/r/notes', 'notes']);
    });

    // Revert: drop the `say` call after a refused shell in rowPicker.
    it('audits that says a refused shell on the refusal line', async () => {
        const { pick, calls } = picker({ ok: true }, 'no tmux');
        pick(note, ROW_TERMINAL);
        await settled();
        expect(calls).toEqual(['start:shell,/tmp/r/notes', 'say:no tmux']);
    });

    // Revert: copy paths.absolute for ROW_COPY_RELATIVE in rowPicker.
    it('audits that copies the absolute and the relative path, and opens Search on the root', () => {
        const { pick, calls } = picker({ ok: true });
        pick(note, ROW_COPY_PATH);
        pick(note, ROW_COPY_RELATIVE);
        pick(root, ROW_COPY_RELATIVE);
        pick(root, ROW_FIND);
        expect(calls).toEqual([
            'copy:/tmp/r/notes/a.md',
            'copy:notes/a.md',
            'copy:.',
            'openView:search',
            'search:tab-1,{"root":"r"}'
        ]);
    });
});
