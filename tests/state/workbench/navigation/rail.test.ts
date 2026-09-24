// The rail's list of pages: the rule of data/sources/config/rail.ts over `rail:` (an entry kept, an
// entry empty, a page key named twice, a page key naming no arrangement, a glyph the vocabulary
// does not hold), the findings a hand edit earns, the pages the page hands the shell, and the list
// a Settings tab is editing before it is saved.
//
// Nothing here renders; every case is over a pure function and its revert names the line that
// makes it red.

import { describe, expect, it } from 'vitest';
import {
    arrangementKeys,
    readRail,
    railFindings
} from '../../../../src/lib/data/sources/config/rail.ts';
import {
    SETTINGS_VIEW,
    configRail,
    moveRailEntry,
    railDraft,
    railPages,
    railTyped,
    sameRail,
    withRailDraft
} from '../../../../src/lib/state/workbench/navigation/rail.ts';
import { engineDir, loadConfig, textCatalog } from '../../../../src/lib/data/sources/config.ts';

const { config } = loadConfig(engineDir());
const catalog = textCatalog(config);

const PAGES = ['focus', 'views'];
const GLYPHS = ['compass', 'sliders'];

const FOCUS = { label: 'Focus', glyph: 'compass', page: 'focus' };
const VIEWS = { label: 'Views', glyph: 'sliders', page: 'views' };

describe('the rule over the rail list', () => {
    it('keeps an entry of three strings whose page is an arrangement, in list order', () => {
        // revert: src/lib/data/sources/config/rail.ts:106 => delete
        expect(readRail([VIEWS, FOCUS], PAGES, GLYPHS)).toEqual({
            entries: [VIEWS, FOCUS],
            problems: []
        });
    });

    it('refuses an entry with an empty or a blank label, glyph or page', () => {
        // revert: src/lib/data/sources/config/rail.ts:40 => return typeof value === 'string' ? value : null;
        const read = readRail(
            [
                { ...FOCUS, label: '' },
                { ...FOCUS, glyph: '  ' },
                { ...FOCUS, page: '' }
            ],
            PAGES,
            GLYPHS
        );
        expect(read.entries).toEqual([]);
        expect(read.problems.map((one) => one.why)).toEqual(['label', 'glyph', 'page']);
    });

    it('keeps the first of two entries naming one page and refuses the second', () => {
        // revert: src/lib/data/sources/config/rail.ts:101 => } else if (false) {
        const read = readRail([FOCUS, { ...FOCUS, label: 'Again' }], PAGES, GLYPHS);
        expect(read.entries).toEqual([FOCUS]);
        expect(read.problems).toEqual([{ index: 1, why: 'repeated', page: 'focus' }]);
    });

    it('refuses a page key no arrangement holds, a reserved-looking one included', () => {
        // revert: src/lib/data/sources/config/rail.ts:99 => else if (false) {
        const read = readRail(
            [
                { ...FOCUS, page: 'nowhere' },
                { ...FOCUS, page: '__proto__' },
                { ...FOCUS, page: 'constructor' }
            ],
            PAGES,
            GLYPHS
        );
        expect(read.entries).toEqual([]);
        expect(read.problems.map((one) => one.why)).toEqual([
            'page_unknown',
            'page_unknown',
            'page_unknown'
        ]);
    });

    it('refuses a glyph the vocabulary does not hold only when it is given one', () => {
        // revert: src/lib/data/sources/config/rail.ts:103 => } else if (false) {
        const odd = { ...FOCUS, glyph: 'nonesuch' };
        expect(readRail([odd], PAGES, GLYPHS).problems).toEqual([
            { index: 0, why: 'glyph_unknown', page: 'focus' }
        ]);
        expect(readRail([odd], PAGES).entries).toEqual([odd]);
    });

    it('refuses an item that is not a map and reads no list as no entries', () => {
        // revert: src/lib/data/sources/config/rail.ts:89 => problems.push({ index, why: 'label', page: '' });
        expect(readRail(['focus', FOCUS], PAGES, GLYPHS)).toEqual({
            entries: [FOCUS],
            problems: [{ index: 0, why: 'shape', page: '' }]
        });
        expect(readRail({ focus: FOCUS }, PAGES)).toEqual({ entries: [], problems: [] });
        expect(arrangementKeys(['focus'])).toEqual([]);
    });
});

describe('the findings of a hand edit', () => {
    const FILE = '/engine/config/layout.yml';

    it('reports each refused entry in the catalog words, keyed by its place', () => {
        // revert: src/lib/data/sources/config/rail.ts:130 => key: 'rail',
        const found = railFindings(
            {
                arrangements: { focus: {} },
                glyphs: { compass: 'C' },
                rail: [FOCUS, FOCUS, { ...FOCUS, page: 'gone' }]
            },
            FILE,
            catalog
        );
        expect(found).toEqual([
            {
                file: FILE,
                key: 'rail[1]',
                message: catalog['findings.rail.repeated'].replace('{0}', 'focus')
            },
            {
                file: FILE,
                key: 'rail[2]',
                message: catalog['findings.rail.page_unknown'].replace('{0}', 'gone')
            }
        ]);
    });

    it('reports a rail that is not a list, and nothing for a config without the key', () => {
        // revert: src/lib/data/sources/config/rail.ts:124 => if (false) {
        expect(railFindings({ rail: 'focus' }, FILE, catalog)).toEqual([
            { file: FILE, key: 'rail', message: catalog['findings.rail.not_a_list'] }
        ]);
        expect(railFindings({}, FILE, catalog)).toEqual([]);
    });

    it('finds nothing wrong with the shipped rail list', () => {
        // revert: config/layout.yml:10 => - { label: "Focus", glyph: nonesuch, page: focus }
        expect(railFindings(config, FILE, catalog)).toEqual([]);
    });
});

describe('the rail pages the page hands the shell', () => {
    it('pairs each kept entry with the arrangement its page names', () => {
        // revert: src/lib/state/workbench/navigation/rail.ts:40 => node: null
        const node = { root: { kind: 'pane', view: 'focus' } };
        expect(
            railPages({ arrangements: { focus: node }, rail: [FOCUS, { ...FOCUS, page: 'x' }] })
        ).toEqual([{ ...FOCUS, node }]);
        expect(railPages(undefined)).toEqual([]);
    });

    it('leaves out an entry whose glyph the vocabulary does not hold, as its finding says', () => {
        // revert: src/lib/state/workbench/navigation/rail.ts:37 => const read = readRail(config.rail, arrangementKeys(arrangements));
        const node = { root: { kind: 'pane', view: 'focus' } };
        const held = {
            arrangements: { focus: node, views: node },
            glyphs: { compass: 'C', sliders: 'S' },
            rail: [FOCUS, { ...VIEWS, glyph: 'nonesuch' }]
        };
        expect(railPages(held)).toEqual([{ ...FOCUS, node }]);
        expect(railFindings(held, '/engine/config/layout.yml', catalog)).toEqual([
            {
                file: '/engine/config/layout.yml',
                key: 'rail[1]',
                message: catalog['findings.rail.glyph_unknown'].replace('{0}', 'views')
            }
        ]);
    });

    it('reads the shipped list in its order, Views and Settings last', () => {
        // revert: config/layout.yml:22 => - { label: "Views and Settings", glyph: sliders, page: focus }
        const pages = railPages(config);
        expect(pages.map((one) => one.label)).toEqual([
            'Focus',
            'Projects',
            'Academic Life',
            'Pillars',
            'Feeds',
            'References',
            'Present',
            'Explorer',
            'Sessions',
            'Info/more',
            'Calendar',
            'Inbox',
            'Views and Settings'
        ]);
        expect(pages.every((one) => one.node !== undefined)).toBe(true);
    });
});

describe('the rail list a Settings tab is editing', () => {
    it('reads what the tab holds as three strings per row, and nothing for no list', () => {
        // revert: src/lib/data/sources/config/rail.ts:54 => return { label: String(one.label), glyph: text(one.glyph), page: text(one.page) };
        expect(railDraft({ rail: [{ label: 3, glyph: 'compass' }] })).toEqual([
            { label: '', glyph: 'compass', page: '' }
        ]);
        expect(railDraft({ other: 1 })).toBe(null);
        expect(railDraft(null)).toBe(null);
    });

    it('sets the list beside what else the tab holds, and takes it away on null', () => {
        // revert: src/lib/state/workbench/navigation/rail.ts:63 => if (rail === null) held.rail = [];
        const set = withRailDraft({ keep: true }, [FOCUS]);
        expect(set).toEqual({ keep: true, rail: [FOCUS] });
        expect(withRailDraft(set, null)).toEqual({ keep: true });
    });

    it('holds unsaved text only in a Settings tab whose list differs from the file', () => {
        // revert: src/lib/state/workbench/navigation/rail.ts:92 => return draft !== null;
        const state = { rail: [FOCUS] };
        expect(railTyped(SETTINGS_VIEW, state, [FOCUS])).toBe(false);
        expect(railTyped(SETTINGS_VIEW, state, [VIEWS])).toBe(true);
        expect(railTyped('status', state, [VIEWS])).toBe(false);
        expect(railTyped(SETTINGS_VIEW, {}, [VIEWS])).toBe(false);
        expect(sameRail([FOCUS, VIEWS], [VIEWS, FOCUS])).toBe(false);
    });

    it('moves a row one place and leaves the list as it is at either end', () => {
        // revert: src/lib/state/workbench/navigation/rail.ts:98 => if (at < 0 || at >= rail.length) return [...rail];
        expect(moveRailEntry([FOCUS, VIEWS], 1, -1)).toEqual([VIEWS, FOCUS]);
        expect(moveRailEntry([FOCUS, VIEWS], 0, -1)).toEqual([FOCUS, VIEWS]);
        expect(moveRailEntry([FOCUS, VIEWS], 1, 1)).toEqual([FOCUS, VIEWS]);
    });

    it('reads the file list whole, a broken entry included, for the reader to mend', () => {
        // revert: src/lib/state/workbench/navigation/rail.ts:109 => return railDraft({ rail: [] }) ?? [];
        expect(configRail({ rail: [FOCUS, { label: 'Broken' }] })).toEqual([
            FOCUS,
            { label: 'Broken', glyph: '', page: '' }
        ]);
        expect(configRail(undefined)).toEqual([]);
    });
});
