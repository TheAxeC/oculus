// Layer 4, test fixture. The synthetic hub the write suites build under the system temporary
// directory, the manifest, tasks and collection bodies they start from, and the helpers that build
// a hub, a write record and the paths a write lands on. Every path a suite writes is asserted to be
// inside its own hub before it is written.

import { mkdirSync, readFileSync, symlinkSync, writeFileSync } from 'node:fs';
import { join, resolve, sep } from 'node:path';
import { expect } from 'vitest';
import { portfolioConfigFrom } from '../../../src/lib/data/index.ts';
import { engineDir, loadConfig } from '../../../src/lib/data/sources/config.ts';
import type { PortfolioConfig } from '../../../src/lib/data/model/index.ts';
import { scratchDir } from '../../fixtures/scratch.ts';
import { PERSONAL_ROOT, PERSONAL_SCAN, plantPersonal } from '../../routes/edit/write-fixture.ts';
import type { PlantedPersonal } from '../../routes/edit/write-fixture.ts';

export const MANIFEST = [
    'id: alpha',
    'tier: projects',
    'type: active',
    'title: "A title"',
    'pin: true',
    'year: 2026',
    'status:',
    '  chips: [submitted, lead]',
    '  line: "the line"',
    'pillar: [tensor]',
    ''
].join('\n');

/**
 * The real schema and vocabulary over a scan of the research folder, the folders a new project of
 * the tiers `projects` and `archive` is made in, and the folder of personal projects, with the
 * hub's `new_project_dir` for the tiers `projects` and `personal`.
 */
export function configFor(): PortfolioConfig {
    const real = portfolioConfigFrom(loadConfig(engineDir()).config);
    return {
        ...real,
        scan: [
            { dir: 'projects/manuscripts' },
            { dir: 'projects/ideas', optional: true },
            { dir: 'projects/archive', optional: true },
            { ...PERSONAL_SCAN, optional: true }
        ],
        newProjectDir: { projects: 'projects/ideas', personal: 'side-projects' }
    };
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

/** The hub path and the root path of the two personal manifests of `personalWorld`. */
export type PersonalWorld = PlantedPersonal & {
    /** The hub, with its research project and a personal project at `side-projects/idea`. */
    root: string;
    /** The portfolio configuration, scanning the research folder and the personal folder. */
    config: PortfolioConfig;
};

/**
 * A hub with a personal project in its `side-projects/` folder and a served root with another at
 * `.oculus/project.yml`, both holding `PERSONAL_MANIFEST`.
 */
export function personalWorld(): PersonalWorld {
    const root = hub();
    const planted = plantPersonal(root);
    const base = configFor();
    const repositories = [{ key: PERSONAL_ROOT, dir: planted.served }];
    return { root, config: { ...base, repositories }, ...planted };
}

/**
 * A hub whose own `.oculus/local.yml` holds `port: 8791` and whose layer file `behavior.yml` is a
 * link to it, with that file's path.
 */
export function linkedHub(): { hub: string; local: string } {
    const hub = scratchDir('oculus-hub-');
    mkdirSync(join(hub, '.oculus', 'config'), { recursive: true });
    const local = join(hub, '.oculus', 'local.yml');
    writeFileSync(local, 'port: 8791\n');
    symlinkSync('../local.yml', join(hub, '.oculus', 'config', 'behavior.yml'));
    return { hub, local };
}

/**
 * A hub whose layer file `behavior.yml` is a link to the `local.yml` of an engine's own config
 * folder, which is made holding `port: 8791`, with that file's path.
 */
export function hubLinkedToEngine(engine: string): { hub: string; local: string } {
    const hub = scratchDir('oculus-hub-');
    mkdirSync(join(hub, '.oculus', 'config'), { recursive: true });
    const local = join(engine, 'config', 'local.yml');
    writeFileSync(local, 'port: 8791\n');
    symlinkSync(local, join(hub, '.oculus', 'config', 'behavior.yml'));
    return { hub, local };
}
