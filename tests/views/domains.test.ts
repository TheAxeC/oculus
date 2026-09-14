// The Domains view rendered on the server over populated and empty registry entries.

import { render } from 'svelte/server';
import { describe, expect, it } from 'vitest';
import Domains from '../../src/lib/views/Domains.svelte';
import { setInstanceState } from '../../src/lib/state/ui.svelte.ts';
import type { Instance } from '../../src/lib/state/layout.ts';
import { catalog, fixture, install } from './lines-fixture.ts';

const INSTANCE = 'domains-one';

function html(empty = false): string {
    const snapshot = fixture();
    if (empty) snapshot.entities.projects = {};
    install(snapshot, empty ? 2403 : 2402);
    setInstanceState(INSTANCE, { reveal: 'heart' });
    const instance: Instance = { id: INSTANCE, view: 'domains', state: {} };
    return render(Domains, { props: { instance } }).body;
}

describe('the Domains view', () => {
    it('draws the intro, add control and populated domain in file order', () => {
        const body = html();
        expect(body).toMatch(/class="intro(?:\s|")/);
        expect(body).toContain(catalog['domains.intro']);
        expect(body).toContain(catalog['collection.add']);
        expect(body).toContain('data-reveal="heart"');
        expect(body).toContain('Heart <strong>domain</strong>');
        expect(body).toContain(`2 ${catalog['programs.projects']}`);
        expect(body).toContain('Heart blurb.');
        expect(body).toContain('class="label">active</span>');
        expect(body).toContain('class="label">published</span>');
        expect(body).toContain('aria-expanded="false"');
        expect(body).not.toContain('>ALPHA</span>');
        expect(body).not.toContain('>OLD</span>');
        expect(body).not.toContain('data-domain="empty"');
        expect(body).toContain('--tone: var(--c-crimson)');
    });

    it('draws the catalogued empty state when no domain has a member', () => {
        expect(html(true)).toContain(catalog['domains.empty']);
    });

    it('marks a domain dormant when none of its members are live', () => {
        const snapshot = fixture();
        snapshot.entities.domains.sleep = {
            id: 'sleep',
            title: 'Dormant domain',
            projectIds: []
        };
        snapshot.entities.collections.domains.entries.push({
            id: 'sleep',
            title: 'Dormant domain',
            fields: { key: 'sleep', title: 'Dormant domain' },
            file: '/hub/registries/domains.yml',
            index: 2
        });
        snapshot.entities.projects.old.domainIds = ['sleep'];
        install(snapshot, 2406);
        setInstanceState(INSTANCE, {});
        const instance: Instance = { id: INSTANCE, view: 'domains', state: {} };
        const body = render(Domains, { props: { instance } }).body;
        expect(body).toMatch(/data-domain="sleep"[^>]*class="[^"]*dormant/);
    });

    it('uses collection entry order for integer-like domain keys', () => {
        const snapshot = fixture();
        snapshot.entities.domains = {
            '10': { id: '10', title: 'Domain ten', projectIds: [] },
            '2': { id: '2', title: 'Domain two', projectIds: [] }
        };
        const collection = snapshot.entities.collections.domains;
        const template = collection.entries[0];
        collection.entries = [
            {
                ...template,
                id: '10',
                title: 'Domain ten',
                fields: { ...template.fields, key: '10', title: 'Domain ten' },
                index: 0
            },
            {
                ...template,
                id: '2',
                title: 'Domain two',
                fields: { ...template.fields, key: '2', title: 'Domain two' },
                index: 1
            }
        ];
        snapshot.entities.projects.alpha.domainIds = ['10', '2'];
        install(snapshot, 2407);
        setInstanceState(INSTANCE, {});
        const instance: Instance = { id: INSTANCE, view: 'domains', state: {} };
        const body = render(Domains, { props: { instance } }).body;
        expect(body.indexOf('Domain ten')).toBeLessThan(body.indexOf('Domain two'));
    });
});
