// The Programs view rendered on the server over every line band and portfolio-fit state.

import { render } from 'svelte/server';
import { describe, expect, it } from 'vitest';
import Programs from '../../src/lib/views/Programs.svelte';
import { setInstanceState } from '../../src/lib/state/ui.svelte.ts';
import type { Instance } from '../../src/lib/state/layout.ts';
import type { Snapshot } from '../../src/lib/data/model.ts';
import { catalog, fixture, install } from './lines-fixture.ts';

const INSTANCE = 'programs-one';

function html(snapshot = fixture()): string {
    install(snapshot);
    setInstanceState(INSTANCE, { reveal: 'pillar' });
    const instance: Instance = { id: INSTANCE, view: 'programs', state: {} };
    return render(Programs, { props: { instance } }).body;
}

function card(body: string, id: string): string {
    const start = body.indexOf(`data-program="${id}"`);
    const end = body.indexOf('</article>', start);
    return body.slice(start, end);
}

function withPillarTypes(types: string[]): Snapshot {
    const snapshot = fixture();
    const template = snapshot.entities.projects.alpha;
    snapshot.entities.projects = Object.fromEntries(
        types.map((type, index) => {
            const id = `member-${index}`;
            return [
                id,
                {
                    ...template,
                    id,
                    title: id,
                    short: id.toUpperCase(),
                    type,
                    programIds: ['pillar']
                }
            ];
        })
    );
    return snapshot;
}

describe('the Programs view', () => {
    it('draws the intro, add control, line metrics, prose, edits and project groups', () => {
        const body = html();
        expect(body).toMatch(/class="intro(?:\s|")/);
        expect(body).toContain(catalog['col.programs_intro']);
        expect(body).toContain(catalog['col.add']);
        expect(body).toContain('data-reveal="pillar"');
        expect(body).toContain('Pillar <strong>One</strong>');
        expect(body).toContain(`1 ${catalog['col.project']}`);
        expect(body).toContain(catalog['col.in_flight']);
        expect(body).toContain(catalog['col.total']);
        expect(body).toContain('1 strong');
        expect(body).toContain('A <strong>goal</strong>.');
        expect(body).toContain('Funded by <strong>Tests</strong>.');
        expect(body).toContain('class="label">active</span>');
        expect(body).toContain('aria-expanded="false"');
        expect(body).not.toContain('>ALPHA</span>');
        expect(body).toContain('data-program="dormant"');
        expect(body).toMatch(/data-program="dormant"[^>]*class="[^"]*dormant/);
        expect(card(body, 'pillar')).toContain('--tone: var(--c-orange)');
    });

    it('draws orphan, provisional, off-pillar and archival sections', () => {
        const body = html();
        expect(body).toContain(catalog['col.orphans']);
        expect(body).toContain('1 untagged');
        expect(body).toContain('class="label">manuscript</span>');
        expect(body).toContain('aria-expanded="false"');
        expect(body).not.toContain('>ORPHAN</span>');
        expect(body).toContain(catalog['col.provisional_h']);
        expect(body).toContain('Candidate line');
        expect(body).toContain(catalog['col.offpillar_h']);
        expect(body).toContain('Outside line');
        expect(body).toContain(catalog['col.archival']);
        expect(body).toContain('1 not active');
        expect(body).toContain('dropped');
    });

    it('draws provisional metrics and omits metrics from an off-pillar card', () => {
        const body = html();
        expect(card(body, 'candidate')).toContain('class="metrics ');
        expect(card(body, 'candidate')).toContain(catalog['col.in_flight']);
        expect(card(body, 'outside')).not.toContain('class="metrics ');
    });

    it('breaks a type tie by configured type order regardless of member order', () => {
        const activeFirst = card(html(withPillarTypes(['active', 'manuscript'])), 'pillar');
        const manuscriptFirst = card(html(withPillarTypes(['manuscript', 'active'])), 'pillar');
        expect(activeFirst).toContain('--tone: var(--c-orange)');
        expect(manuscriptFirst).toContain('--tone: var(--c-orange)');
    });

    it('uses the majority project type as the pillar tone', () => {
        const body = html(withPillarTypes(['active', 'manuscript', 'manuscript']));
        expect(card(body, 'pillar')).toContain('--tone: var(--c-teal)');
    });

    it('uses grey for a dormant pillar', () => {
        const body = html(withPillarTypes(['published']));
        expect(card(body, 'pillar')).toContain('--tone: var(--c-grey)');
    });

    it('draws the clean card when every real project names a known line', () => {
        const snapshot = fixture();
        for (const project of Object.values(snapshot.entities.projects)) {
            project.programIds = ['pillar'];
        }
        const body = html(snapshot);
        expect(body).toContain(catalog['col.no_orphans']);
        expect(body).toContain(catalog['col.no_orphans_blurb']);
    });

    it('uses collection entry order for integer-like line keys', () => {
        const snapshot: Snapshot = fixture();
        snapshot.entities.programs = {
            '10': { id: '10', title: 'Line ten', fundingIds: [], projectIds: [] },
            '2': { id: '2', title: 'Line two', fundingIds: [], projectIds: [] }
        };
        const collection = snapshot.entities.collections.programs;
        const template = collection.entries[0];
        collection.entries = [
            {
                ...template,
                id: '10',
                title: 'Line ten',
                fields: { ...template.fields, key: '10', title: 'Line ten' },
                index: 0
            },
            {
                ...template,
                id: '2',
                title: 'Line two',
                fields: { ...template.fields, key: '2', title: 'Line two' },
                index: 1
            }
        ];
        const body = html(snapshot);
        expect(body.indexOf('Line ten')).toBeLessThan(body.indexOf('Line two'));
    });
});
