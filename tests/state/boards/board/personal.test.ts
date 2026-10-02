// The Personal board's pure functions over the real vocabulary and catalog: the statuses in the
// vocabulary's order, the cards sorted by it with unknown last, the search and the status toggles,
// the saved state read field by field, and where the title and Show in Files point.
//
// What this does NOT cover: anything drawn or pressed (tests/views/boards/personal.test.ts, and the
// look on landing for the presses themselves).

import { describe, expect, it } from 'vitest';
import {
    engineDir,
    glyphCatalog,
    loadConfig,
    textCatalog,
    vocabCatalog
} from '../../../../src/lib/data/sources/config.ts';
import { setCatalog, setGlyphs } from '../../../../src/lib/state/shared/words/text.ts';
import { setVocab } from '../../../../src/lib/state/shared/words/tones.ts';
import {
    emptyPersonalState,
    filterCards,
    folderTarget,
    manifestTarget,
    parsePersonalState,
    sideCards,
    sideStatuses,
    sourceLine,
    toggleMore,
    toggleStatus,
    type SideCard
} from '../../../../src/lib/state/boards/board/personal.ts';
import { rooted, side } from './side-fixture.ts';

const { config } = loadConfig(engineDir());
setCatalog(textCatalog(config));
setGlyphs(glyphCatalog(config));
setVocab(vocabCatalog(config));

const STATUSES = sideStatuses(config);

describe('sideStatuses', () => {
    it('are the keys of side_project_status in the vocabulary order, each with words, a glyph and a tone', () => {
        expect(STATUSES.map((one) => one.key)).toEqual(['running', 'building', 'idea', 'parked']);
        expect(STATUSES.map((one) => one.tone)).toEqual(['green', 'brass', 'cyan', 'grey']);
        expect(STATUSES.map((one) => one.glyph)).toEqual(['live', 'active', 'idea', 'snooze']);
        expect(STATUSES.map((one) => one.label)).toEqual(['running', 'building', 'idea', 'parked']);
    });

    it('reads only a map of maps, and a row that is not a map is skipped', () => {
        expect(sideStatuses({})).toEqual([]);
        expect(sideStatuses({ side_project_status: ['idea'] })).toEqual([]);
        expect(
            sideStatuses({
                side_project_status: { a: 'x', b: { label: 'B', icon: 'idea', color: '#16a34a' } }
            }).map((one) => one.key)
        ).toEqual(['b']);
    });

    it('does not read an own __proto__ key as a status', () => {
        const rows = JSON.parse(
            '{"__proto__": {"label": "p"}, "idea": {"label": "i", "icon": "idea"}}'
        ) as Record<string, unknown>;
        expect(sideStatuses({ side_project_status: rows }).map((one) => one.key)).toEqual(['idea']);
    });
});

describe('sideCards', () => {
    it('sorts by the vocabulary order, then title, with unknown last', () => {
        const cards = sideCards(
            [
                side('zeta', { status: 'idea', title: 'Zeta' }),
                side('mystery', { status: 'unknown', title: 'Aaa' }),
                side('beta', { status: 'running', title: 'beta' }),
                side('alpha', { status: 'idea', title: 'Alpha' }),
                side('gamma', { status: 'parked', title: 'Gamma' }),
                side('delta', { status: 'building', title: 'Delta' })
            ],
            STATUSES
        );
        expect(cards.map((card) => card.project.id)).toEqual([
            'side:beta',
            'side:delta',
            'side:alpha',
            'side:zeta',
            'side:gamma',
            'side:mystery'
        ]);
    });

    it('draws a status the vocabulary no longer holds as unknown', () => {
        const [card] = sideCards([side('x', { status: 'retired' })], STATUSES);
        expect(card.status.key).toBe('unknown');
        expect(card.status.tone).toBe('grey');
        expect(card.status.label).not.toBe('');
    });

    it('gives each card the status chip of its own status', () => {
        const [card] = sideCards([side('x', { status: 'running' })], STATUSES);
        expect(card.status).toEqual(STATUSES[0]);
    });

    it('keeps the order of titles that differ only in case, and does not throw on an empty list', () => {
        expect(sideCards([], STATUSES)).toEqual([]);
        const cards = sideCards(
            [side('b', { title: 'apple' }), side('a', { title: 'Banana' })],
            STATUSES
        );
        expect(cards.map((card) => card.project.title)).toEqual(['apple', 'Banana']);
    });
});

describe('filterCards', () => {
    const cards: SideCard[] = sideCards(
        [
            side('game', {
                title: 'GPU Game Boy',
                eli5: 'An emulator',
                next: 'Stage 1',
                status: 'idea'
            }),
            side('os', {
                title: 'Scripted OS',
                eli5: 'A hobby operating system for ARM64 and games',
                status: 'building'
            }),
            side('tool', { title: 'Tool', next: 'Port the GAME loop', status: 'running' }),
            side('plain', { title: 'Plain', status: 'parked' })
        ],
        STATUSES
    );

    it('keeps every card for the empty state', () => {
        expect(filterCards(cards, emptyPersonalState())).toHaveLength(4);
    });

    it('searches title, eli5 and next, whatever the case', () => {
        const found = filterCards(cards, { ...emptyPersonalState(), search: 'GAME' });
        expect(found.map((card) => card.project.id).sort()).toEqual([
            'side:game',
            'side:os',
            'side:tool'
        ]);
        expect(
            filterCards(cards, { ...emptyPersonalState(), search: '  stage 1 ' }).map(
                (card) => card.project.id
            )
        ).toEqual(['side:game']);
    });

    it('does not search the links or the source line', () => {
        const linked = sideCards([side('l', { links: ['https://needle.org'] })], STATUSES);
        expect(filterCards(linked, { ...emptyPersonalState(), search: 'needle' })).toEqual([]);
        expect(filterCards(linked, { ...emptyPersonalState(), search: 'side-projects' })).toEqual(
            []
        );
    });

    it('hides the cards of a status that is toggled off', () => {
        const found = filterCards(cards, { ...emptyPersonalState(), hidden: ['idea'] });
        expect(found.map((card) => card.status.key)).not.toContain('idea');
        expect(found).toHaveLength(3);
    });

    it('applies the search and the toggles together', () => {
        const found = filterCards(cards, {
            ...emptyPersonalState(),
            search: 'game',
            hidden: ['idea']
        });
        expect(found.map((card) => card.project.id).sort()).toEqual(['side:os', 'side:tool']);
    });

    it('never hides an unknown card by a toggle', () => {
        const unknown = sideCards([side('u', { status: 'unknown' })], STATUSES);
        expect(
            filterCards(unknown, { ...emptyPersonalState(), hidden: ['idea', 'unknown'] })
        ).toHaveLength(1);
    });
});

describe('the saved state', () => {
    it('is empty for anything that is not a map', () => {
        for (const value of [undefined, null, 3, 'x', []]) {
            expect(parsePersonalState(value)).toEqual(emptyPersonalState());
        }
    });

    it('reads each field apart, so a wrong one costs that field alone', () => {
        expect(parsePersonalState({ search: 'q', hidden: 3 })).toEqual({
            search: 'q',
            hidden: [],
            more: []
        });
        expect(parsePersonalState({ search: 3, hidden: ['idea'] })).toEqual({
            search: '',
            hidden: ['idea'],
            more: []
        });
        expect(parsePersonalState({ hidden: ['idea', 3, 'parked'] })).toEqual({
            search: '',
            hidden: ['idea', 'parked'],
            more: []
        });
    });

    it('reads the cut cards apart from the rest of the state', () => {
        expect(parsePersonalState({ more: ['side:a', 3] }).more).toEqual(['side:a']);
        expect(parsePersonalState({ more: 'side:a' }).more).toEqual([]);
    });

    it('toggles one card whole and cut again, once in the list', () => {
        const open = toggleMore(emptyPersonalState(), 'side:a');
        expect(open.more).toEqual(['side:a']);
        expect(toggleMore(open, 'side:a').more).toEqual([]);
    });

    it('toggles a status off and on again, once in the list', () => {
        const off = toggleStatus(emptyPersonalState(), 'idea');
        expect(off.hidden).toEqual(['idea']);
        expect(toggleStatus(off, 'idea').hidden).toEqual([]);
        expect(toggleStatus(toggleStatus(off, 'parked'), 'idea').hidden).toEqual(['parked']);
    });
});

describe('where a card points', () => {
    it('opens a hub side project at its own manifest and shows its folder', () => {
        const project = side('residual');
        expect(manifestTarget(project)).toEqual({
            root: 'hub',
            path: 'side-projects/residual/project.yml',
            label: 'residual'
        });
        expect(folderTarget(project)).toEqual({ root: 'hub', path: 'side-projects/residual' });
        expect(sourceLine(project)).toBe('side-projects/residual');
    });

    it('opens a repository at .oculus/project.yml under its key and shows its top folder', () => {
        const project = rooted('my-repo', '/home/me/my repo', { title: 'My repo' });
        expect(manifestTarget(project)).toEqual({
            root: 'my-repo',
            path: '.oculus/project.yml',
            label: 'My repo'
        });
        expect(folderTarget(project)).toEqual({ root: 'my-repo', path: '' });
        expect(sourceLine(project)).toBe('my-repo');
    });
});
