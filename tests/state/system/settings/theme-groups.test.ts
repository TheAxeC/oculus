// Layer 2, client state tests. The groups the Settings view's choices draw the UI themes and the
// code themes under (state/system/config/editors/sources.ts, `listsOf`): a theme row's `group`, an
// app theme under its app's title, and the code themes read from the rows of `code_themes.vscode`
// and `code_themes.shiki`, each in its row's group and with its row's words. The two options never
// read each other: a workspace file that renames or takes out a code theme leaves the theme list as
// it is, and one that takes out a UI theme leaves the code themes as they are. A row of
// `code_themes.vscode` whose class has no TextMate rules makes no code theme, in the choice and as
// the code theme the editors draw. A group is its words, so a group worded as an app's title or as
// the group of a Shiki row shares that one heading; a code theme id names one theme; and a Shiki
// row with no label, no group or a repeated id is read row by row. The choice's pool is read as the
// Settings view's choice field reads it (editors/fields.ts `poolOf`), and split by the rule its
// list draws by (`choiceGroups`).
//
// The choice `self` of local.yml offers the people of every hub whose key resolves to them from the
// primary hub: the primary's own, and a person of another hub whose key the primary and no third
// hub holds, drawn with that hub's name after its words. It draws each by name, by key when the
// name is empty, and as its words and key when they would read like another item's.
//
// It does not cover the choice as the view draws it, which the look does.

import { afterEach, describe, expect, it } from 'vitest';
import {
    codeThemeIds,
    codeThemeInfo,
    isCodeTheme
} from '../../../../src/lib/data/helpers/editor/code-themes.ts';
import type { AppOffers } from '../../../../src/lib/data/helpers/files/apps/choices.ts';
import type { Person } from '../../../../src/lib/data/model/index.ts';
import { vscodeRuleIds } from '../../../../src/lib/data/places/code-rules.ts';
import { engineDir, loadConfig } from '../../../../src/lib/data/sources/config.ts';
import { openWorkspace } from '../../../../src/lib/server/files/workspace/open.ts';
import { configOptions } from '../../../../src/lib/server/files/workspace/paths.ts';
import {
    codeThemeDefault,
    setAppearance,
    themes
} from '../../../../src/lib/state/shared/words/appearance.ts';
import { poolOf } from '../../../../src/lib/state/system/config/editors/fields.ts';
import { listsOf } from '../../../../src/lib/state/system/config/editors/sources.ts';
import { choiceGroups } from '../../../../src/lib/ui/forms/choice/choices.ts';
import { plantSaved } from '../../../fixtures/hubs/workspace.ts';
import { scratchDir } from '../../../fixtures/scratch.ts';
import { shipped } from './fixture.ts';

/** Oculus's own config, as the server merges it with no hub and no workspace file. */
const config = loadConfig(engineDir()).config;

/** The classes the checkout ships TextMate rules for, which the `config` channel carries. */
const RULED = new Set(vscodeRuleIds());

/** The offers of a page whose acting apps offer no theme. */
const NONE: AppOffers = { themes: [], icons: [] };

/** One app titled Rice Pack offering one colour theme. */
const RICE_PACK: AppOffers = {
    themes: [
        { choice: 'app:rice-pack/paper', label: 'Paper', appTitle: 'Rice Pack', uiTheme: 'vs' }
    ],
    icons: []
};

afterEach(() => {
    setAppearance(config, [...RULED]);
});

/** The lists of a page holding `merged` as its config, with `offers` from the apps. */
function listsFor(merged: Record<string, unknown>, offers: AppOffers = NONE) {
    setAppearance(merged, [...RULED]);
    return listsOf({
        config: merged,
        portfolio: null,
        views: [],
        tiers: null,
        themeClasses: [],
        codeThemeClasses: [...RULED],
        offers,
        folder: () => ({ state: 'ready', entries: [] })
    });
}

/** The choice of an appearance option split as its list draws it: loose ids, then each group. */
function drawn(key: string, lists: ReturnType<typeof listsFor>) {
    if (!Object.hasOwn(shipped['appearance.yml'], key)) throw new Error(`no option ${key}`);
    const pool = poolOf(shipped['appearance.yml'][key], {}, lists);
    const split = choiceGroups(
        pool.items.map((id) => ({
            id,
            label: pool.labels.get(id) ?? id,
            group: pool.groups.get(id)
        }))
    );
    return {
        loose: split.loose.map((one) => one.id),
        groups: split.groups.map((group) => ({
            name: group.name,
            ids: group.choices.map((one) => one.id),
            labels: group.choices.map((one) => one.label)
        }))
    };
}

/** Oculus's config with the `themes:` list a workspace file's `settings:` would give it. */
function withThemes(rows: unknown[]): Record<string, unknown> {
    return { ...config, themes: rows };
}

/** Oculus's config with the lists under `code_themes:` that `lists` sets laid over its own. */
function withCodeLists(lists: Record<string, unknown>): Record<string, unknown> {
    return { ...config, code_themes: { ...(config.code_themes as object), ...lists } };
}

/** Oculus's config merged with a saved workspace whose file's `settings:` block is `settings`. */
function mergedWith(settings: string): Record<string, unknown> {
    const { state } = plantSaved(scratchDir('oculus-code-themes-hub-'), `settings:\n${settings}`);
    return loadConfig(engineDir(), configOptions(openWorkspace(state))).config;
}

/** The rows `code_themes.vscode` holds in a config. */
function vscodeList(merged: Record<string, unknown>) {
    return (merged.code_themes as { vscode: { class: string; label: string; group: string }[] })
        .vscode;
}

describe('the groups of the UI theme choice', () => {
    it('draws a row with a group under its heading and a row with none before the groups', () => {
        const lists = listsFor(
            withThemes([
                {
                    name: 'a',
                    class: 'vscode-dark-plus',
                    glyph: 'theme_base',
                    label: 'A',
                    group: 'VS Code, dark'
                },
                { name: 'b', class: '', glyph: 'theme_base', label: 'B' }
            ])
        );
        expect([...lists.groups('themes')]).toEqual([['a', 'VS Code, dark']]);
        expect(drawn('theme', lists)).toEqual({
            loose: ['b'],
            groups: [{ name: 'VS Code, dark', ids: ['a'], labels: ['A'] }]
        });
    });

    it("draws an app's theme under the app's title, in the list and in the choice", () => {
        const lists = listsFor(
            withThemes([{ name: 'light', class: '', glyph: 'theme_base' }]),
            RICE_PACK
        );
        expect(themes(RICE_PACK).map((one) => [one.name, one.group])).toEqual([
            ['light', ''],
            ['app:rice-pack/paper', 'Rice Pack']
        ]);
        expect(drawn('theme', lists).groups).toEqual([
            { name: 'Rice Pack', ids: ['app:rice-pack/paper'], labels: ['Paper (Rice Pack)'] }
        ]);
    });

    it("draws oculus's own rows under their groups, in the order the rows give them", () => {
        const groups = drawn('theme', listsFor(config)).groups;
        expect(groups.map((group) => [group.name, group.ids.length])).toEqual([
            ['Oculus', 2],
            ['VS Code, dark', 11],
            ['VS Code, light', 6],
            ['VS Code, high contrast', 2],
            ['Terminal, dark', 21],
            ['Terminal, light', 7]
        ]);
        expect(groups[3].ids).toEqual(['vscode-dark-high-contrast', 'vscode-light-high-contrast']);
    });

    it("draws a row whose group is an app's title under that app's one heading", () => {
        const lists = listsFor(
            withThemes([
                { name: 'light', class: '', glyph: 'theme_base' },
                { name: 'm', class: 'mocha', glyph: 'theme_base', label: 'M', group: 'Rice Pack' }
            ]),
            RICE_PACK
        );
        expect(drawn('theme', lists).groups).toEqual([
            {
                name: 'Rice Pack',
                ids: ['m', 'app:rice-pack/paper'],
                labels: ['M', 'Paper (Rice Pack)']
            }
        ]);
    });
});

describe('the groups of the code theme choice', () => {
    it("draws each VS Code theme in its row's group, with its row's words", () => {
        const groups = drawn('code_theme', listsFor(config)).groups;
        const vscode = groups.filter((group) => group.name.startsWith('VS Code'));
        expect(vscode.map((group) => [group.name, group.ids.length])).toEqual([
            ['VS Code, dark', 11],
            ['VS Code, light', 6],
            ['VS Code, high contrast', 2]
        ]);
        const rows = vscodeList(config);
        expect(rows).toHaveLength(19);
        expect(vscode.flatMap((group) => group.ids)).toEqual(
            ['VS Code, dark', 'VS Code, light', 'VS Code, high contrast'].flatMap((name) =>
                rows.filter((row) => row.group === name).map((row) => row.class)
            )
        );
        for (const row of rows) {
            const group = vscode.find((one) => one.ids.includes(row.class));
            expect([row.class, group?.name]).toEqual([row.class, row.group]);
            expect(group?.labels[group.ids.indexOf(row.class)]).toBe(row.label);
        }
    });

    it('draws the high contrast themes of both kinds under their own headings', () => {
        const groups = drawn('code_theme', listsFor(config)).groups;
        expect(groups.map((group) => group.name)).toEqual([
            'VS Code, dark',
            'VS Code, light',
            'VS Code, high contrast',
            'Shiki, dark',
            'Shiki, light',
            'Shiki, high contrast'
        ]);
        expect(groups[2].ids).toEqual(['vscode-dark-high-contrast', 'vscode-light-high-contrast']);
        expect(groups[5].ids).toEqual(['github-dark-high-contrast', 'github-light-high-contrast']);
        expect(groups[5].labels).toEqual([
            'GitHub Dark High Contrast',
            'GitHub Light High Contrast'
        ]);
    });

    it('keeps every code theme when a workspace file takes a UI theme out', () => {
        const before = drawn('code_theme', listsFor(config));
        const merged = mergedWith('  themes:\n    - { name: vscode-dark-modern, removed: true }\n');
        const lists = listsFor(merged);
        expect(themes(NONE).some((one) => one.name === 'vscode-dark-modern')).toBe(false);
        expect(drawn('code_theme', lists)).toEqual(before);
        expect(isCodeTheme('vscode-dark-modern', merged, RULED)).toBe(true);
    });

    it("shows a workspace file's new words for a code theme and leaves the UI theme list as it is", () => {
        const before = drawn('theme', listsFor(config));
        const merged = mergedWith(
            '  code_themes:\n    vscode:\n      - { class: vscode-dark-modern, label: Mine, group: "VS Code, dark" }\n'
        );
        const lists = listsFor(merged);
        const dark = drawn('code_theme', lists).groups.find(
            (group) => group.name === 'VS Code, dark'
        );
        expect(dark?.labels[dark.ids.indexOf('vscode-dark-modern')]).toBe('Mine');
        expect(drawn('theme', lists)).toEqual(before);
    });

    it('takes out a code theme a workspace file removes, and leaves the UI theme list as it is', () => {
        const before = drawn('theme', listsFor(config));
        const merged = mergedWith(
            '  code_themes:\n    vscode:\n      - { class: vscode-abyss, removed: true }\n'
        );
        const lists = listsFor(merged);
        const ids = drawn('code_theme', lists).groups.flatMap((group) => group.ids);
        expect(ids).not.toContain('vscode-abyss');
        expect(ids).toContain('vscode-dark-modern');
        expect(isCodeTheme('vscode-abyss', merged, RULED)).toBe(false);
        expect(drawn('theme', lists)).toEqual(before);
        expect(themes(NONE).some((one) => one.name === 'vscode-abyss')).toBe(true);
    });

    it('makes no code theme of a row whose class has no TextMate rules', () => {
        const merged = withCodeLists({
            vscode: [
                ...vscodeList(config),
                { class: 'vscode-nowhere', label: 'Nowhere', group: 'VS Code, dark' }
            ]
        });
        expect(RULED.has('vscode-nowhere')).toBe(false);
        expect(codeThemeIds(merged, RULED)).not.toContain('vscode-nowhere');
        expect(codeThemeIds(merged, RULED)).toEqual(codeThemeIds(config, RULED));
        expect(isCodeTheme('vscode-nowhere', merged, RULED)).toBe(false);
        const ids = drawn('code_theme', listsFor(merged)).groups.flatMap((group) => group.ids);
        expect(ids).not.toContain('vscode-nowhere');
        setAppearance({ ...merged, code_theme: 'vscode-nowhere' }, [...RULED]);
        expect(codeThemeDefault()).toBe('tokens');
        setAppearance({ ...merged, code_theme: 'vscode-nowhere' }, [...RULED, 'vscode-nowhere']);
        expect(codeThemeDefault()).toBe('vscode-nowhere');
    });

    it('takes out a Shiki theme a workspace file removes, and leaves the UI theme list as it is', () => {
        const before = drawn('theme', listsFor(config));
        const merged = mergedWith(
            '  code_themes:\n    shiki:\n      - { id: dark-plus, removed: true }\n'
        );
        expect(codeThemeIds(merged, RULED)).not.toContain('dark-plus');
        expect(codeThemeIds(merged, RULED)).toContain('vscode-dark-plus');
        expect(isCodeTheme('dark-plus', merged, RULED)).toBe(false);
        const drawnIds = drawn('code_theme', listsFor(merged)).groups.flatMap((group) => group.ids);
        expect(drawnIds).not.toContain('dark-plus');
        expect([...drawnIds].sort()).toEqual([...codeThemeIds(merged, RULED)].sort());
        expect(drawn('theme', listsFor(merged))).toEqual(before);
    });

    it("shows a workspace file's new words and group for a Shiki theme", () => {
        const merged = mergedWith(
            '  code_themes:\n    shiki:\n      - { id: nord, label: Mine, group: Mine }\n'
        );
        const groups = drawn('code_theme', listsFor(merged)).groups;
        expect(groups.find((group) => group.name === 'Mine')).toEqual({
            name: 'Mine',
            ids: ['nord'],
            labels: ['Mine']
        });
        expect(groups.findIndex((group) => group.name === 'Mine')).toBe(3);
        expect(groups.flatMap((group) => group.ids).filter((id) => id === 'nord')).toEqual([
            'nord'
        ]);
    });

    it('marks the six Shiki themes VS Code also ships with (Shiki) in their words', () => {
        const labels = drawn('code_theme', listsFor(config)).groups.flatMap((group) =>
            group.ids.map((id, at): [string, string] => [id, group.labels[at]])
        );
        expect(labels.filter(([, label]) => label.endsWith(' (Shiki)'))).toEqual([
            ['dark-plus', 'Dark Plus (Shiki)'],
            ['monokai', 'Monokai (Shiki)'],
            ['red', 'Red (Shiki)'],
            ['solarized-dark', 'Solarized Dark (Shiki)'],
            ['light-plus', 'Light Plus (Shiki)'],
            ['solarized-light', 'Solarized Light (Shiki)']
        ]);
    });

    it("lists a row's class once, makes no code theme of tokens or of a row with no class, and takes the id a Shiki theme shares", () => {
        const row = (cls: unknown, label: string, group = 'G') => ({ class: cls, label, group });
        const merged = withCodeLists({
            vscode: [
                row('vscode-dark-plus', 'ONE'),
                row('vscode-dark-plus', 'TWO', 'H'),
                row('tokens', 'THREE'),
                row('monokai', 'FOUR'),
                row('', 'FIVE'),
                row(5, 'SIX')
            ]
        });
        const ruled = new Set([...RULED, 'monokai']);
        expect(codeThemeInfo(merged, ruled).filter((one) => one.vscode)).toEqual([
            { id: 'vscode-dark-plus', label: 'ONE', vscode: true, group: 'G' },
            { id: 'monokai', label: 'FOUR', vscode: true, group: 'G' }
        ]);
        const ids = codeThemeIds(merged, ruled);
        expect(ids.filter((id) => id === 'monokai')).toEqual(['monokai']);
        expect(new Set(ids).size).toBe(ids.length);
        expect(ids).not.toContain('tokens');
        expect(isCodeTheme('vscode-red', merged, ruled)).toBe(false);
    });

    it("draws a VS Code row whose group is a Shiki heading's words under that one heading", () => {
        const merged = withCodeLists({
            vscode: [{ class: 'vscode-dark-plus', label: 'X', group: 'Shiki, dark' }]
        });
        const groups = drawn('code_theme', listsFor(merged)).groups;
        expect(groups.filter((group) => group.name === 'Shiki, dark')).toHaveLength(1);
        expect(groups[0].name).toBe('Shiki, dark');
        expect(groups[0].ids[0]).toBe('vscode-dark-plus');
        expect(groups[0].ids).toContain('dark-plus');
    });

    it('reads a Shiki row with no label, no group or a repeated id row by row', () => {
        const info = (shiki: unknown[]) =>
            codeThemeInfo(withCodeLists({ shiki }), RULED).filter((one) => !one.vscode);
        expect(info([{ id: 'nord' }])).toEqual([
            { id: 'nord', label: 'Nord', vscode: false, group: '' }
        ]);
        expect(
            info([
                { id: 'nord', label: 'A', group: 'G' },
                { id: 'nord', label: 'B', group: 'H' },
                { id: 'gone', label: 'C' },
                { label: 'D' },
                5
            ])
        ).toEqual([{ id: 'nord', label: 'A', vscode: false, group: 'G' }]);
        expect(info([])).toEqual([]);
        expect(
            codeThemeInfo(withCodeLists({ shiki: 'nord' }), RULED).some((one) => !one.vscode)
        ).toBe(false);
        const lists = listsFor(withCodeLists({ shiki: [{ id: 'nord' }] }));
        expect(drawn('code_theme', lists).loose).toEqual(['tokens', 'nord']);
    });
});

describe('the people of the choice self', () => {
    /**
     * The words the choice `self` draws each person by, over people of the primary hub `lab` given
     * as key and name, and the people of the hubs `other` and `third` given the same way.
     */
    function drawnPeople(
        people: Record<string, string>,
        others: Record<string, string> = {},
        thirds: Record<string, string> = {}
    ): string[] {
        const of = (root: string, given: Record<string, string>): [string, Person][] =>
            Object.entries(given).map(([key, name]): [string, Person] => [
                `${root}:${key}`,
                {
                    id: `${root}:${key}`,
                    root,
                    name,
                    affiliations: [],
                    links: [],
                    projectIds: [],
                    jointWorkIds: []
                }
            ]);
        const held = Object.fromEntries([
            ...of('lab', people),
            ...of('other', others),
            ...of('third', thirds)
        ]);
        const lists = listsOf({
            config,
            portfolio: { primary: 'lab', domains: {}, resources: {}, people: held, projects: [] },
            views: [],
            tiers: null,
            themeClasses: [],
            codeThemeClasses: [...RULED],
            offers: NONE,
            folder: () => ({ state: 'ready', entries: [] })
        });
        const pool = poolOf(shipped['local.yml'].self, {}, lists);
        return pool.items.map((id) => pool.labels.get(id) ?? id);
    }

    it.each<{ people: Record<string, string>; drawn: string[] }>([
        { people: { ada: 'Ada', bob: '' }, drawn: ['Ada', 'bob'] },
        { people: { k1: 'Kim', k2: 'Kim' }, drawn: ['Kim (k1)', 'Kim (k2)'] },
        { people: { ada: '', bob: 'ada' }, drawn: ['ada (ada)', 'ada (bob)'] },
        {
            people: { k1: 'Kim', k2: 'Kim', x: 'Kim (k1)' },
            drawn: ['Kim (k1)', 'Kim (k2)', 'Kim (k1) (x)']
        },
        {
            people: { k1: 'Kim', k2: 'Kim', x: 'Kim (k1)', y: 'Kim (k1) (x)' },
            drawn: ['Kim (k1)', 'Kim (k2)', 'Kim (k1) (x)', 'Kim (k1) (x) (y)']
        }
    ])('draws $people as $drawn, so no two items read alike', (row) => {
        expect(drawnPeople(row.people)).toEqual(row.drawn);
    });

    it("offers a person of another hub whose key resolves to them from the primary, with that hub's name, and no person whose key the primary or a third hub holds (case 19)", () => {
        expect(
            drawnPeople({ ada: 'Ada' }, { bob: 'Bob', ada: 'Ada', kim: 'Kim' }, { kim: 'Kim' })
        ).toEqual(['Ada', 'Bob (other)']);
    });

    it.each<{ people: Record<string, string>; others: Record<string, string>; drawn: string[] }>([
        { people: { k1: 'Kim' }, others: { k2: 'Kim' }, drawn: ['Kim', 'Kim (other)'] },
        {
            people: { x: 'Kim (other)' },
            others: { k2: 'Kim' },
            drawn: ['Kim (other) (x)', 'Kim (other) (k2)']
        }
    ])(
        'draws a person of another hub named like a person of the primary apart: $drawn (case 20)',
        (row) => {
            expect(drawnPeople(row.people, row.others)).toEqual(row.drawn);
        }
    );
});
