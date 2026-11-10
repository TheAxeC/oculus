// Layer 2, client state test. Which fields of a collection entry a card draws
// (state/boards/collection `drawnFields`): the fields of the section `website.schema_section`
// names are left out, and with that setting empty, or before the configuration has reached the
// page, every field of the schema is drawn.

import { describe, expect } from 'vitest';
import {
    drawnFields,
    type Entry,
    type SchemaField
} from '../../../src/lib/state/boards/collection';
import { it } from '../../fixtures/scratch.ts';

const SCHEMA: SchemaField[] = [
    { field: 'title', type: 'text', display: 1 },
    { field: 'summary', type: 'text' },
    { field: 'site_blurb', type: 'text', section: 'Site' }
];

const ENTRY: Entry = {
    id: 'e1',
    title: 'One',
    fields: { title: 'One', summary: 'A summary', site_blurb: 'For the site' },
    file: '/hub/.oculus/data/one.yml',
    index: 0
};

describe('the fields a card draws', () => {
    it('leaves out the section the website section setting names, and no other (G13)', () => {
        const names = (website: string | null) =>
            drawnFields(ENTRY, SCHEMA, website).map((one) => one.field);
        expect([names('Site'), names('Website'), names(''), names(null)]).toEqual([
            ['summary'],
            ['summary', 'site_blurb'],
            ['summary', 'site_blurb'],
            ['summary', 'site_blurb']
        ]);
    });
});
