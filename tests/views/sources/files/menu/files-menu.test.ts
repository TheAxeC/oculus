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

import { beforeAll, describe, expect, it, vi } from 'vitest';
import { languageMap } from '../../../../../src/lib/data/helpers/files/languages.ts';
import { engineDir, loadConfig, textCatalog } from '../../../../../src/lib/data/sources/config.ts';
import { setCatalog } from '../../../../../src/lib/state/shared/words/text.ts';
import { openShell } from '../../../../../src/lib/state/shared/stores/shell.ts';
import {
    ROW_COPY_PATH,
    ROW_COPY_RELATIVE,
    ROW_FIND,
    ROW_RUN,
    ROW_REVEAL,
    ROW_TERMINAL,
    rowFacts,
    rowMenu,
    rowPaths,
    rowPicker,
    type RowMenuFacts,
    type RowPickDeps
} from '../../../../../src/lib/views/sources/files/tree/menu/row-menu.ts';
import type { MenuItem } from '../../../../../src/lib/ui/menu/menu-items.ts';
import type { TreeRow } from '../../../../../src/lib/state/sources/fs.ts';
import type { ProjectCommand } from '../../../../../src/lib/state/sessions/terminal/commands.svelte.ts';

// The one start-and-show path of a shell, watched so a case sees the picker reach it.
vi.mock('../../../../../src/lib/state/shared/stores/shell.ts', { spy: true });

const words = (key: string, ...args: (string | number)[]): string =>
    args.length === 0 ? `@${key}` : `@${key}(${args.join(',')})`;

/** Each item as its label, with `|` before an item that draws a rule above it. */
function drawn(items: MenuItem[]): string[] {
    return items.map((item) => `${item.rule === true ? '| ' : ''}${item.label}`);
}

/** The facts of a row with the file operations' three at their defaults. */
function facts(
    kind: RowMenuFacts['kind'],
    path: string,
    changes: Partial<RowMenuFacts> = {}
): RowMenuFacts {
    return {
        kind,
        path,
        removable: true,
        addable: true,
        clipboard: false,
        compareWith: null,
        selection: 1,
        markdown: path.endsWith('.md'),
        ...changes
    };
}

function file(path: string): RowMenuFacts {
    return facts('file', path);
}

describe('the Files row menu', () => {
    // Revert: put Download... in the same group as Open in Integrated Terminal in rowMenu.
    it('audits that offers a Markdown file every item it has, in order, with the rules between groups', () => {
        expect(drawn(rowMenu(file('notes/a.md'), words))).toEqual([
            '@files.menu_open_side',
            '| @files.menu_reveal',
            '@files.menu_terminal',
            '| @files.menu_select_compare',
            '| @files.menu_cut',
            '@files.menu_copy',
            '| @files.menu_download',
            '| @files.menu_copy_path',
            '@files.menu_copy_relative',
            '| @files.menu_preview',
            '| @files.menu_rename',
            '@files.menu_delete'
        ]);
    });

    // Revert: offer Open Preview on every file in rowMenu.
    it('audits that offers a file that is no Markdown the same items without Open Preview', () => {
        expect(drawn(rowMenu(file('src/x.py'), words))).toEqual([
            '@files.menu_open_side',
            '| @files.menu_reveal',
            '@files.menu_terminal',
            '| @files.menu_select_compare',
            '| @files.menu_cut',
            '@files.menu_copy',
            '| @files.menu_download',
            '| @files.menu_copy_path',
            '@files.menu_copy_relative',
            '| @files.menu_rename',
            '@files.menu_delete'
        ]);
    });

    // Revert: offer Find in Folder... on a folder as on a root only.
    it('audits that offers a folder its new items, its reveal and shell, Find in Folder..., the clipboard, its upload, its two paths and its changes', () => {
        const items = rowMenu(facts('dir', 'notes'), words);
        expect(items.map((item) => item.label)).toEqual([
            '@files.menu_new_file',
            '@files.menu_new_folder',
            '@files.menu_reveal',
            '@files.menu_terminal',
            '@files.menu_find',
            '@files.menu_cut',
            '@files.menu_copy',
            '@files.menu_paste',
            '@files.menu_upload',
            '@files.menu_copy_path',
            '@files.menu_copy_relative',
            '@files.menu_rename',
            '@files.menu_delete'
        ]);
    });

    // Revert: offer Remove Folder from Workspace whatever `removable` says.
    it('audits that offers a configured root no removal, and a root the reader added its removal last', () => {
        const fixed = rowMenu(facts('root', '', { removable: false }), words);
        expect(fixed.map((item) => item.label)).toEqual([
            '@files.menu_new_file',
            '@files.menu_new_folder',
            '@files.menu_reveal',
            '@files.menu_terminal',
            '@files.menu_find',
            '@files.menu_paste',
            '@files.menu_upload',
            '@files.menu_copy_path',
            '@files.menu_copy_relative',
            '@files.menu_add_root'
        ]);
        const added = rowMenu(facts('root', ''), words);
        expect(added.map((item) => item.label)).toEqual([
            ...fixed.map((item) => item.label),
            '@files.menu_remove_root'
        ]);
    });

    // Revert: offer Add Folder to Workspace... whatever `addable` says.
    it('audits that offers no Add Folder to Workspace... while the add-root form is open', () => {
        const open = rowMenu(facts('root', '', { addable: false }), words);
        expect(open.map((item) => item.label)).toEqual([
            '@files.menu_new_file',
            '@files.menu_new_folder',
            '@files.menu_reveal',
            '@files.menu_terminal',
            '@files.menu_find',
            '@files.menu_paste',
            '@files.menu_upload',
            '@files.menu_copy_path',
            '@files.menu_copy_relative',
            '@files.menu_remove_root'
        ]);
    });

    // Revert: give Copy Relative Path the id ROW_COPY_PATH.
    it('audits that gives every item of every row an id of its own', () => {
        for (const row of [file('notes/a.md'), facts('dir', 'notes'), facts('root', '')]) {
            const ids = rowMenu(row, words).map((item) => item.id);
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
            revealPath: (key: string, path: string) => {
                calls.push(`revealPath:${key},${path}`);
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
            runCommand: (repo: string, name: string, source: string) =>
                calls.push(`run:${repo},${name},${source}`),
            say: (note: string) => calls.push(`say:${note}`)
        } as unknown as RowPickDeps;
        return { pick: rowPicker(deps, words), calls };
    }

    async function settled(): Promise<void> {
        for (let turn = 0; turn < 5; turn += 1) await Promise.resolve();
    }

    // Revert: reveal a file through openFile(row.root, row.path) in rowPicker, which opens it.
    it('audits that reveals a root by its folder and a folder or a file by its root and path', async () => {
        const { pick, calls } = picker({ ok: true });
        pick(root, ROW_REVEAL);
        pick(folder, ROW_REVEAL);
        pick(note, ROW_REVEAL);
        await settled();
        expect(calls).toEqual([
            'openFolder:/tmp/r',
            'revealPath:r,notes',
            'revealPath:r,notes/a.md'
        ]);
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
    it('audits that copies the absolute and the relative path, and opens Search on the root or the folder', () => {
        const { pick, calls } = picker({ ok: true });
        pick(note, ROW_COPY_PATH);
        pick(note, ROW_COPY_RELATIVE);
        pick(root, ROW_COPY_RELATIVE);
        pick(root, ROW_FIND);
        pick(folder, ROW_FIND);
        expect(calls).toEqual([
            'copy:/tmp/r/notes/a.md',
            'copy:notes/a.md',
            'copy:.',
            'openView:search',
            'search:tab-1,{"root":"r","under":""}',
            'openView:search',
            'search:tab-1,{"root":"r","under":"notes"}'
        ]);
    });
});

describe('the Run Command items of a repository row', () => {
    // The tooltip of a command is worded by the real catalog.
    beforeAll(() => setCatalog(textCatalog(loadConfig(engineDir()).config)));

    const build = { name: 'build', run: 'make build', source: 'file' } as unknown as ProjectCommand;
    const test = { name: 'test', run: 'make test', source: 'saved' } as unknown as ProjectCommand;

    const nested = (items: MenuItem[]): MenuItem | undefined =>
        items.find((item) => item.id === ROW_RUN);

    it('audits that a folder and a root with commands offer a Run Command submenu of them, after Find', () => {
        for (const kind of ['dir', 'root'] as const) {
            const items = rowMenu(
                facts(kind, kind === 'root' ? '' : 'notes', { commands: [build, test] }),
                words
            );
            const run = nested(items);
            expect(run?.label).toBe('@commands.run_menu');
            expect(run?.items?.map((item) => item.label)).toEqual(['build', 'test']);
            expect(run?.items?.map((item) => item.id)).toEqual([
                'run-command:file:build',
                'run-command:saved:test'
            ]);
            const flat = items.map((item) => item.id);
            expect(flat.indexOf(ROW_RUN)).toBeGreaterThan(flat.indexOf(ROW_FIND));
        }
    });

    it('audits that a folder or a root with no commands, and a file, offer no Run Command', () => {
        expect(nested(rowMenu(facts('dir', 'notes'), words))).toBeUndefined();
        expect(nested(rowMenu(facts('root', ''), words))).toBeUndefined();
        expect(nested(rowMenu(facts('dir', 'notes', { commands: [] }), words))).toBeUndefined();
        expect(
            nested(rowMenu(facts('file', 'a.md', { commands: [build] }), words))
        ).toBeUndefined();
    });

    it('audits that a pick runs the command of the repository whose absolute path the row has', () => {
        const calls: string[] = [];
        const pick = rowPicker(
            {
                dirOf: (key: string) => (key === 'r' ? '/tmp/r' : ''),
                runCommand: (repo: string, name: string, source: string) =>
                    calls.push(`run:${repo},${name},${source}`)
            } as unknown as RowPickDeps,
            words
        );
        const root: TreeRow = {
            root: 'r',
            path: '',
            name: 'r',
            kind: 'dir',
            size: 0,
            depth: 0,
            open: true
        };
        pick(root, 'run-command:file:build');
        pick({ ...root, path: 'notes', name: 'notes', depth: 1 }, 'run-command:saved:test');
        pick(root, 'run-command:found:npm: dev');
        pick(root, 'run-command:build');
        expect(calls).toEqual([
            'run:/tmp/r,build,file',
            'run:/tmp/r/notes,test,saved',
            'run:/tmp/r,npm: dev,found'
        ]);
    });

    it('audits that a name two sources hold is two items, each with its source in its label', () => {
        const saved = { ...build, run: 'make -j4', source: 'saved' } as unknown as ProjectCommand;
        const run = nested(rowMenu(facts('root', '', { commands: [build, saved] }), words));
        expect(run?.items?.map((item) => item.id)).toEqual([
            'run-command:file:build',
            'run-command:saved:build'
        ]);
        expect(run?.items?.map((item) => item.label)).toEqual(['build (file)', 'build (saved)']);
    });
});

describe('the Files row menu with file operations', () => {
    /** The facts of a row, with the operations' three at their defaults. */
    function facts(kind: RowMenuFacts['kind'], changes: Partial<RowMenuFacts> = {}): RowMenuFacts {
        return {
            kind,
            path: kind === 'root' ? '' : kind === 'dir' ? 'notes' : 'notes/a.md',
            removable: false,
            addable: false,
            clipboard: false,
            compareWith: null,
            selection: 1,
            markdown: false,
            ...changes
        };
    }

    const labelsOf = (items: MenuItem[]): string[] => items.map((item) => item.label);

    /** The labels of the items between the rules, in order. */
    function groupsOf(items: MenuItem[]): string[][] {
        const groups: string[][] = [];
        for (const item of items) {
            if (item.rule === true || groups.length === 0) groups.push([]);
            groups[groups.length - 1].push(item.label);
        }
        return groups;
    }

    // Revert: leave New File... out of the folder's menu in rowMenu.
    it('audits that offers a folder every item of VS Code and the ones oculus has, and Paste disabled with no clipboard', () => {
        const items = rowMenu(facts('dir'), words);
        expect(labelsOf(items).toSorted()).toEqual(
            [
                '@files.menu_new_file',
                '@files.menu_new_folder',
                '@files.menu_reveal',
                '@files.menu_terminal',
                '@files.menu_upload',
                '@files.menu_paste',
                '@files.menu_find',
                '@files.menu_cut',
                '@files.menu_copy',
                '@files.menu_copy_path',
                '@files.menu_copy_relative',
                '@files.menu_rename',
                '@files.menu_delete'
            ].toSorted()
        );
        const paste = items.find((item) => item.label === '@files.menu_paste');
        expect(paste?.disabled).toBe(true);
        for (const item of items) {
            if (item !== paste) expect(item.disabled ?? false, item.label).toBe(false);
        }
    });

    // Revert: draw Paste disabled whatever `clipboard` says.
    it('audits that enables Paste once the clipboard holds something', () => {
        const paste = rowMenu(facts('dir', { clipboard: true }), words).find(
            (item) => item.label === '@files.menu_paste'
        );
        expect(paste).toBeDefined();
        expect(paste?.disabled ?? false).toBe(false);
    });

    // Revert: put New File... and New Folder... in groups of their own.
    it('audits that groups the folder items as VS Code does: the two news first, then cut, copy and paste together, then rename and delete last', () => {
        const groups = groupsOf(rowMenu(facts('dir', { clipboard: true }), words));
        expect(groups[0]).toEqual(['@files.menu_new_file', '@files.menu_new_folder']);
        const clipboard = groups.find((one) => one.includes('@files.menu_cut'));
        expect(clipboard).toEqual(['@files.menu_cut', '@files.menu_copy', '@files.menu_paste']);
        expect(groups.at(-1)).toEqual(['@files.menu_rename', '@files.menu_delete']);
        expect(groups.findIndex((one) => one === clipboard)).toBeLessThan(groups.length - 1);
    });

    // Revert: offer Cut, Rename... and Delete on a root.
    it('audits that offers a root the folder items VS Code gives a workspace folder: no cut, copy, rename or delete, and Find in Folder in place of Find in Workspace', () => {
        const items = rowMenu(facts('root', { addable: true, removable: true }), words);
        const labels = labelsOf(items);
        for (const wanted of [
            '@files.menu_new_file',
            '@files.menu_new_folder',
            '@files.menu_upload',
            '@files.menu_paste',
            '@files.menu_find',
            '@files.menu_add_root',
            '@files.menu_remove_root'
        ]) {
            expect(labels, wanted).toContain(wanted);
        }
        for (const gone of [
            '@files.menu_cut',
            '@files.menu_copy',
            '@files.menu_rename',
            '@files.menu_delete'
        ]) {
            // A workspace folder cannot be cut, copied, renamed or deleted, so none of the four is
            // drawn on a root.
            expect(labels, gone).not.toContain(gone);
        }
        expect(labels.filter((label) => label === '@files.menu_find')).toHaveLength(1);
    });

    // Revert: offer a file Paste and Upload... as a folder has them.
    it('audits that offers a file Select for Compare, Cut, Copy, Rename..., Delete and Reveal in Finder, and no Paste, Upload or New File', () => {
        const labels = labelsOf(rowMenu(facts('file'), words));
        for (const wanted of [
            '@files.menu_select_compare',
            '@files.menu_cut',
            '@files.menu_copy',
            '@files.menu_rename',
            '@files.menu_delete',
            '@files.menu_reveal'
        ]) {
            expect(labels, wanted).toContain(wanted);
        }
        for (const gone of [
            '@files.menu_paste',
            '@files.menu_upload',
            '@files.menu_new_file',
            '@files.menu_compare_with',
            '@files.menu_compare_selected'
        ]) {
            // A file cannot take a paste, an upload or a new file, and the comparison items need a
            // selection.
            expect(labels, gone).not.toContain(gone);
        }
    });

    // Revert: draw Reveal in Finder in a group of its own on a file.
    it("draws a file's Reveal in Finder in the group of Open in Integrated Terminal", () => {
        const groups = groupsOf(rowMenu(facts('file'), words));
        expect(groups.find((one) => one.includes('@files.menu_terminal'))).toEqual(
            expect.arrayContaining(['@files.menu_reveal', '@files.menu_terminal'])
        );
    });

    // Revert: offer Compare with Selected whatever `compareWith` says.
    it('audits that offers Compare with Selected only with a file selected for compare', () => {
        const without = labelsOf(rowMenu(facts('file'), words));
        // Nothing is selected for compare in this fixture, so the row has no file to compare
        // against.
        expect(without).not.toContain('@files.menu_compare_with');
        const withOne = labelsOf(rowMenu(facts('file', { compareWith: 'b.md' }), words));
        expect(withOne).toContain('@files.menu_compare_with');
        expect(withOne).toContain('@files.menu_select_compare');
    });

    // Revert: draw Compare Selected whatever `selection` says.
    it('audits that offers Compare Selected and neither of the other two when two rows are selected', () => {
        const labels = labelsOf(
            rowMenu(facts('file', { selection: 2, compareWith: 'b.md' }), words)
        );
        expect(labels).toContain('@files.menu_compare_selected');
        // Two rows are selected, so the single-file selection item gives way to the pair
        // comparison.
        expect(labels).not.toContain('@files.menu_select_compare');
        // Two rows are selected, so the comparison against a held file gives way to the pair
        // comparison.
        expect(labels).not.toContain('@files.menu_compare_with');
        const one = labelsOf(rowMenu(facts('file', { compareWith: 'b.md' }), words));
        // One row is selected, so a comparison of the selected pair has no pair to compare.
        expect(one).not.toContain('@files.menu_compare_selected');
    });

    // Revert: leave a row's ids shared between two of its new items.
    it('audits that gives every item of every row an id of its own', () => {
        for (const row of [
            facts('file', { compareWith: 'b.md', clipboard: true }),
            facts('dir', { clipboard: true }),
            facts('root', { clipboard: true, addable: true, removable: true })
        ]) {
            const ids = rowMenu(row, words).map((item) => item.id);
            expect(new Set(ids).size).toBe(ids.length);
            expect(ids.every((id) => id !== '')).toBe(true);
        }
    });
});

describe('the facts of a row', () => {
    const row: TreeRow = {
        root: 'hub',
        path: 'notes/a.md',
        name: 'a.md',
        kind: 'file',
        size: 1,
        depth: 2,
        open: false
    };

    /** The language map of the tracked config/sources.yml, which names `.md` as Markdown. */
    const map = languageMap(loadConfig(engineDir()).config);

    /** An explorer store as far as the facts read it. */
    const store = (
        clipboard: unknown,
        compare: { root: string; path: string } | null
    ): Parameters<typeof rowFacts>[3] =>
        ({ clipboard: () => clipboard, compareFile: () => compare }) as unknown as Parameters<
            typeof rowFacts
        >[3];

    // Revert: read `clipboard` as false in rowFacts.
    it('audits that reads the clipboard from the explorer store it is given', () => {
        const empty = rowFacts(row, [], false, store(null, null), map);
        expect(empty.clipboard).toBe(false);
        const held = rowFacts(
            row,
            [],
            false,
            store({ mode: 'cut', items: [{ root: 'hub', path: 'x' }] }, null),
            map
        );
        expect(held.clipboard).toBe(true);
        expect(held.selection).toBe(1);
    });

    // Revert: set `compareWith` to the file whatever row it is read for.
    it('audits that names the file selected for compare, and none for the row itself', () => {
        const other = { root: 'hub', path: 'notes/b.md' };
        expect(rowFacts(row, [], false, store(null, other), map).compareWith).toBe('b.md');
        expect(rowFacts(row, [], false, store(null, null), map).compareWith).toBeNull();
        expect(
            rowFacts(row, [], false, store(null, { root: 'hub', path: 'notes/a.md' }), map)
                .compareWith
        ).toBeNull();
        expect(
            rowFacts(row, [], false, store(null, { root: 'other', path: 'notes/a.md' }), map)
                .compareWith
        ).toBe('a.md');
    });
    it('audits that reads whether a file is Markdown from the language map it is given', () => {
        const facts = (path: string, languages = map) =>
            rowFacts(
                { ...row, path, name: path.split('/').pop() ?? path },
                [],
                false,
                store(null, null),
                languages
            );
        expect(facts('notes/a.md').markdown).toBe(true);
        expect(facts('notes/a.MARKDOWN').markdown).toBe(true);
        expect(facts('src/x.py').markdown).toBe(false);
        expect(facts('notes/a.md', new Map()).markdown).toBe(false);
        expect(facts('notes/a.md', new Map([['.md', 'plaintext']])).markdown).toBe(false);
        expect(
            rowFacts({ ...row, kind: 'dir', path: 'a.md' }, [], false, store(null, null), map)
                .markdown
        ).toBe(false);
    });
});
