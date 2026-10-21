// Layer 4, test. The rows of Cmd-K's `:theme` (shell/keys/palette-modes.ts `argumentRows`) over the
// choices the palette makes from the appearance store (lists/argument-list.svelte.ts
// `argumentChoices`): the rows come in the order the list draws them, the rows with no group first
// and then each group in the order the Settings view's choice draws it, the headings split from
// them by the rule rows/ArgumentRows.svelte draws by (`choiceGroups`); a group the typed words
// filter out whole draws no heading, and the selection starts on the theme in force, or on the row
// the typed text names whole.
//
// The headings are bits-ui Command group headings, which are no items, so the arrow keys pass over
// them; that and the drawing itself are the look's.

import { afterEach, describe, expect, it } from 'vitest';
import type { AppOffers } from '../../../src/lib/data/helpers/files/apps/choices.ts';
import { engineDir, loadConfig, textCatalog } from '../../../src/lib/data/sources/config.ts';
import { argumentChoices } from '../../../src/lib/shell/keys/lists/argument-list.svelte.ts';
import {
    argumentRows,
    startRow,
    type ArgumentRow
} from '../../../src/lib/shell/keys/palette-modes.ts';
import { setAppearance } from '../../../src/lib/state/shared/words/appearance.ts';
import { vscodeRuleIds } from '../../../src/lib/data/places/code-rules.ts';
import { setCatalog } from '../../../src/lib/state/shared/words/text.ts';
import { choiceGroups } from '../../../src/lib/ui/forms/choice/choices.ts';

const config = loadConfig(engineDir()).config;

setCatalog(textCatalog(config));
const classes = vscodeRuleIds();
setAppearance(config, classes);

afterEach(() => {
    setAppearance(config, classes);
});

/** The choices of a palette whose theme in force is `theme`, with `offers` from the apps. */
function choicesWith(theme: string, offers: AppOffers = { themes: [], icons: [] }) {
    const client = {
        appShell: { offers: () => offers, fileIcons: () => 'seti' },
        ui: { chosenTheme: () => theme }
    } as unknown as Parameters<typeof argumentChoices>[0];
    return argumentChoices(client, [], null);
}

/** The rows of `:theme` for `argument`, split as the list draws them. */
function drawn(rows: ArgumentRow[]) {
    const split = choiceGroups(rows);
    return {
        loose: split.loose.map((row) => row.argument),
        groups: split.groups.map((group) => ({
            name: group.name,
            rows: group.choices.map((row) => row.argument)
        }))
    };
}

describe('the rows of :theme', () => {
    it('draws a heading per group in the Settings order with nothing typed, and starts on the theme in force', () => {
        const rows = argumentRows('theme', choicesWith('mocha'), '');
        const split = drawn(rows);
        expect(split.loose).toEqual([]);
        expect(split.groups.map((group) => [group.name, group.rows.length])).toEqual([
            ['Oculus', 2],
            ['VS Code, dark', 11],
            ['VS Code, light', 6],
            ['VS Code, high contrast', 2],
            ['Terminal, dark', 21],
            ['Terminal, light', 7]
        ]);
        expect(rows.map((row) => row.argument)).toEqual(
            split.groups.flatMap((group) => group.rows)
        );
        expect(startRow(rows, '')?.argument).toBe('mocha');
    });

    it('draws only the VS Code, dark heading and its two rows for monokai', () => {
        const rows = argumentRows('theme', choicesWith('light'), 'monokai');
        expect(drawn(rows)).toEqual({
            loose: [],
            groups: [{ name: 'VS Code, dark', rows: ['vscode-monokai', 'vscode-monokai-dimmed'] }]
        });
        expect(startRow(rows, 'monokai')?.argument).toBe('vscode-monokai');
    });

    it('draws a row with no group before the groups, and starts on the row the text names whole', () => {
        setAppearance(
            {
                ...config,
                themes: [
                    {
                        name: 'plain-dark',
                        class: 'dark',
                        glyph: 'theme_base',
                        label: 'Plain Dark',
                        group: 'Mine'
                    },
                    { name: 'plain', class: '', glyph: 'theme_base', label: 'Plain' }
                ]
            },
            classes
        );
        const rows = argumentRows('theme', choicesWith('plain-dark'), 'plain');
        expect(drawn(rows)).toEqual({
            loose: ['plain'],
            groups: [{ name: 'Mine', rows: ['plain-dark'] }]
        });
        expect(startRow(rows, 'plain')?.argument).toBe('plain');
        expect(startRow(rows, 'plain dark')?.argument).toBe('plain-dark');
    });

    it("draws an app's theme under the app's title", () => {
        const offers: AppOffers = {
            themes: [
                {
                    choice: 'app:rice-pack/paper',
                    label: 'Paper',
                    appTitle: 'Rice Pack',
                    uiTheme: 'vs'
                }
            ],
            icons: []
        };
        const rows = argumentRows('theme', choicesWith('light', offers), 'paper');
        expect(drawn(rows)).toEqual({
            loose: [],
            groups: [{ name: 'Rice Pack', rows: ['app:rice-pack/paper'] }]
        });
    });
});
