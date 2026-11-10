// Layer 2, client state test. A venue's card tones and its biennial mark, and the Pillars view's
// archival section, read by the words of config/catalogs/vocab.yml: `venue_ranks` and
// `venue_costs` tone the rank and the cost tags by the first fragment the text holds,
// `venue_biennial` marks a venue on the month ribbon (state/sources/registries/venues.ts), a JIF
// written as a text of `venue_no_jif` is left out of the venue line of a project card
// (state/boards/board/presets.ts `venueText`), and the kind of `pillar_kinds` that carries
// `archival: true` is the section of the Archival card and of the muted cards
// (state/boards/structure/lines.ts). Oculus's words are read from its own
// configuration; a hub's are given as the words the views pass.

import { describe, expect } from 'vitest';
import type { Pillar, Venue } from '../../../../src/lib/data/model/index.ts';
import { engineDir, loadConfig } from '../../../../src/lib/data/sources/config.ts';
import { archivalKind, lineKinds } from '../../../../src/lib/state/boards/structure/lines.ts';
import { venueText } from '../../../../src/lib/state/boards/board/presets.ts';
import {
    isBiennial,
    noJif,
    timeline,
    venueTone
} from '../../../../src/lib/state/sources/registries/venues.ts';
import { it } from '../../../fixtures/scratch.ts';

/** Oculus's merged configuration, whose vocabulary the helpers read. */
const OCULUS = loadConfig(engineDir()).config;

/** A venue of the hub `root` with the fields given. */
function venue(id: string, fields: Partial<Venue>, root = 'hub'): Venue {
    return { id, name: id, themes: [], root, ...fields };
}

describe("a venue's words", () => {
    it('tones the rank and the cost by the first fragment of venue_ranks and venue_costs the text holds (G13)', () => {
        const ranks = ['Q1', 'CORE A*', 'SJR Q2', 'CORE B', 'prestige (biennial)', undefined];
        expect(ranks.map((one) => venueTone(one, 'venue_ranks', OCULUS))).toEqual([
            'violet',
            'violet',
            'blue',
            'grey',
            'violet',
            'grey'
        ]);
        const costs = ['free (subscription; hybrid OA optional)', 'hybrid (APC for OA)', 'OA-APC'];
        expect(costs.map((one) => venueTone(one, 'venue_costs', OCULUS))).toEqual([
            'green',
            'amber',
            'red'
        ]);
        const own = { ...OCULUS, venue_ranks: { 'core b': '#16a34a' } };
        expect([
            venueTone('CORE B', 'venue_ranks', own),
            venueTone('Q1', 'venue_ranks', own)
        ]).toEqual(['green', 'grey']);
    });

    it("marks a venue biennial by a text of venue_biennial of its own hub's words (G13)", () => {
        const every = venue('every', { timing: 'every two years', deadlineMonth: 'Mar' }, 'two');
        const odd = venue('odd', {
            quartile: 'prestige (Biennial, odd yrs)',
            deadlineMonth: 'Mar'
        });
        expect([isBiennial(odd, OCULUS), isBiennial(every, OCULUS)]).toEqual([true, false]);
        const words = (hub?: string) =>
            hub === 'two' ? { venue_biennial: ['every two years'] } : OCULUS;
        const chips = timeline([odd, every], 1, words).months[2].deadlines;
        expect(chips.map((chip) => [chip.venue.id, chip.biennial])).toEqual([
            ['odd', true],
            ['every', true]
        ]);
    });

    it("leaves out a JIF written as a text of venue_no_jif of its own hub's words (G13)", () => {
        const written = ['none', ' None ', '-', ' - ', '', '6.5', 'n/a'];
        expect(written.map((jif) => noJif(jif, OCULUS))).toEqual([
            true,
            true,
            true,
            true,
            true,
            false,
            false
        ]);
        const own = { ...OCULUS, venue_no_jif: ['n/a'] };
        expect([noJif('n/a', own), noJif('none', own), noJif(undefined, own)]).toEqual([
            true,
            false,
            true
        ]);
        const line = (jif: string, words: Record<string, unknown>) =>
            venueText(venue('v', { name: 'Venue', quartile: 'Q1', jif }), words);
        expect([line('none', OCULUS), line('6.5', OCULUS), line('none', own)]).toEqual([
            'Venue | Q1',
            'Venue | Q1 | JIF 6.5',
            'Venue | Q1 | JIF none'
        ]);
    });
});

describe('the archival pillar kind', () => {
    it('marks the section of the kind that carries archival, and none when two carry it (G13)', () => {
        const lines: Pillar[] = [
            { id: 'a', title: 'A', kind: 'pillar', fundingIds: [], projectIds: [] },
            { id: 'b', title: 'B', kind: 'offpillar', fundingIds: [], projectIds: [] }
        ];
        const marked = (words: Record<string, unknown>) =>
            lineKinds(lines, words).map((section) => [section.key, section.archival]);
        expect(archivalKind(OCULUS)).toBe('offpillar');
        expect(marked(OCULUS)).toEqual([
            ['pillar', false],
            ['provisional', false],
            ['offpillar', true],
            ['', false]
        ]);
        const twice = {
            pillar_kinds: [
                { key: 'pillar', archival: true },
                { key: 'offpillar', archival: true }
            ]
        };
        expect(archivalKind(twice)).toBe(undefined);
        expect(marked(twice)).toEqual([
            ['pillar', false],
            ['offpillar', false],
            ['', false]
        ]);
    });
});
