// Layer 1, data tests. sources/documents/career.ts and the career half of normalise, over a
// synthetic hub written under mkdtemp, and what the Career view draws (state/forms/career-view.ts)
// for the demo hub's career file, whose schema is the one docs/templates.md gives, found as the
// view finds its page. Nothing here touches the real hub.

import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve, sep } from 'node:path';
import { describe, expect } from 'vitest';
import { readCareer } from '../../../src/lib/data/sources/documents/career.ts';
import { engineDefaults } from '../../../src/lib/data/sources/collections.ts';
import { engineDir, loadConfig, textCatalog } from '../../../src/lib/data/sources/config.ts';
import { career } from '../../../src/lib/data/snapshot/normalise-parts/career.ts';
import type { Career, Snapshot } from '../../../src/lib/data/model/index.ts';
import { fieldsOf } from '../../../src/lib/data/snapshot/schema/field.ts';
import { careerShown } from '../../../src/lib/state/forms/career-view.ts';
import {
    CAREER as CAREER_PAGE,
    createPages,
    pageFields,
    sampleOf,
    type PageEntry
} from '../../../src/lib/state/forms/page-entry.ts';
import { formFieldsOf, formGroups } from '../../../src/lib/state/forms/record-fields.ts';
import { toEdit, type RecordsEdit } from '../../../src/lib/state/forms/record-values.ts';
import { createSettled } from '../../../src/lib/state/forms/settled.svelte.ts';
import { it, scratchDir, test } from '../../fixtures/scratch.ts';

/** The career file's default path, from oculus's own table of default paths. */
const CAREER_FILE = engineDefaults().career ?? '';

/** The catalog the findings are worded from: the one oculus ships, read as the server reads it. */
const CATALOG = textCatalog(loadConfig(engineDir()).config);

const CAREER = `title: Career strategy
goal: "Assistant professor"
milestone: "FWO Senior"
milestone_date: "2026-11-17"
positions:
  - { title: "Postdoc", location: "U Twente", duration: "2023 - now" }
order:
  - { task: "Veni pre-proposal", when: "~1 Sep" }
  - { task: "ENW-XS", when: "15 Sep", note: "optional" }
  - "a plain string task"
order_note: "the order is a priority order"
`;

/** Sections the model types none of, which a career file may hold. */
const UNDRAWN = `hosts:
  - { name: "Naesens", inst: "KU Leuven", status: "warm" }
host_criteria:
  - "Clinic-embedded"
not_hosts:
  - { who: "Peeters", why: "former advisor" }
eligibility:
  rule: ["PhD 3-6 yr before 1 Oct of start"]
dropped:
  - { what: "MSCA-PF 2026" }
`;

function hub(body: string | null): string {
    const dir = scratchDir('oculus-career-');
    if (body !== null) {
        const full = join(dir, CAREER_FILE);
        expect(resolve(full).startsWith(resolve(dir) + sep)).toBe(true);
        mkdirSync(dirname(full), { recursive: true });
        writeFileSync(full, body);
    }
    return dir;
}

describe('reading the career file', () => {
    it('parses it as the map it is, with no key renamed', () => {
        const { career: raw, findings } = readCareer(hub(CAREER), CAREER_FILE, CATALOG);
        expect(findings).toEqual([]);
        expect(Object.keys(raw ?? {})).toContain('milestone_date');
    });
});

describe('normalising it', () => {
    let held: ReturnType<typeof career> = null;
    test.beforeAll(() => {
        held = career(readCareer(hub(CAREER), CAREER_FILE, CATALOG).career);
    });

    it('reads the title, the goal, the milestone and the order of work', () => {
        expect(held?.title).toBe('Career strategy');
        expect(held?.goal).toBe('Assistant professor');
        expect(held?.milestone).toBe('FWO Senior');
        expect(held?.milestoneDate).toBe('2026-11-17');
        expect(held?.order).toEqual([
            { task: 'Veni pre-proposal', when: '~1 Sep' },
            { task: 'ENW-XS', when: '15 Sep', note: 'optional' },
            { task: 'a plain string task' }
        ]);
        expect(held?.orderNote).toBe('the order is a priority order');
    });

    it.each([
        {
            name: 'a goal and a milestone with its day',
            body: 'goal: "Assistant professor"\nmilestone: "FWO Senior"\nmilestone_date: 2026-11-17\n',
            goal: 'Assistant professor',
            milestone: 'FWO Senior',
            milestoneDate: '2026-11-17'
        },
        {
            name: 'a milestone with no milestone_date, which has no day',
            body: 'milestone: "FWO Senior"\n',
            goal: undefined,
            milestone: 'FWO Senior',
            milestoneDate: undefined
        },
        {
            name: 'a milestone_date that is not a day, which leaves the milestone without one',
            body: 'milestone: "FWO Senior"\nmilestone_date: soon\n',
            goal: undefined,
            milestone: 'FWO Senior',
            milestoneDate: undefined
        },
        {
            name: 'an empty milestone, which is none whatever its day',
            body: 'milestone: ""\nmilestone_date: 2026-11-17\n',
            goal: undefined,
            milestone: undefined,
            milestoneDate: undefined
        },
        {
            name: 'an empty goal, which is none',
            body: 'goal: ""\n',
            goal: undefined,
            milestone: undefined,
            milestoneDate: undefined
        },
        {
            name: 'a milestone that is a map, which is no text and so none',
            body: 'milestone: { title: FWO Senior, date: 2026-11-17 }\n',
            goal: undefined,
            milestone: undefined,
            milestoneDate: undefined
        }
    ])('reads $name', ({ body, goal, milestone, milestoneDate }) => {
        const read = career(readCareer(hub(body), CAREER_FILE, CATALOG).career);
        expect(read?.goal).toBe(goal);
        expect(read?.milestone).toBe(milestone);
        expect(read?.milestoneDate).toBe(milestoneDate);
    });

    it('types the strategy alone, every other section staying in the sections', () => {
        const read = career(readCareer(hub(CAREER + UNDRAWN), CAREER_FILE, CATALOG).career);
        expect(Object.keys(read ?? {}).sort()).toEqual([
            'goal',
            'milestone',
            'milestoneDate',
            'order',
            'orderNote',
            'sections',
            'title'
        ]);
        expect(Object.keys(read?.sections ?? {})).toEqual(
            expect.arrayContaining(['positions', 'hosts', 'dropped'])
        );
    });
});

describe('what the editor edits', () => {
    const SCHEMA = [
        { field: 'title', type: 'text' },
        { field: 'milestone', type: 'text' }
    ];

    it('keeps every section as the file holds it, with the schema left out', () => {
        const read = career(readCareer(hub(CAREER), CAREER_FILE, CATALOG).career);
        expect(Object.keys(read?.sections ?? {})).toEqual([
            'title',
            'goal',
            'milestone',
            'milestone_date',
            'positions',
            'order',
            'order_note'
        ]);
        expect(read?.sections.positions).toEqual([
            { title: 'Postdoc', location: 'U Twente', duration: '2023 - now' }
        ]);
        expect(read?.schema).toBeUndefined();
    });

    it('carries the file schema, one field per section, and not as a section', () => {
        const body = `schema:\n  - { field: title, type: text }\n  - { field: milestone, type: text }\n${CAREER}`;
        const read = career(readCareer(hub(body), CAREER_FILE, CATALOG).career);
        expect(read?.schema).toMatchObject(SCHEMA);
        expect(read?.sections).not.toHaveProperty('schema');
    });
});

describe("a schema row's section", () => {
    it.each([
        { name: 'a text', section: 'Core', read: 'Core' },
        { name: 'the empty text', section: '', read: undefined },
        { name: 'a number', section: 7, read: undefined },
        { name: 'no section', section: undefined, read: undefined }
    ])('reads $name and copies it to the form field', ({ section, read }) => {
        const fields = fieldsOf([{ field: 'one', type: 'text', section }]);
        expect(fields?.[0]?.section).toBe(read);
        expect(formFieldsOf(fields, {})[0]?.section).toBe(read ?? '');
    });

    it('reads a section on a nested row and leaves it off the form field', () => {
        const fields = fieldsOf([
            {
                field: 'rows',
                type: 'records',
                section: 'Core',
                fields: [{ field: 'sub', type: 'text', section: 'Dates' }]
            }
        ]);
        expect(fields?.[0]?.fields?.[0]?.section).toBe('Dates');
        expect(formFieldsOf(fields, {})[0]?.fields?.[0]?.section).toBe('');
    });

    it.each([
        {
            name: 'the listed sections in the order of the list, an empty one left out',
            rows: [
                ['a', 'Dates'],
                ['b', 'Core'],
                ['c', 'Dates']
            ],
            groups: [
                ['Core', 'b'],
                ['Dates', 'a', 'c']
            ]
        },
        {
            name: 'a section the list does not hold after the listed ones, by its first row',
            rows: [
                ['a', 'Mine'],
                ['b', 'Dates'],
                ['c', 'Yours'],
                ['d', 'Mine']
            ],
            groups: [
                ['Dates', 'b'],
                ['Mine', 'a', 'd'],
                ['Yours', 'c']
            ]
        },
        {
            name: 'rows with no section last, under the one Other group with a section so named',
            rows: [
                ['a', ''],
                ['b', 'Other'],
                ['c', 'Mine'],
                ['d', 'Core']
            ],
            groups: [
                ['Core', 'd'],
                ['Mine', 'c'],
                ['Other', 'a', 'b']
            ]
        }
    ])('groups $name', ({ rows, groups }) => {
        const fields = rows.map(([field, section]) => ({
            field,
            label: field,
            type: 'text',
            section
        }));
        const drawn = formGroups(fields, ['Core', 'Content', 'Dates'], 'Other');
        expect(drawn.map((one) => [one.name, ...one.fields.map((row) => row.field)])).toEqual(
            groups
        );
    });
});

describe('what the Career view draws', () => {
    /** The demo hub's career file, whose schema is the one docs/templates.md gives. */
    const DEMO = join(engineDir(), 'tests', 'fixtures', 'hubs', 'demo');
    let held: ReturnType<typeof career> = null;
    test.beforeAll(() => {
        held = career(readCareer(DEMO, CAREER_FILE, CATALOG).career);
    });

    /** A person's name, as the view finds it for the key a reference names. */
    const nameOf = (key: string): string => `name of ${key}`;

    /** The page of a career file, found as the view finds it (page-entry.ts `pageNamed`). */
    function pageFor(file: Career | null): PageEntry | null {
        const snapshot = { entities: { career: file } } as unknown as Snapshot;
        const pages = createPages(
            { snapshot: () => snapshot, feeds: () => null },
            createSettled(() => 0)
        );
        return pages.pageNamed(CAREER_PAGE);
    }

    it('draws the line saying the hub holds no career file when it holds none', () => {
        expect(careerShown(null, nameOf)).toEqual({ state: 'none' });
    });

    it('draws the line saying the file has no schema when its schema is absent', () => {
        if (held === null) throw new Error('the demo hub holds no career file');
        const { schema: _schema, ...bare } = held;
        expect(careerShown(bare, nameOf)).toEqual({ state: 'no_schema' });
    });

    it('draws one card per row of each of the five groups, in their order', () => {
        const shown = careerShown(held, nameOf);
        const groups = shown.state === 'cards' ? shown.groups : [];
        expect(groups.map((group) => group.field)).toEqual([
            'positions',
            'degrees',
            'awards',
            'references',
            'profiles'
        ]);
        for (const group of groups) {
            const rows = held?.sections[group.field];
            const count = Array.isArray(rows) ? rows.length : Object.keys(rows ?? {}).length;
            expect(group.cards).toHaveLength(count);
        }
    });

    it.each([
        {
            name: "a position by its title, the row's other filled text fields its lines",
            section: 'positions',
            rows: [{ title: 'Postdoc', location: 'U Twente', url: '', hide: true }],
            card: {
                id: 'positions:0',
                title: 'Postdoc',
                hidden: true,
                lines: [{ label: 'location', text: 'U Twente' }]
            }
        },
        {
            name: 'an award by its award',
            section: 'awards',
            rows: [{ award: 'Best paper', date: '2024' }],
            card: {
                id: 'awards:0',
                title: 'Best paper',
                hidden: false,
                lines: [{ label: 'date', text: '2024' }]
            }
        },
        {
            name: "a reference by the person's name",
            section: 'references',
            rows: [{ person: 'ann' }],
            card: { id: 'references:0', title: 'name of ann', hidden: false, lines: [] }
        },
        {
            name: 'a profile by its name in the map',
            section: 'profiles',
            rows: { shared: { location: 'Enschede' } },
            card: {
                id: 'profiles:shared',
                title: 'shared',
                hidden: false,
                lines: [{ label: 'location', text: 'Enschede' }]
            }
        },
        {
            name: 'a row with no title by its first line',
            section: 'positions',
            rows: [{ location: 'U Twente', duration: 'now' }],
            card: {
                id: 'positions:0',
                title: 'U Twente',
                hidden: false,
                lines: [{ label: 'duration', text: 'now' }]
            }
        }
    ])('draws $name', ({ section, rows, card }) => {
        if (held === null) throw new Error('the demo hub holds no career file');
        const file = { ...held, sections: { [section]: rows } };
        const shown = careerShown(file, nameOf);
        const groups = shown.state === 'cards' ? shown.groups : [];
        expect(groups.find((group) => group.field === section)?.cards).toEqual([card]);
    });

    it("draws every section of the file's schema in the schema's order, each in the form its field gives", () => {
        const page = pageFor(held);
        const forms = (page === null ? [] : pageFields(page)).map((field) => ({
            field: field.field,
            form:
                field.type === 'records' && page !== null
                    ? (
                          toEdit(
                              field,
                              page.values[field.field],
                              sampleOf(page, field.field)
                          ) as RecordsEdit
                      ).shape
                    : field.type
        }));
        expect(forms).toEqual([
            { field: 'title', form: 'text' },
            { field: 'goal', form: 'text' },
            { field: 'milestone', form: 'text' },
            { field: 'milestone_date', form: 'date' },
            { field: 'order_note', form: 'textarea' },
            { field: 'order', form: 'list' },
            { field: 'positions', form: 'list' },
            { field: 'degrees', form: 'list' },
            { field: 'awards', form: 'list' },
            { field: 'references', form: 'list' },
            { field: 'profiles', form: 'named' }
        ]);
    });
});
