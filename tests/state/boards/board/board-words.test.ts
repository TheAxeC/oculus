// The board's small readers: the venue and author lines, the first sentence, the day counts, the
// slug, the stats and type counts, staleness, sizes and dissemination. Everything here is pure, so
// nothing reads a file and nothing renders.

import { describe, expect, it } from 'vitest';
import {
    DEADLINE_SOON,
    authorLine,
    boardItems,
    daysUntil,
    disseminated,
    firstSentence,
    humanSize,
    isStale,
    slug,
    stats,
    typeCounts,
    venueText
} from '../../../../src/lib/state/boards/board/index.ts';
import type { Id, Snapshot } from '../../../../src/lib/data/model.ts';
import { present } from '../../../fixtures/present.ts';
import {
    CONFIG,
    project,
    venue,
    snapshot,
    SNAPSHOT,
    PROJECTS,
    ITEMS,
    item,
    over
} from './board-fixture.ts';

describe('venueText and authorLine', () => {
    it('leaves out a JIF the registry wrote as nothing', () => {
        expect(venueText(venue('x', { name: 'X', jif: 'none' }))).toBe('X');
        expect(venueText(venue('x', { name: 'X', jif: ' - ' }))).toBe('X');
        expect(venueText(venue('x', { name: 'X', jif: '2.1' }))).toBe('X | JIF 2.1');
    });

    it('keeps an authors line that was written as one string', () => {
        expect(authorLine(project('x', 'ideas', { authors: 'Faes and others' }))).toBe(
            'Faes and others'
        );
        expect(authorLine(project('x', 'ideas', { authors: [], lead: 'Faes' }))).toBe('Faes');
    });
});

describe('firstSentence', () => {
    it('takes the first sentence and no more', () => {
        expect(firstSentence('One thing. Then another.', 130)).toBe('One thing.');
        expect(firstSentence('Ask this? Then that.', 130)).toBe('Ask this?');
    });

    it('collapses the whitespace of a line broken across a manifest', () => {
        expect(firstSentence('One\n   thing here.', 130)).toBe('One thing here.');
    });

    it('keeps a paragraph with no full stop whole', () => {
        expect(firstSentence('no full stop at all', 130)).toBe('no full stop at all');
    });

    it('cuts on a word boundary and says that it cut', () => {
        expect(firstSentence('aaa bbb ccc ddd', 9)).toBe('aaa bbb...');
    });

    it('gives nothing back for nothing', () => {
        expect(firstSentence('   ', 130)).toBe('');
    });
});

describe('daysUntil', () => {
    const now = Date.UTC(2026, 8, 10, 15, 30);

    it('counts whole days from the reader own day, whatever the hour', () => {
        expect(daysUntil('2026-09-10', now)).toBe(0);
        expect(daysUntil('2026-09-24', now)).toBe(DEADLINE_SOON);
        expect(daysUntil('2026-09-01', now)).toBe(-9);
    });

    it('gives nothing for a string that names no day', () => {
        expect(daysUntil('when it is ready', now)).toBe(null);
    });
});

describe('slug', () => {
    it('turns the words of a bucket into an id', () => {
        expect(slug('in progress')).toBe('in-progress');
        expect(slug('dead-ends')).toBe('dead-ends');
        expect(slug(' Papers & Outputs ')).toBe('papers-outputs');
    });
});

describe('stats', () => {
    it('counts the board, the submit-ready chip, the blocked lane and the dated projects', () => {
        const { items, snapshot: snap } = over({
            alpha: { chips: ['submit-ready'] },
            bravo: { focus: 'blocked' },
            charlie: { deadline: '2030-01-01' }
        });
        const found = stats(items, snap.entities.venues, CONFIG);

        expect(found.active).toBe(6);
        expect(found.submitReady).toBe(1);
        expect(found.blocked).toBe(1);
        expect(found.dated).toBe(2);
    });

    it('counts the venues the board aims at, most aimed at first', () => {
        const { items, snapshot: snap } = over({
            bravo: { venueId: 'bspc' },
            charlie: { venueId: 'bspc' },
            delta: { venueId: 'other' }
        });
        snap.entities.venues.other = venue('other', { name: 'Other', short: 'OTH' });
        const found = stats(boardItems(snap, PROJECTS), snap.entities.venues, CONFIG);

        expect(found.venues.map((one) => `${one.short}:${one.count}`)).toEqual(['BSPC:3', 'OTH:1']);
        expect(items.length).toBe(6);
    });

    it('marks a venue at the config threshold and leaves one under it unmarked', () => {
        const { snapshot: snap } = over({ bravo: { venueId: 'bspc' } });
        const items = boardItems(snap, PROJECTS);

        const at = stats(items, snap.entities.venues, { ...CONFIG, venue_conc_warn: 2 });
        expect(at.venues[0]).toMatchObject({ count: 2, warn: true });
        const under = stats(items, snap.entities.venues, { ...CONFIG, venue_conc_warn: 3 });
        expect(under.venues[0].warn).toBe(false);
    });

    it('shows at most eight venues', () => {
        const snap = snapshot();
        for (let at = 0; at < 10; at += 1) {
            const id = `v${at}`;
            snap.entities.venues[id] = venue(id, { name: `Venue ${at}` });
            snap.entities.projects[`p${at}`] = project(`p${at}`, 'ideas', {
                type: 'idea',
                venueId: id
            });
        }

        expect(stats(boardItems(snap, PROJECTS), snap.entities.venues, CONFIG).venues).toHaveLength(
            8
        );
    });
});

describe('typeCounts', () => {
    it("counts each type in the config's type order, and an unnamed type after them", () => {
        expect(typeCounts(ITEMS, PROJECTS.typeOrder)).toEqual([
            { type: 'active', count: 1 },
            { type: 'manuscript', count: 1 },
            { type: 'idea', count: 3 },
            { type: 'exploring', count: 1 }
        ]);
    });

    it('counts no type for a project that has none', () => {
        const { items } = over({ charlie: { type: undefined } });
        const counts = typeCounts(items, PROJECTS.typeOrder);
        expect(counts.find((one) => one.type === 'idea')?.count).toBe(2);
        expect(counts.some((one) => one.type === '')).toBe(false);
    });
});

describe('isStale', () => {
    it('is the lag against the threshold it is given', () => {
        const { items } = over({ alpha: { staleDays: 2 } });
        const one = present(
            items.find((held) => held.id === 'alpha'),
            'item alpha'
        );

        expect(isStale(one, 1)).toBe(true);
        expect(isStale(one, 2)).toBe(true);
        expect(isStale(one, 3)).toBe(false);
    });

    it('is false for a project normalise left without a lag', () => {
        expect(isStale(item('bravo'), 1)).toBe(false);
    });
});

describe('humanSize', () => {
    it('writes a megabyte and over to one decimal', () => {
        expect(humanSize(1048576)).toBe('1.0 MB');
        expect(humanSize(1258291)).toBe('1.2 MB');
    });

    it('writes anything under a megabyte as whole kilobytes, and never as nothing', () => {
        expect(humanSize(38400)).toBe('37 KB');
        expect(humanSize(12)).toBe('1 KB');
        expect(humanSize(0)).toBe('1 KB');
    });
});

describe('disseminated', () => {
    /** A hub whose events and education files each name one project. */
    function activity(): Snapshot {
        const snap = snapshot();
        const entry = (id: Id, title: string, fields: Record<string, unknown>, file: string) => ({
            id,
            title,
            fields,
            file,
            index: 0
        });
        snap.entities.collections.events = {
            id: 'events',
            title: 'Talks and events',
            file: '/hub/network/events.yml',
            entries: [
                entry('esann', 'ESANN 2026', { related: ['alpha'], role: 'present' }, '/hub/e.yml'),
                entry(
                    'other',
                    'A conference',
                    { related: ['alpha'], role: 'attend' },
                    '/hub/e.yml'
                ),
                entry('none', 'Nothing to do with it', { related: ['zulu'] }, '/hub/e.yml')
            ]
        };
        snap.entities.collections.education = {
            id: 'education',
            title: 'Education',
            file: '/hub/network/education.yml',
            entries: [entry('course', 'A course', { related: ['alpha'] }, '/hub/ed.yml')]
        };
        return snap;
    }

    it('finds the events and education entries that name the project', () => {
        expect(disseminated(activity(), 'alpha').map((one) => one.id)).toEqual(['esann', 'course']);
    });

    it('counts an application that names the project, which is the work going out as well', () => {
        const snap = activity();
        snap.entities.collections.applications = {
            id: 'applications',
            title: 'Applications',
            file: '/hub/career/applications.yml',
            entries: [
                {
                    id: 'fellowship',
                    title: 'A fellowship',
                    fields: { related: ['alpha'] },
                    file: '/hub/career/applications.yml',
                    index: 0
                }
            ]
        };
        expect(disseminated(snap, 'alpha').map((one) => one.id)).toEqual([
            'esann',
            'course',
            'fellowship'
        ]);
        expect(disseminated(snap, 'alpha').map((one) => one.collection)).toContain('applications');
    });

    it('leaves out an events entry the reader only attended', () => {
        expect(disseminated(activity(), 'alpha').some((one) => one.id === 'other')).toBe(false);
    });

    it('finds nothing for a project nothing names, and none at all without the files', () => {
        expect(disseminated(activity(), 'bravo')).toEqual([]);
        expect(disseminated(SNAPSHOT, 'alpha')).toEqual([]);
    });
});
