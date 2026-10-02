// Layer 2, server tests. The private portfolio index uses a temporary hub whose project tiers and
// collection files make the order, missing-file behavior and exact byte size observable.

import { chmodSync, mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, sep } from 'node:path';
import { describe, expect } from 'vitest';
import { portfolioContext } from '../../../../src/lib/server/machine/pty/context.ts';
import { engineDir } from '../../../../src/lib/data/sources/config.ts';
import { writeTextAtomic } from '../../../../src/lib/server/core/json.ts';
import { it, scratchDir, test } from '../../../fixtures/scratch.ts';

// The temporary hub, made and planted before the file's first case, so a run that skips every case
// makes none.
let ROOT = '';

function write(path: string, content: string): void {
    const file = join(ROOT, path);
    mkdirSync(dirname(file), { recursive: true });
    writeFileSync(file, content);
}

test.beforeAll(() => {
    ROOT = scratchDir('oculus-chat-context-');
    write('registries/venues.yml', 'venue: fixture\n');
    write('projects/active/alpha/project.yml', 'id: alpha\ntitle: Alpha\n');
    write('projects/archive/published/zulu/project.yml', 'id: zulu\ntitle: Zulu\n');
    write('projects/archive/project.yml', 'id: scan-root-decoy\n');
    write('projects/archive/published/zulu/code/project.yml', 'id: decoy\n');
    write('side-projects/x/project.yml', 'title: Side X\nstatus: idea\n');
    write('registries/pillars.yml', 'pillar: fixture\n');
    write('funding/funding.yml', 'funding: fixture\n');
    write('network/events.yml', 'events: fixture\n');
    write('education/education.yml', 'education: fixture\n');
    write('network/joint-work.yml', 'joint-work: fixture\n');
    write('tasks/tasks.yml', 'tasks: fixture\n');
});

const config: Record<string, unknown> = {
    scan: [
        { dir: 'projects/active', type: 'active' },
        { dir: 'projects/archive', nested: true }
    ],
    venues_file: 'registries/venues.yml',
    pillars_file: 'registries/pillars.yml',
    collections: [
        { key: 'tasks', file: 'tasks/tasks.yml' },
        { key: 'applications', file: 'applications/applications.yml' },
        { key: 'joint-work', file: 'network/joint-work.yml' },
        { key: 'education', file: 'education/education.yml' },
        { key: 'events', file: 'network/events.yml' },
        { key: 'funding', file: 'funding/funding.yml' }
    ]
};

describe('portfolioContext', () => {
    let index = '';
    test.beforeAll(() => {
        index = portfolioContext(ROOT, config, engineDir());
    });

    it('keeps the configured files in portfolio order and skips a missing file', () => {
        const headings = [
            '# registries/venues.yml (venue catalogue)',
            '# PROJECT MANIFESTS (status/venue source of truth)',
            '## projects/active/alpha',
            '## projects/archive/published/zulu',
            '# registries/pillars.yml',
            '# funding/funding.yml',
            '# network/events.yml',
            '# education/education.yml',
            '# network/joint-work.yml',
            '# tasks/tasks.yml'
        ];
        let previous = -1;
        for (const heading of headings) {
            const at = index.indexOf(heading);
            expect(at).toBeGreaterThan(previous);
            previous = at;
        }
        expect(index).not.toContain('applications/applications.yml');
        expect(index).not.toContain('decoy');
    });

    it('has the exact size of this fixture index', () => {
        expect(Buffer.byteLength(index)).toBe(461);
    });

    it('ignores a nested scan root manifest while retaining its child projects', () => {
        expect(index).not.toContain('scan-root-decoy');
        expect(index).toContain('## projects/archive/published/zulu\nid: zulu');
    });
});

describe('portfolioContext over a scan that carries the side-projects tier', () => {
    it('lists the research projects and no side project', () => {
        const withSide = {
            ...config,
            scan: [
                ...(config.scan as unknown[]),
                { dir: 'side-projects', type: 'side-project', optional: true }
            ]
        };
        const index = portfolioContext(ROOT, withSide, engineDir());
        expect(index).toContain('## projects/active/alpha');
        expect(index).not.toContain('side-projects/x');
        expect(index).not.toContain('Side X');
    });
});

describe('private atomic text writes', () => {
    it('creates an index with mode 0600 and preserves an existing file mode', () => {
        const path = join(ROOT, 'state', 'chat', 'private.md');
        expect(path.startsWith(ROOT + sep)).toBe(true);
        writeTextAtomic(path, 'private index', 0o600);
        expect(statSync(path).mode & 0o777).toBe(0o600);
        chmodSync(path, 0o640);
        writeTextAtomic(path, 'updated index', 0o600);
        expect(statSync(path).mode & 0o777).toBe(0o640);
        expect(readFileSync(path, 'utf8')).toBe('updated index');
        writeTextAtomic(path, 'default write');
        expect(statSync(path).mode & 0o777).toBe(0o640);
    });
});
