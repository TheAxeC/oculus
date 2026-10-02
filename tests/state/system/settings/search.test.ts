// Layer 2, client-state tests. The Settings view's search over its rows: words that must occur in a
// row's title, key path, section or description, `@modified` and `@id:` as VS Code's search box has
// them, the count of the rows kept, and the groups and sections that still hold one.
//
// What this does NOT cover: the box the query is typed in and the count drawn beside it
// (tests/views/system/workbench/settings.test.ts).

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { engineDir } from '../../../../src/lib/data/sources/config.ts';
import type { Catalog } from '../../../../src/lib/data/sources/config/catalog/options.ts';
import type { FileText } from '../../../../src/lib/state/sources/fs-transport.ts';
import { shipped, text } from './fixture.ts';
import { createUi } from '../../../../src/lib/state/workbench/ui.svelte.ts';
import { thisBrowserRows } from '../../../../src/lib/state/system/config/browser.ts';
import {
    FILES,
    settingsGroups,
    type Group
} from '../../../../src/lib/state/system/config/groups.ts';
import {
    hasModifiedFilter,
    searchGroups,
    withModifiedFilter
} from '../../../../src/lib/state/system/config/search.ts';

const CATALOG: Catalog = {
    'behavior.yml': {
        'slurm.host': {
            description: 'The cluster jobs are polled on.',
            default: 'u',
            control: 'text'
        },
        'slurm.poll_min': { description: 'Minutes between looks.', default: 20, control: 'number' },
        'audit.sweep': {
            description: 'How often the scan runs.',
            default: 5,
            control: 'number',
            section: 'Polling'
        },
        'notes.dir': { description: 'Where the notes are.', default: 'n', control: 'text' }
    },
    'appearance.yml': {
        'terminal.cursor_style': {
            description: 'The shape of the cursor. Not @nonsense at all.',
            default: 'block',
            control: 'choice',
            values: ['block', 'line']
        },
        'terminal.cursor_blinking': {
            description: 'Whether the cursor blinks.',
            default: false,
            control: 'toggle'
        }
    },
    'local.yml': { port: { description: 'The port the server listens on.' } }
};

/** The texts of the fixture: poll_min and the cursor style differ from their defaults. */
function texts(file: string): FileText {
    if (file === 'behavior.yml') return text('slurm:\n    host: u\n    poll_min: 5\n');
    if (file === 'appearance.yml') {
        return text('terminal:\n    cursor_style: line\n    cursor_blinking: false\n');
    }
    return text('');
}

function groups(): Group[] {
    return settingsGroups(CATALOG, texts, thisBrowserRows(createUi(), true));
}

/** The ids of the rows of a result, in the order drawn. */
function idsOf(result: { groups: Group[] }): string[] {
    return result.groups.flatMap((group) =>
        group.sections.flatMap((section) => section.rows.map((row) => row.id))
    );
}

/** The id of every row, in the order the groups draw them. */
function every(): string[] {
    return idsOf({ groups: groups() });
}

describe('the words of a search', () => {
    it('keeps the rows holding the word in title, key path, section or description', () => {
        const result = searchGroups(groups(), 'poll');
        expect(idsOf(result)).toEqual([
            'behavior.yml:slurm.host',
            'behavior.yml:slurm.poll_min',
            'behavior.yml:audit.sweep'
        ]);
        expect(result.count).toBe(3);
        for (const id of every()) {
            const row = groups()
                .flatMap((group) => group.sections.flatMap((section) => section.rows))
                .find((one) => one.id === id);
            const holds = [row?.title, row?.path, row?.section, row?.description].some((field) =>
                field?.toLowerCase().includes('poll')
            );
            expect(idsOf(result).includes(id)).toBe(holds);
        }
    });

    it('needs every word of the query, each in any of the four', () => {
        expect(idsOf(searchGroups(groups(), 'poll minutes'))).toEqual([
            'behavior.yml:slurm.poll_min'
        ]);
        expect(idsOf(searchGroups(groups(), 'poll  sweep'))).toEqual(['behavior.yml:audit.sweep']);
    });

    it('is not sensitive to case, and takes part for the This browser rows', () => {
        expect(idsOf(searchGroups(groups(), 'POLL'))).toEqual(
            idsOf(searchGroups(groups(), 'poll'))
        );
        const theme = idsOf(searchGroups(groups(), 'theme'));
        expect(theme).toContain('this-browser:theme');
        expect(theme).toContain('this-browser:code_theme');
    });

    it('keeps every row for an empty query and for spaces alone', () => {
        expect(idsOf(searchGroups(groups(), ''))).toEqual(every());
        expect(idsOf(searchGroups(groups(), '   '))).toEqual(every());
        expect(searchGroups(groups(), '').count).toBe(every().length);
    });

    it('takes an unknown @word as the text it is', () => {
        expect(idsOf(searchGroups(groups(), '@nonsense'))).toEqual([
            'appearance.yml:terminal.cursor_style'
        ]);
    });

    it('finds no row for @nonsense in the shipped catalog', () => {
        const shippedGroups = settingsGroups(
            shipped,
            (file) =>
                text(
                    FILES.includes(file)
                        ? readFileSync(join(engineDir(), 'config', file), 'utf8')
                        : ''
                ),
            thisBrowserRows(createUi(), true)
        );
        const result = searchGroups(shippedGroups, '@nonsense');
        expect(result.count).toBe(0);
        expect(result.groups).toEqual([]);
    });
});

describe('@modified', () => {
    const MODIFIED = ['behavior.yml:slurm.poll_min', 'appearance.yml:terminal.cursor_style'];

    it('keeps only the Modified rows, whatever the case of the word', () => {
        for (const query of ['@modified', '@Modified', '@MODIFIED']) {
            expect(new Set(idsOf(searchGroups(groups(), query)))).toEqual(new Set(MODIFIED));
        }
    });

    it('combines with a word', () => {
        expect(idsOf(searchGroups(groups(), '@modified poll'))).toEqual([
            'behavior.yml:slurm.poll_min'
        ]);
        expect(idsOf(searchGroups(groups(), 'poll @modified'))).toEqual([
            'behavior.yml:slurm.poll_min'
        ]);
    });
});

describe('@id:', () => {
    it('keeps the rows whose key path holds the text, whatever its case', () => {
        const expected = [
            'appearance.yml:terminal.cursor_style',
            'appearance.yml:terminal.cursor_blinking'
        ];
        expect(new Set(idsOf(searchGroups(groups(), '@id:CURSOR')))).toEqual(new Set(expected));
        expect(new Set(idsOf(searchGroups(groups(), '@id:cursor')))).toEqual(new Set(expected));
    });

    it('keeps every row for @id: with nothing after it', () => {
        expect(idsOf(searchGroups(groups(), '@id:'))).toEqual(every());
    });

    it('looks at the key path alone, not at the description', () => {
        expect(idsOf(searchGroups(groups(), '@id:minutes'))).toEqual([]);
    });
});

describe('what a result carries', () => {
    it('lists only the groups and sections that still hold a row', () => {
        const result = searchGroups(groups(), 'poll');
        expect(result.groups.map((group) => group.id)).toEqual(['behavior.yml']);
        expect(result.groups[0].sections.map((section) => section.heading)).toEqual([
            'Slurm',
            'Polling'
        ]);
    });

    it('keeps a row it was told to keep whatever the query', () => {
        const result = searchGroups(groups(), 'poll', ['appearance.yml:terminal.cursor_blinking']);
        expect(idsOf(result)).toContain('appearance.yml:terminal.cursor_blinking');
        expect(result.count).toBe(4);
    });

    it('drops a group that holds no row once a query is typed, and keeps it for an empty one', () => {
        const broken = settingsGroups(
            CATALOG,
            (file) => (file === 'behavior.yml' ? text('slurm: [\n') : texts(file)),
            []
        );
        expect(searchGroups(broken, 'cursor').groups.map((group) => group.id)).toEqual([
            'appearance.yml'
        ]);
        expect(searchGroups(broken, '   ').groups.map((group) => group.id)).toEqual([
            'appearance.yml',
            'behavior.yml',
            'local.yml'
        ]);
        expect(searchGroups(broken, '').groups[1].status).toBe('unparsed');
    });

    it('counts the seven This browser rows when no config file is described', () => {
        const only = settingsGroups({}, () => text(''), thisBrowserRows(createUi(), true));
        expect(searchGroups(only, '').count).toBe(7);
        expect(searchGroups(only, '@id:crt').count).toBe(1);
        expect(searchGroups(only, '@modified').count).toBe(0);
    });
});

describe('the Modified filter as the filter button sets it', () => {
    it('puts @modified at the end of a query and takes every spelling of it out', () => {
        expect(withModifiedFilter('', true)).toBe('@modified');
        expect(withModifiedFilter('poll', true)).toBe('poll @modified');
        expect(withModifiedFilter('@Modified  poll @MODIFIED', true)).toBe('poll @modified');
        expect(withModifiedFilter('poll @modified', false)).toBe('poll');
        expect(withModifiedFilter('@modified', false)).toBe('');
    });

    it('says whether a query carries it, whatever the case', () => {
        expect(hasModifiedFilter('poll @Modified')).toBe(true);
        expect(hasModifiedFilter('poll @modifiedx')).toBe(false);
        expect(hasModifiedFilter('')).toBe(false);
    });
});
