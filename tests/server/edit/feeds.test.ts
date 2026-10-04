// The feed writers over fixture files in a temporary hub, never the real feeds folder.
//
// A case that takes 100 ms or more in a run of its own, starts a process or waits on a timer is
// tagged slow.

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, resolve, sep } from 'node:path';
import { describe, expect } from 'vitest';
import {
    addLead,
    addLinkedinIdea,
    deleteFeedEntry,
    markLinkedinPosted,
    writeFeedField
} from '../../../src/lib/server/edit/feeds.ts';
import { portfolioConfigFrom } from '../../../src/lib/data/index.ts';
import { localDate } from '../../../src/lib/data/helpers/dates.ts';
import { engineDir, loadConfig } from '../../../src/lib/data/sources/config.ts';
import type { FeedKind, PortfolioConfig } from '../../../src/lib/data/model/index.ts';
import { it, scratchDir } from '../../fixtures/scratch.ts';

const FILES: Record<FeedKind, string> = {
    radar: 'fixture/radar.yml',
    leads: 'fixture/leads.yml',
    linkedin: 'fixture/linkedin'
};

const LEAD_SCHEMA = `schema:
  - { field: title, type: text }
  - { field: inst, type: text }
  - { field: country, type: text }
  - { field: typ, type: text }
  - { field: focus, type: textarea }
  - { field: fit, type: textarea }
  - { field: status, type: select, options: [open, applied, declined] }
  - { field: date, type: date }
  - { field: deadline, type: text }
  - { field: url, type: text }
`;

function fixture(): { hub: string; config: PortfolioConfig } {
    const hub = scratchDir('oculus-feeds-');
    const config = {
        ...portfolioConfigFrom(loadConfig(engineDir()).config, engineDir()),
        feeds: { ...FILES, linkedin: 'fixture/linkedin' }
    };
    for (const [kind, id] of [
        ['radar', 'Paper'],
        ['leads', 'Job']
    ] as const) {
        const identity = 'title';
        const file = join(hub, FILES[kind]);
        expect(resolve(file).startsWith(resolve(hub) + sep)).toBe(true);
        mkdirSync(join(file, '..'), { recursive: true });
        const schema = kind === 'leads' ? LEAD_SCHEMA : '';
        writeFileSync(
            file,
            `meta:\n  last_run: 2026-09-11\n${schema}entries:\n  - ${identity}: "${id}"\n`
        );
    }
    const linkedin = join(hub, FILES.linkedin);
    expect(resolve(linkedin).startsWith(resolve(hub) + sep)).toBe(true);
    mkdirSync(linkedin, { recursive: true });
    writeFileSync(
        join(linkedin, '01-A-reflection.md'),
        '---\ntitle: "A quoted title"\ncategory: reflection\ndate: 2026-08-01\n---\n\nPosted body.\n'
    );
    writeFileSync(
        join(linkedin, 'xx-easy-problems.md'),
        '---\ntitle: "Easy problems"\ncategory: research\ndate: 2026-09-12\n---\n\nIdea body.\n'
    );
    writeFileSync(join(linkedin, 'README.md'), 'Not a post.\n');
    writeFileSync(join(linkedin, 'draft-another.md'), 'Not a numbered post.\n');
    writeFileSync(join(linkedin, 'xx-easy-problems.jpeg'), 'image');
    return { hub, config };
}

describe('feed writes', () => {
    it('adds a dated LinkedIn idea with a safe slug and numbered collision suffix', () => {
        const into = fixture();
        const made = join(into.hub, FILES.linkedin, 'xx-easy-problems-2.md');
        expect(addLinkedinIdea(into.hub, into.config, 'Easy problems', 'research')).toEqual({
            found: true,
            changed: ['file'],
            refused: [],
            records: [
                {
                    file: made,
                    key: 'xx-easy-problems-2.md',
                    field: 'entries',
                    before: null,
                    after: { title: 'Easy problems', category: 'research' },
                    undo: 'none'
                }
            ]
        });
        const file = made;
        expect(readFileSync(file, 'utf8')).toBe(
            `---\nlayout: post\ntitle: "Easy problems"\ncategory: "research"\npublish: True\ndate: ${localDate(Date.now())}\n---\n\n`
        );
    });

    it('promotes an idea past 01-A and moves its same-basename sidecar', () => {
        const into = fixture();
        const folder = join(into.hub, FILES.linkedin);
        expect(markLinkedinPosted(into.hub, into.config, 'xx-easy-problems.md')).toEqual({
            found: true,
            changed: ['file'],
            refused: [],
            records: [
                {
                    file: join(folder, '02-easy-problems.md'),
                    key: 'xx-easy-problems.md',
                    field: 'entries',
                    before: ['xx-easy-problems.jpeg', 'xx-easy-problems.md'],
                    after: ['02-easy-problems.jpeg', '02-easy-problems.md'],
                    undo: 'none'
                }
            ]
        });
        expect(existsSync(join(folder, '02-easy-problems.md'))).toBe(true);
        expect(existsSync(join(folder, '02-easy-problems.jpeg'))).toBe(true);
        expect(existsSync(join(folder, 'xx-easy-problems.md'))).toBe(false);
        expect(existsSync(join(folder, 'xx-easy-problems.jpeg'))).toBe(false);
    });

    it('adds a lead in schema order with date and status defaults', () => {
        const into = fixture();
        expect(
            addLead(into.hub, into.config, {
                title: 'New role',
                country: 'Belgium',
                focus: 'Clinical AI',
                date: null,
                status: ''
            })
        ).toEqual({
            found: true,
            changed: ['entries'],
            refused: [],
            records: [
                {
                    file: join(into.hub, FILES.leads),
                    key: 'New role',
                    field: 'entries',
                    before: null,
                    after: {
                        title: 'New role',
                        country: 'Belgium',
                        focus: 'Clinical AI',
                        status: 'open',
                        date: localDate(Date.now())
                    },
                    undo: 'create'
                }
            ]
        });
        const source = readFileSync(join(into.hub, FILES.leads), 'utf8');
        expect(source).toContain(
            `  - title: New role\n    country: Belgium\n    focus: Clinical AI\n    status: open\n    date: ${localDate(Date.now())}`
        );
    });

    it('uses each feed identity and allows only its field', () => {
        const into = fixture();
        expect(
            writeFeedField(into.hub, into.config, 'radar', 'Paper', 'dismissed', true).changed
        ).toEqual(['dismissed']);
        expect(
            writeFeedField(into.hub, into.config, 'radar', 'Paper', 'dismissed', null).changed
        ).toEqual(['dismissed']);
        expect(readFileSync(join(into.hub, FILES.radar), 'utf8')).not.toContain('dismissed:');
        expect(
            writeFeedField(into.hub, into.config, 'leads', 'Job', 'status', 'closed').changed
        ).toEqual(['status']);
        expect(
            writeFeedField(into.hub, into.config, 'radar', 'Paper', 'status', 'closed').refused
        ).toHaveLength(1);
        expect(
            writeFeedField(into.hub, into.config, 'radar', 'Nobody', 'dismissed', true).found
        ).toBe(false);
    });

    it('deletes leads and refuses deletion from the other feeds', () => {
        const into = fixture();
        expect(deleteFeedEntry(into.hub, into.config, 'leads', 'Job').changed).toEqual(['entries']);
        expect(readFileSync(join(into.hub, FILES.leads), 'utf8')).not.toContain('Job');
        expect(deleteFeedEntry(into.hub, into.config, 'radar', 'Paper').refused).toHaveLength(1);
    });
});
