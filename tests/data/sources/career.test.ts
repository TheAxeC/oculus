// Layer 1, data tests. sources/documents/career.ts and the career half of normalise, over a
// synthetic hub written under mkdtemp. Nothing here touches the real hub.

import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve, sep } from 'node:path';
import { describe, expect } from 'vitest';
import { readCareer } from '../../../src/lib/data/sources/documents/career.ts';
import { engineDefaults } from '../../../src/lib/data/sources/collections.ts';
import { engineDir, loadConfig, textCatalog } from '../../../src/lib/data/sources/config.ts';
import { career } from '../../../src/lib/data/snapshot/normalise-parts/career.ts';
import { it, scratchDir, test } from '../../fixtures/scratch.ts';

/** The career file's default path, from oculus's own table of default paths. */
const CAREER_FILE = engineDefaults().career ?? '';

/** The catalog the findings are worded from: the one oculus ships, read as the server reads it. */
const CATALOG = textCatalog(loadConfig(engineDir()).config);

const CAREER = `title: Career strategy
goal: "Assistant professor"
milestone: "FWO Senior"
milestone_date: "2026-11-17"
situation:
  PhD: "May 2023, KU Leuven"
  Now: "Postdoc, U Twente"
order:
  - { task: "Veni pre-proposal", when: "~1 Sep" }
  - { task: "ENW-XS", when: "15 Sep", note: "optional" }
  - "a plain string task"
order_note: "the order is a priority order"
`;

/** Sections the career banner draws none of, which a career file may hold. */
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

    it('reads the title, the milestone and the situation strip', () => {
        expect(held?.title).toBe('Career strategy');
        expect(held?.goal).toBe('Assistant professor');
        expect(held?.milestone).toBe('FWO Senior');
        expect(held?.milestoneDate).toBe('2026-11-17');
        expect(held?.situation).toEqual([
            { label: 'PhD', value: 'May 2023, KU Leuven' },
            { label: 'Now', value: 'Postdoc, U Twente' }
        ]);
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

    it('reads none of the sections the banner does not draw into the model', () => {
        const read = career(readCareer(hub(CAREER + UNDRAWN), CAREER_FILE, CATALOG).career);
        expect(Object.keys(read ?? {}).sort()).toEqual([
            'goal',
            'milestone',
            'milestoneDate',
            'order',
            'orderNote',
            'sections',
            'situation',
            'title'
        ]);
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
            'situation',
            'order',
            'order_note'
        ]);
        expect(read?.sections.situation).toEqual({
            PhD: 'May 2023, KU Leuven',
            Now: 'Postdoc, U Twente'
        });
        expect(read?.schema).toBeUndefined();
    });

    it('carries the file schema, one field per section, and not as a section', () => {
        const body = `schema:\n  - { field: title, type: text }\n  - { field: milestone, type: text }\n${CAREER}`;
        const read = career(readCareer(hub(body), CAREER_FILE, CATALOG).career);
        expect(read?.schema).toMatchObject(SCHEMA);
        expect(read?.sections).not.toHaveProperty('schema');
    });
});
