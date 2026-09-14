// The Programs view rendered on the server over every line band and portfolio-fit state.

import { render } from 'svelte/server';
import { describe, expect, it } from 'vitest';
import Programs from '../../src/lib/views/Programs.svelte';
import LineCard from '../../src/lib/views/programs/LineCard.svelte';
import { setInstanceState } from '../../src/lib/state/ui.svelte.ts';
import type { Instance } from '../../src/lib/state/layout/index.ts';
import type { Snapshot } from '../../src/lib/data/model.ts';
import { catalog, fixture, install } from './lines-fixture.ts';
import { noop } from '../doubles.ts';

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
        expect(body).toContain(catalog['programs.intro']);
        expect(body).toContain(catalog['collection.add']);
        expect(body).toContain('data-reveal="pillar"');
        expect(body).toContain('Pillar <strong>One</strong>');
        expect(body).toContain(`1 ${catalog['programs.project']}`);
        expect(body).toContain(catalog['programs.in_flight']);
        expect(body).toContain(catalog['programs.total']);
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
        expect(body).toContain(catalog['programs.orphans']);
        expect(body).toContain('1 untagged');
        expect(body).toContain('class="label">active</span>');
        expect(body).not.toContain('class="label">manuscript</span>');
        expect(body).toContain('aria-expanded="false"');
        expect(body).not.toContain('>ORPHAN</span>');
        expect(body).toContain(catalog['programs.provisional_h']);
        expect(body).toContain('Candidate line');
        expect(body).toContain(catalog['programs.offpillar_h']);
        expect(body).toContain('Outside line');
        expect(body).toContain(catalog['programs.archival']);
        expect(body).toContain('1 not active');
        expect(body).toContain('dropped');
    });

    it('draws provisional metrics and omits metrics from an off-pillar card', () => {
        const body = html();
        expect(card(body, 'candidate')).toContain('class="metrics ');
        expect(card(body, 'candidate')).toContain(catalog['programs.in_flight']);
        expect(card(body, 'outside')).not.toContain('class="metrics ');
    });

    it('uses the registry color regardless of member order or project type', () => {
        const activeFirst = card(html(withPillarTypes(['active', 'manuscript'])), 'pillar');
        const manuscriptFirst = card(html(withPillarTypes(['manuscript', 'active'])), 'pillar');
        expect(activeFirst).toContain('--tone: var(--c-orange)');
        expect(manuscriptFirst).toContain('--tone: var(--c-orange)');
        const body = html(withPillarTypes(['active', 'manuscript', 'manuscript']));
        expect(card(body, 'pillar')).toContain('--tone: var(--c-orange)');
    });

    it('draws a plain card when the registry entry has no color, including when dormant', () => {
        const body = html(withPillarTypes(['published']));
        expect(card(body, 'dormant')).not.toContain('--tone:');
    });

    it('draws a plain pillar card for an off-palette hex', () => {
        const snapshot = fixture();
        snapshot.entities.programs.pillar.color = '#123456';
        const body = card(html(snapshot), 'pillar');
        const article = /<article\b[^>]*>/.exec(body)?.[0];
        expect(article).toBeDefined();
        expect(article).not.toContain('--tone:');
    });

    it('draws the Colour field and saved value in the Programs edit form', () => {
        const snapshot = fixture();
        install(snapshot);
        const collection = snapshot.entities.collections.programs;
        const body = render(LineCard, {
            props: {
                line: snapshot.entities.programs.pillar,
                cursor: false,
                projects: [],
                venues: [],
                tiers: [],
                entry: collection.entries.find((entry) => entry.id === 'pillar')!,
                schema: collection.schema,
                editing: true,
                onedit: noop,
                onsaid: noop
            }
        }).body;
        expect(body).toContain('data-form="edit"');
        expect(body).toMatch(/<input[^>]*value="#ea580c"[^>]*aria-label="Colour"/);
        expect(body).toContain("hex colour of the pillar's card");
    });

    it('draws the clean card when every real project names a known line', () => {
        const snapshot = fixture();
        for (const project of Object.values(snapshot.entities.projects)) {
            project.programIds = ['pillar'];
        }
        const body = html(snapshot);
        expect(body).toContain(catalog['programs.no_orphans']);
        expect(body).toContain(catalog['programs.no_orphans_blurb']);
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
