// Layer 3, audit over every right-click menu builder: each label a builder writes is worded by a
// key of the real text catalog, handed through the builder's `t`, and the one other kind of label,
// a branch, tag or terminal name taken from the repository or the terminal list, is exactly the
// name the builder was handed.
//
// Each builder is called in the state that gives it its most items, with a `t` that records the key
// it is asked for and answers it as `@key`, so a label that did not come through `t` shows as one
// without the `@`. The names handed in carry no `@`, so a name that was reworded shows too.
//
// What this does NOT cover: the words a view draws beside a menu, which the catalog checks cover.

import { describe, expect, it } from 'vitest';
import { engineDir, loadConfig, textCatalog } from '../../../src/lib/data/sources/config.ts';
import type { MenuItem } from '../../../src/lib/ui/menu/menu-items.ts';
import { rowMenu } from '../../../src/lib/views/sources/files/tree/row-menu.ts';
import {
    changeMenu,
    groupMenu
} from '../../../src/lib/views/sources/repositories/menus/change-menu.ts';
import {
    commitMenu,
    refMenu
} from '../../../src/lib/views/sources/repositories/menus/graph-menu.ts';
import {
    repoRowMenu,
    worktreeMenu
} from '../../../src/lib/views/sources/repositories/menus/repo-menu.ts';
import { stripMenu } from '../../../src/lib/shell/panes/pane-view.ts';
import {
    emptyListMenu,
    gridMenu,
    kindsMenu,
    terminalRowMenu
} from '../../../src/lib/views/sessions/terminal/terminal-list.ts';
import { readTab } from '../../../src/lib/state/sessions/terminal/terminal-tabs.ts';
import { textMenu } from '../../../src/lib/ui/controls/text/text-menu.ts';
import { proseMenu } from '../../../src/lib/views/shared/prose/prose-menu.ts';

const catalog = textCatalog(loadConfig(engineDir()).config);

const asked: string[] = [];
const words = (key: string, ...args: (string | number)[]): string => {
    asked.push(key);
    return args.length === 0 ? `@${key}` : `@${key}(${args.join(',')})`;
};

/** Every label of a menu, its submenus' included. */
function labels(items: MenuItem[]): string[] {
    return items.flatMap((item) => [item.label, ...labels(item.items ?? [])]);
}

const A = 'aaaaaa-shell';
const B = 'bbbbbb-shell';

/** The names from data the builders are handed, which they pass through unchanged. */
const BRANCH = 'feature/x';
const TAG = 'v1.0';
const TERMINAL = 'build watcher';
const ATTACHED = 'dev server';
const ATTACHED_TOO = 'notes shell';
const NAMES = [BRANCH, TAG, TERMINAL, ATTACHED, ATTACHED_TOO];

/**
 * The facts that give a row's menu its most items: removable, addable, a clipboard, a compare file.
 */
const ROW_OPS = {
    removable: true,
    addable: true,
    clipboard: true,
    compareWith: 'b.md',
    selection: 1
};

function everyMenu(): MenuItem[][] {
    return [
        rowMenu({ kind: 'file', path: 'a.md', ...ROW_OPS }, words),
        rowMenu({ kind: 'dir', path: 'a', ...ROW_OPS }, words),
        rowMenu({ kind: 'root', path: '', ...ROW_OPS }, words),
        changeMenu('changed', false, words),
        changeMenu('staged', false, words),
        changeMenu('untracked', false, words),
        groupMenu('changed', 1, false, words),
        groupMenu('staged', 1, false, words),
        groupMenu('untracked', 1, false, words),
        commitMenu({ refs: [BRANCH], tags: [TAG] }, { local: [BRANCH], current: '' }, false, words),
        refMenu(BRANCH, 'branch', false, words),
        refMenu(TAG, 'tag', false, words),
        repoRowMenu(true, words),
        worktreeMenu(false, words),
        stripMenu({ holdsTab: true, panes: 2 }, words),
        gridMenu(true, false, words),
        terminalRowMenu(
            readTab({ id: 't', terminals: [A, B], shown: A, row: [A, B] }),
            B,
            [{ terminal: 'cccccc-shell', title: TERMINAL }],
            true,
            words
        ),
        emptyListMenu(words, [{ terminal: B, title: ATTACHED }]),
        kindsMenu(words, [{ terminal: A, title: ATTACHED_TOO }]),
        textMenu({ selection: true, readonly: false }, words),
        proseMenu(
            { selection: true, image: 'http://h/api/file/hub/a.png', origin: 'http://h' },
            words
        )
    ];
}

describe('the words of every right-click menu', () => {
    // Revert: word Open Changes in graph-menu.ts as a string rather than through t.
    it('audits that words every label through t, but for the names it was handed', () => {
        const unworded = everyMenu()
            .flatMap(labels)
            .filter((label) => !label.startsWith('@'));
        expect(unworded.sort()).toEqual([...NAMES].sort());
    });

    // Revert: label a checkout item `${name} (local)` in graph-menu.ts.
    it('audits that passes each name from data through exactly as it was handed', () => {
        const commit = commitMenu(
            { refs: [BRANCH], tags: [TAG] },
            { local: [BRANCH], current: '' },
            false,
            words
        );
        const submenus = commit.flatMap((item) => (item.items ?? []).map((one) => one.label));
        expect(submenus).toEqual([BRANCH, TAG]);
        const row = terminalRowMenu(
            readTab({ id: 't', terminals: [A] }),
            A,
            [{ terminal: B, title: TERMINAL }],
            false,
            words
        );
        expect(
            row
                .flatMap((item) => (item.items ?? []).map((one) => one.label))
                .filter((label) => !label.startsWith('@'))
        ).toEqual([TERMINAL]);
        const attach = [
            ...emptyListMenu(words, [{ terminal: B, title: ATTACHED }]),
            ...kindsMenu(words, [{ terminal: A, title: ATTACHED_TOO }])
        ];
        expect(
            attach
                .flatMap((item) => (item.items ?? []).map((one) => one.label))
                .filter((label) => !label.startsWith('@'))
        ).toEqual([ATTACHED, ATTACHED_TOO]);
    });

    // Revert: rename the key menu_open_changes in config/text/views/sources/repositories.yml.
    it('audits that asks t only for keys the catalog holds', () => {
        asked.length = 0;
        everyMenu();
        expect(asked.length).toBeGreaterThan(0);
        expect([...new Set(asked)].filter((key) => !(key in catalog))).toEqual([]);
    });
});
