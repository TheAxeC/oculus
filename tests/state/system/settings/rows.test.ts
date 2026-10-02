// Layer 2, client-state tests. The rows of the Settings view: what one config file's text and the
// options catalog make of each option (its value, its line, whether it is set, Modified, or a
// value its control cannot show), the groups and sections they fall into, the machine-local rows
// made from the catalog alone, and the "This browser" rows over the ui store's seven values.
//
// The fixture catalog below is small and written for the cases; the shipped catalog and the shipped
// texts of the five tracked files are read from disk for the one case that holds them to each
// other. The machine's own local.yml is never read.
//
// What this does NOT cover: the view that draws the rows
// (tests/views/system/workbench/settings.test.ts) and the write a row sends
// (write.test.ts).

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
    catalogOf,
    type Catalog
} from '../../../../src/lib/data/sources/config/catalog/options.ts';
import { engineDir } from '../../../../src/lib/data/sources/config.ts';
import { shipped, text } from './fixture.ts';
import { createUi, UI_KEY, UI_VERSION } from '../../../../src/lib/state/workbench/ui.svelte.ts';
import {
    resetBrowserRow,
    thisBrowserRows
} from '../../../../src/lib/state/system/config/browser.ts';
import {
    FILES,
    pressedGroups,
    settingsGroups,
    toggledGroups,
    tocOf,
    type Group
} from '../../../../src/lib/state/system/config/groups.ts';
import { SETTINGS_MESSAGES } from '../../../../src/lib/state/system/config/messages.ts';
import {
    fileRows,
    localRows,
    sectionOf,
    titleOf,
    type ConfigRow
} from '../../../../src/lib/state/system/config/rows.ts';

/** The entries of the fixture catalog's behavior.yml. */
const BEHAVIOR = {
    'slurm.resource': { description: 'The cluster.', default: 'utwente', control: 'text' },
    'slurm.poll_min': {
        description: 'Minutes between polls of the queue.',
        default: 20,
        control: 'number'
    },
    waiting_status: {
        description: 'Statuses that wait.',
        default: ['submitted', 'pending'],
        control: 'list',
        section: 'Audit'
    },
    notes: { description: 'A note.', default: 'x', control: 'text' },
    usage_tiers: { description: 'Tier names.', fields: { key: 'a tier', value: 'its words' } }
};

const APPEARANCE = {
    themes: {
        description: 'The themes.',
        fields: { name: 'the saved name', class: 'body classes' }
    },
    'crt.default': { description: 'The CRT overlay.', default: false, control: 'toggle' },
    'terminal.cursor_style': {
        description: 'The cursor.',
        default: 'block',
        control: 'choice',
        values: ['block', 'line', 'underline']
    },
    'wallpaper.dim': { description: 'How dark.', default: 0.72, control: 'number' }
};

/** The fixture catalog: two tracked files and the machine's own, each with a few entries. */
const FIXTURE: Catalog = {
    'appearance.yml': APPEARANCE,
    'behavior.yml': BEHAVIOR,
    'local.yml': {
        notes: { description: 'Where notes live.' },
        hub: { description: 'The hub folder.' }
    }
} as Catalog;

/** The rows of the fixture's behavior.yml over a text. */
function behaviorRows(content: string): ConfigRow[] {
    const result = fileRows('behavior.yml', FIXTURE['behavior.yml'], text(content));
    expect(result.status).toBe('rows');
    return result.rows;
}

/** The row of a key. */
function rowOf(rows: ConfigRow[], key: string): ConfigRow {
    const row = rows.find((one) => one.key === key);
    if (row === undefined) throw new Error(`no row for ${key}`);
    return row;
}

describe('the rows of one file', () => {
    // Revert: leave the module out and every row of every case goes.
    it('reads a number from the file with its line, set and not Modified at its default', () => {
        const row = rowOf(behaviorRows('slurm:\n    poll_min: 20\n'), 'slurm.poll_min');
        expect(row.value).toBe(20);
        expect(row.line).toBe(2);
        expect(row.state).toBe('set');
        expect(row.modified).toBe(false);
        expect(row.title).toBe('Slurm: Poll min');
        expect(row.control).toBe('number');
        expect(row.default).toBe(20);
    });

    it('marks a value that differs from the default as Modified', () => {
        const row = rowOf(behaviorRows('slurm:\n    poll_min: 5\n'), 'slurm.poll_min');
        expect(row.value).toBe(5);
        expect(row.modified).toBe(true);
    });

    it('compares a list item by item', () => {
        const same = rowOf(
            behaviorRows('waiting_status: [submitted, pending]\n'),
            'waiting_status'
        );
        expect(same.modified).toBe(false);
        expect(same.state).toBe('set');
        const changed = rowOf(
            behaviorRows('waiting_status:\n    - submitted\n    - done\n'),
            'waiting_status'
        );
        expect(changed.modified).toBe(true);
        expect(changed.value).toEqual(['submitted', 'done']);
        expect(changed.line).toBe(1);
        const shorter = rowOf(behaviorRows('waiting_status: [submitted]\n'), 'waiting_status');
        expect(shorter.modified).toBe(true);
    });

    it('never marks a family as Modified, and carries its fields', () => {
        const result = fileRows(
            'appearance.yml',
            FIXTURE['appearance.yml'],
            text('themes:\n    - name: light\n      class: ""\n')
        );
        const row = rowOf(result.rows, 'themes');
        expect(row.control).toBe('family');
        expect(row.modified).toBe(false);
        expect(row.state).toBe('set');
        expect(row.fields).toEqual({ name: 'the saved name', class: 'body classes' });
        expect(row.line).toBe(1);
    });

    it('calls a key that is absent, or written with no value, missing and not Modified', () => {
        const absent = rowOf(behaviorRows('slurm:\n    resource: utwente\n'), 'slurm.poll_min');
        expect(absent.state).toBe('missing');
        expect(absent.line).toBeUndefined();
        expect(absent.modified).toBe(false);
        const empty = rowOf(behaviorRows('slurm:\n    poll_min:\n'), 'slurm.poll_min');
        expect(empty.state).toBe('missing');
        expect(empty.modified).toBe(false);
        const whole = rowOf(behaviorRows('other: 1\n'), 'slurm.poll_min');
        expect(whole.state).toBe('missing');
    });

    it('calls an alias, an anchored, a tagged and a block-scalar value missing, as the write does', () => {
        const aliased = rowOf(
            behaviorRows('base: &twenty 20\nslurm:\n    poll_min: *twenty\n'),
            'slurm.poll_min'
        );
        expect(aliased.state).toBe('missing');
        const anchored = rowOf(behaviorRows('slurm:\n    poll_min: &a 20\n'), 'slurm.poll_min');
        expect(anchored.state).toBe('missing');
        const tagged = rowOf(behaviorRows('slurm:\n    poll_min: !!int 20\n'), 'slurm.poll_min');
        expect(tagged.state).toBe('missing');
        const block = rowOf(
            behaviorRows('slurm:\n    resource: |\n        utwente\n'),
            'slurm.resource'
        );
        expect(block.state).toBe('missing');
    });

    it('says a text that does not parse is unparsed, with the parser first message and no rows', () => {
        const broken = fileRows('behavior.yml', FIXTURE['behavior.yml'], text('slurm: [\n'));
        expect(broken.status).toBe('unparsed');
        expect(broken.rows).toEqual([]);
        expect(broken.said?.key).toBe(SETTINGS_MESSAGES.unparsed);
        expect(broken.said?.args[0]).toBe('behavior.yml');
        expect(String(broken.said?.args[1]).length).toBeGreaterThan(0);
        const doubled = fileRows(
            'behavior.yml',
            FIXTURE['behavior.yml'],
            text('slurm:\n    poll_min: 1\n    poll_min: 2\n')
        );
        expect(doubled.status).toBe('unparsed');
        expect(doubled.rows).toEqual([]);
    });

    it('leaves the other files as they were when one does not parse', () => {
        const groups = settingsGroups(
            FIXTURE,
            (file) =>
                file === 'behavior.yml' ? text('slurm: [\n') : text('crt:\n    default: true\n'),
            []
        );
        const behavior = groups.find((group) => group.id === 'behavior.yml');
        const appearance = groups.find((group) => group.id === 'appearance.yml');
        expect(behavior?.status).toBe('unparsed');
        expect(behavior?.sections).toEqual([]);
        expect(appearance?.status).toBe('rows');
        const rows = appearance?.sections.flatMap((section) => section.rows) ?? [];
        expect(rows.length).toBe(Object.keys(APPEARANCE).length);
    });

    it('says a file still being read, unreadable and cut, each with no rows', () => {
        const entries = FIXTURE['behavior.yml'];
        const loading = fileRows('behavior.yml', entries, {
            text: '',
            truncated: false,
            error: '',
            loading: true
        });
        expect(loading.status).toBe('loading');
        expect(loading.rows).toEqual([]);
        const unreadable = fileRows('behavior.yml', entries, {
            text: '',
            truncated: false,
            error: '404',
            loading: false
        });
        expect(unreadable.status).toBe('unreadable');
        expect(unreadable.rows).toEqual([]);
        expect(unreadable.said?.args).toEqual(['behavior.yml', '404']);
        const cut = fileRows('behavior.yml', entries, {
            text: 'slurm:\n    poll_min: 20\n',
            truncated: true,
            error: '',
            loading: false
        });
        expect(cut.status).toBe('cut');
        expect(cut.rows).toEqual([]);
    });

    it('makes the rows of local.yml from the catalog alone, with no value, line or state', () => {
        const rows = localRows(FIXTURE['local.yml']);
        expect(rows.map((row) => row.path)).toEqual(['notes', 'hub']);
        for (const row of rows) {
            expect(Object.keys(row)).not.toContain('value');
            expect(Object.keys(row)).not.toContain('line');
            expect(Object.keys(row)).not.toContain('state');
            expect(Object.keys(row)).not.toContain('default');
            expect(row.modified).toBe(false);
        }
        expect(rows[1].description).toBe('The hub folder.');
        // The rows of this file are made without its text: the function takes the entries alone.
        expect(localRows.length).toBe(1);
    });

    it('keeps a value its control cannot show as the file has it, flagged and Modified', () => {
        const appearance = fileRows(
            'appearance.yml',
            FIXTURE['appearance.yml'],
            text('crt:\n    default: "yes"\nterminal:\n    cursor_style: bar\n')
        ).rows;
        const crt = rowOf(appearance, 'crt.default');
        expect(crt.value).toBe('yes');
        expect(crt.mismatch).toBe(true);
        expect(crt.modified).toBe(true);
        const style = rowOf(appearance, 'terminal.cursor_style');
        expect(style.value).toBe('bar');
        expect(style.mismatch).toBe(true);
        expect(style.modified).toBe(true);
        const number = rowOf(behaviorRows('slurm:\n    poll_min: "20"\n'), 'slurm.poll_min');
        expect(number.value).toBe('20');
        expect(number.mismatch).toBe(true);
        expect(number.modified).toBe(true);
        const infinite = rowOf(behaviorRows('slurm:\n    poll_min: .inf\n'), 'slurm.poll_min');
        expect(infinite.mismatch).toBe(true);
        const fine = rowOf(behaviorRows('slurm:\n    poll_min: 20\n'), 'slurm.poll_min');
        expect(fine.mismatch).toBe(false);
    });

    it('makes no row for a key with no catalog entry, and reads no reserved name from a prototype', () => {
        const rows = behaviorRows('slurm:\n    __proto__: 1\n    poll_min: 20\n    stray: 3\n');
        expect(rows.map((row) => row.key)).toEqual(Object.keys(BEHAVIOR));
        expect(({} as Record<string, unknown>).poll_min).toBeUndefined();
        expect(Object.keys(Object.prototype)).toEqual([]);
        const reserved = JSON.parse(
            '{"constructor":{"description":"d","default":1,"control":"number"},"__proto__.x":{"description":"d","default":1,"control":"number"}}'
        ) as Catalog[string];
        const result = fileRows('behavior.yml', reserved, text('other: 1\n'));
        expect(result.rows.map((row) => row.state)).toEqual(['missing', 'missing']);
        const present = fileRows('behavior.yml', reserved, text('constructor: 3\n'));
        expect(present.rows[0].value).toBe(3);
        expect(present.rows[0].line).toBe(1);
    });

    it('reads the line of the key itself and never line one by default', () => {
        const rows = behaviorRows(
            '# a comment\n\nslurm:\n    resource: utwente\n    poll_min: 7\n'
        );
        expect(rowOf(rows, 'slurm.resource').line).toBe(4);
        expect(rowOf(rows, 'slurm.poll_min').line).toBe(5);
        expect(rowOf(rows, 'notes').line).toBeUndefined();
    });
});

describe('titles and sections', () => {
    it('reads underscores as spaces and capitalises the first letter of each segment', () => {
        expect(titleOf('slurm.poll_min')).toBe('Slurm: Poll min');
        expect(titleOf('terminal.font_px')).toBe('Terminal: Font px');
        expect(titleOf('wallpaper.dim')).toBe('Wallpaper: Dim');
        expect(titleOf('changes.keep')).toBe('Changes: Keep');
        expect(titleOf('rail')).toBe('Rail');
        expect(titleOf('deck.meta.kicker')).toBe('Deck > Meta: Kicker');
    });

    it('heads an option with its section, else its first segment in the same form', () => {
        expect(sectionOf('slurm.poll_min', undefined)).toBe('Slurm');
        expect(sectionOf('data_domains', undefined)).toBe('Data domains');
        expect(sectionOf('data_domains', 'Audit')).toBe('Audit');
    });
});

describe('the groups and the table of contents', () => {
    const FILES_FIXTURE: Catalog = {
        'appearance.yml': APPEARANCE,
        'behavior.yml': BEHAVIOR,
        'layout.yml': { rail: { description: 'The rail.', fields: { label: 'the words' } } },
        'present.yml': { 'deck.title': { description: 'Title.', default: 'x', control: 'text' } },
        'sources.yml': { roots: { description: 'Roots.', fields: { dir: 'a folder' } } },
        'local.yml': { notes: { description: 'Where notes live.' } }
    } as Catalog;

    function groupsOf(): Group[] {
        const ui = createUi();
        return settingsGroups(FILES_FIXTURE, () => text(''), thisBrowserRows(ui, true));
    }

    it('lists This browser first, then the six files in the order of the brief', () => {
        expect(groupsOf().map((group) => group.id)).toEqual([
            'this-browser',
            'appearance.yml',
            'behavior.yml',
            'layout.yml',
            'present.yml',
            'sources.yml',
            'local.yml'
        ]);
        expect(FILES).toEqual([
            'appearance.yml',
            'behavior.yml',
            'layout.yml',
            'present.yml',
            'sources.yml'
        ]);
    });

    it('orders the sections of a file by the first row each holds, with the file in every id', () => {
        const behavior = groupsOf().find((group) => group.id === 'behavior.yml');
        expect(behavior?.sections.map((section) => section.heading)).toEqual([
            'Slurm',
            'Audit',
            'Notes',
            'Usage tiers'
        ]);
        const ids = groupsOf().flatMap((group) => group.sections.map((section) => section.id));
        expect(ids).toContain('behavior.yml#notes');
        expect(ids).toContain('local.yml#notes');
        expect(new Set(ids).size).toBe(ids.length);
    });

    it('draws the rows of a section in catalog order, gathered under their section', () => {
        const behavior = groupsOf().find((group) => group.id === 'behavior.yml');
        const slurm = behavior?.sections.find((section) => section.heading === 'Slurm');
        expect(slurm?.rows.map((row) => row.path)).toEqual(['slurm.resource', 'slurm.poll_min']);
    });

    it('lists every group it is given and its headed sections in the table of contents', () => {
        const groups = groupsOf();
        expect(tocOf(groups).map((entry) => entry.id)).toEqual(groups.map((group) => group.id));
        const narrowed = groups
            .filter((group) => group.id === 'behavior.yml')
            .map((group) => ({
                ...group,
                sections: group.sections.filter((section) => section.heading === 'Notes')
            }));
        const toc = tocOf(narrowed);
        expect(toc.map((entry) => entry.id)).toEqual(['behavior.yml']);
        expect(toc[0].sections.map((section) => section.id)).toEqual(['behavior.yml#notes']);
    });
});

describe('the shipped catalog over the shipped texts', () => {
    it('makes a row for every option, none missing, mismatched or Modified', () => {
        const rows: ConfigRow[] = [];
        for (const file of FILES) {
            const content = readFileSync(join(engineDir(), 'config', file), 'utf8');
            const result = fileRows(file, shipped[file], text(content));
            expect(result.status).toBe('rows');
            rows.push(...result.rows);
        }
        expect(rows.length).toBe(
            FILES.reduce((sum, file) => sum + Object.keys(shipped[file]).length, 0)
        );
        expect(rows.filter((row) => row.state === 'missing').map((row) => row.key)).toEqual([]);
        expect(rows.filter((row) => row.mismatch).map((row) => row.key)).toEqual([]);
        expect(rows.filter((row) => row.modified).map((row) => row.key)).toEqual([]);
        const terminal = [
            'terminal.mac_option_is_meta',
            'terminal.copy_on_selection',
            'terminal.cursor_blinking',
            'terminal.cursor_style'
        ].map((key) => rows.find((row) => row.file === 'appearance.yml' && row.key === key));
        expect(terminal.map((row) => row?.control)).toEqual([
            'toggle',
            'toggle',
            'toggle',
            'choice'
        ]);
    });
});

describe('the language map over the shipped sources.yml', () => {
    it('is a family row of the section Files, set, with the language as key and the endings as value', () => {
        const content = readFileSync(join(engineDir(), 'config', 'sources.yml'), 'utf8');
        const result = fileRows('sources.yml', shipped['sources.yml'], text(content));
        expect(result.status).toBe('rows');
        const row = result.rows.find((one) => one.key === 'languages');
        expect(row).toMatchObject({ control: 'family', state: 'set', section: 'Files' });
        expect(Object.keys(row?.fields ?? {})).toEqual(['key', 'value']);
        expect(row?.description).toContain('plain text');
    });
});

describe('the This browser rows', () => {
    /** A store over a plain object, with the appearance a browser that saved nothing starts on. */
    function storeWith(saved: Record<string, unknown> | null) {
        const held: Record<string, string> = {};
        if (saved !== null) held[UI_KEY] = JSON.stringify({ version: UI_VERSION, ...saved });
        const ui = createUi();
        ui.loadUi({
            getItem: (key) => held[key] ?? null,
            setItem: (key, value) => {
                held[key] = value;
            }
        });
        return ui;
    }

    it('gives seven rows for a browser with nothing saved, none Modified', () => {
        const rows = thisBrowserRows(storeWith(null), true);
        expect(rows.map((row) => row.path)).toEqual([
            'theme',
            'code_theme',
            'text_size',
            'terminal_font',
            'crt',
            'wallpaper',
            'icons'
        ]);
        expect(rows.map((row) => row.id)).toEqual(rows.map((row) => `this-browser:${row.path}`));
        expect(rows.filter((row) => row.modified)).toEqual([]);
        for (const row of rows) {
            expect(row.title.length).toBeGreaterThan(0);
            expect(row.description.length).toBeGreaterThan(0);
        }
    });

    it('leaves the wallpaper row out under a theme that has none', () => {
        expect(thisBrowserRows(storeWith(null), false).map((row) => row.path)).not.toContain(
            'wallpaper'
        );
    });

    it('lists the wallpaper row under a theme without one while a wallpaper choice is saved', () => {
        const ui = storeWith(null);
        ui.setWallpaper(false);
        const row = thisBrowserRows(ui, false).find((one) => one.path === 'wallpaper');
        expect(row?.modified).toBe(true);
        resetBrowserRow(ui, row as NonNullable<typeof row>);
        expect(thisBrowserRows(ui, false).map((one) => one.path)).not.toContain('wallpaper');
    });

    it('marks a saved code theme Modified, and forgets it on Reset', () => {
        const ui = storeWith({ codeTheme: 'nord' });
        const before = thisBrowserRows(ui, true);
        expect(before.filter((row) => row.modified).map((row) => row.path)).toEqual(['code_theme']);
        const row = before.find((one) => one.path === 'code_theme');
        if (row === undefined) throw new Error('no code theme row');
        resetBrowserRow(ui, row);
        expect(ui.chosen().codeTheme).toBeNull();
        expect(thisBrowserRows(ui, true).filter((one) => one.modified)).toEqual([]);
    });

    it('marks each value this browser holds of its own Modified, and Reset forgets each', () => {
        const ui = storeWith(null);
        ui.setTheme('mocha');
        ui.setCrt(true);
        ui.setIcons(true);
        ui.setTextScale(1.2);
        ui.setTerminalFont(14);
        ui.setWallpaper(false);
        ui.setCodeTheme('nord');
        const rows = thisBrowserRows(ui, true);
        expect(rows.every((row) => row.modified)).toBe(true);
        for (const row of rows) resetBrowserRow(ui, row);
        expect(thisBrowserRows(ui, true).filter((row) => row.modified)).toEqual([]);
        expect(ui.chosen()).toEqual(ui.initial());
    });

    it('does not mark a value Modified that was set to what a fresh browser starts on', () => {
        const ui = storeWith(null);
        ui.setCrt(ui.initial().crt);
        ui.setTheme(ui.initial().theme);
        expect(thisBrowserRows(ui, true).filter((row) => row.modified)).toEqual([]);
    });
});

describe('a merged config with no catalog', () => {
    it('gives no file group, and the This browser group is still there', () => {
        const ui = createUi();
        const asked: string[] = [];
        const groups = settingsGroups(
            catalogOf({}),
            (file) => {
                asked.push(file);
                return text('');
            },
            thisBrowserRows(ui, true)
        );
        expect(groups.map((group) => group.id)).toEqual(['this-browser']);
        expect(groups[0].sections.flatMap((section) => section.rows)).toHaveLength(7);
        expect(asked).toEqual([]);
    });
});

describe('a press on a group of the table of contents', () => {
    const open = {
        id: 'behavior.yml',
        title: 'behavior.yml',
        sections: [{ id: 'a', heading: 'A' }]
    };
    const childless = { id: 'this-browser', title: 'This browser', sections: [] };

    it('closes an open group and opens a closed one, as a press on a collapsible row does', () => {
        expect(pressedGroups([], open)).toEqual(['behavior.yml']);
        expect(pressedGroups(['behavior.yml', 'layout.yml'], open)).toEqual(['layout.yml']);
    });

    it('leaves a group with no section as it is, since it has nothing to close', () => {
        expect(pressedGroups([], childless)).toEqual([]);
        expect(pressedGroups(['this-browser'], childless)).toEqual(['this-browser']);
    });

    it('toggles a group by its id for the keys that close and open it', () => {
        expect(toggledGroups([], 'layout.yml')).toEqual(['layout.yml']);
        expect(toggledGroups(['layout.yml'], 'layout.yml')).toEqual([]);
    });
});
