// Layer 4, test fixture. The synthetic hub the write suites build under the system temporary
// directory, the manifest, tasks and collection bodies they start from, and the helpers that build
// a hub, a write record and the paths a write lands on. Every path a suite writes is asserted to be
// inside its own hub before it is written.

import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, resolve, sep } from 'node:path';
import { expect } from 'vitest';
import { portfolioConfigFrom } from '../../../src/lib/data/index.ts';
import { engineDir, loadConfig } from '../../../src/lib/data/sources/config.ts';
import type { PortfolioConfig } from '../../../src/lib/data/model/index.ts';
import { scratchDir } from '../../fixtures/scratch.ts';

export const MANIFEST = [
    'id: alpha',
    'type: manuscript',
    'title: "A title"',
    'pin: true',
    'year: 2026',
    'status:',
    '  chips: [submitted, lead]',
    '  line: "the line"',
    'pillar: [tensor]',
    ''
].join('\n');

/** The real schema and vocabulary over a scan that names one synthetic tier. */
export function configFor(): PortfolioConfig {
    const real = portfolioConfigFrom(loadConfig(engineDir()).config, engineDir());
    return { ...real, scan: [{ dir: 'projects/manuscripts', type: 'manuscript' }] };
}

/** A hub with one project in it, under the system temporary directory. */
export function hub(manifest = MANIFEST): string {
    const dir = scratchDir('oculus-writes-');
    const folder = join(dir, 'projects', 'manuscripts', 'alpha');
    expect(resolve(folder).startsWith(resolve(dir) + sep)).toBe(true);
    mkdirSync(folder, { recursive: true });
    writeFileSync(join(folder, 'project.yml'), manifest);
    return dir;
}

export function manifestOf(root: string): string {
    return readFileSync(join(root, 'projects', 'manuscripts', 'alpha', 'project.yml'), 'utf8');
}

/** One change-log record, as a writer of this suite makes it. */
export function record(
    file: string,
    key: string,
    field: string,
    before: unknown,
    after: unknown,
    undo = 'field'
): unknown {
    return { file, key, field, before, after, undo };
}

/** The manifest file of the one project every hub of this suite holds. */
export function manifestPath(root: string): string {
    return join(root, 'projects', 'manuscripts', 'alpha', 'project.yml');
}

/** The tasks collection file of a hub of this suite. */
export function tasksPath(root: string): string {
    return join(root, 'tasks', 'tasks.yml');
}

/** A collection file at the hub path config/sources.yml gives the `tasks` key. */
export const TASKS = [
    'title: Tasks',
    'schema:',
    '  - { field: title, type: text }',
    '  - { field: status, type: select }',
    '  - { field: meta, type: metalist }',
    'entries:',
    '  - title: "Review the draft"',
    '    status: open',
    '    subtasks:',
    '      - { do: read it }',
    ''
].join('\n');

const VENUES = [
    'title: Venues',
    'schema:',
    '  - { field: name, type: text }',
    '  - { field: id, type: text }',
    'venues:',
    '  - name: Existing Venue',
    '    id: existing',
    ''
].join('\n');

export const CAREER = [
    'title: Career',
    'hosts:',
    '  - { name: "Naesens", inst: "KU Leuven", status: "warm" }',
    ''
].join('\n');

/** The same hub with a collection file and a career file beside the one manifest. */
export function wider(): string {
    const root = hub();
    for (const [path, body] of [
        ['tasks/tasks.yml', TASKS],
        ['registries/venues.yml', VENUES],
        ['registries/career.yml', CAREER]
    ]) {
        const file = join(root, path);
        expect(resolve(file).startsWith(resolve(root) + sep)).toBe(true);
        mkdirSync(join(file, '..'), { recursive: true });
        writeFileSync(file, body);
    }
    return root;
}

export function tasksOf(root: string): string {
    return readFileSync(join(root, 'tasks', 'tasks.yml'), 'utf8');
}
