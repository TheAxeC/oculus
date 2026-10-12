// Layer 4, test helper. The synthetic hub, the deck file and the request every case of the write
// endpoint is made over.
//
// The hub is under the system temporary directory and every path is asserted to be inside it before
// anything is written, the overrides file, the reader's own bookmarks and the change log included,
// so no case of either suite reaches ~/.oculus or the checkout.
//
// It is its own file because the suites are made over it: tests/routes/edit/write.test.ts, which
// is what each write kind answers, tests/routes/edit/undo/undo.test.ts, which is what taking one
// of them back writes, and the two config-key suites, which write a scratch copy of the engine's
// config folder (`scratchEngine`) and never the checkout's.

import { cpSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve, sep } from 'node:path';
import { expect } from 'vitest';
import { readChanges } from '../../../src/lib/server/core/changes.ts';
import { fsWrites } from '../../../src/lib/server/core/json.ts';
import { mintToken } from '../../../src/lib/server/core/auth.ts';
import { portfolioConfigFrom } from '../../../src/lib/data/index.ts';
import { engineDir, loadConfig } from '../../../src/lib/data/sources/config.ts';
import type { PortfolioConfig, Project, Tier } from '../../../src/lib/data/model/index.ts';
import { handleWrite } from '../../../src/lib/server/edit/writes.ts';
import type { Change, ChangeLog } from '../../../src/lib/server/core/changes.ts';
import type { PrimaryTarget, WriteTarget } from '../../../src/lib/server/edit/writes.ts';
import type { ConfigKeyOutcome } from '../../../src/lib/server/edit/writes/config/config-key.ts';
import { present } from '../../fixtures/present.ts';
import { scratchDir } from '../../fixtures/scratch.ts';
import { careerRules } from '../../../src/lib/server/edit/writes/subtasks.ts';
import { fixtureProject } from '../../fixtures/entities-fixture.ts';

export const MANIFEST =
    'id: alpha\ntier: projects\ntype: active\ntitle: "A title"\nstatus:\n  line: "the line"\n';

/** A collection file and a career file, at the hub paths config/sources.yml names. */
const TASKS =
    'title: Tasks\nschema:\n  - { field: title, type: text }\n  - { field: meta, type: metalist }\nentries:\n  - title: "Review the draft"\n    status: open\n    subtasks:\n      - { do: read it }\n\n  - title: "Another task"\n    status: open\n';

const VENUES =
    'title: Venues\nschema:\n  - { field: name, type: text }\n  - { field: id, type: text }\nvenues:\n  - name: Existing Venue\n    id: existing\n';

const DATA =
    'title: Data\nschema:\n  - { field: key, type: text }\n  - { field: retrieval, type: raw }\ndatasets:\n  - key: mimic-iv\n    retrieval:\n      method: curl\n';

const CAREER = 'title: Career\nhosts:\n  - { name: "Naesens", status: "warm" }\n';
const RADAR = 'meta: {}\nentries:\n  - title: "Paper"\n';
const LEADS = `meta: {}
schema:
  - { field: title, type: text }
  - { field: status, type: select, options: [open, applied, declined, dismissed] }
  - { field: date, type: date }
entries:
  - title: "Lead"
    status: open
`;
export const TOKEN = mintToken();
const HOST = '127.0.0.1:8791';
const URL_ = `http://${HOST}/api/write`;

export function target(): PrimaryTarget {
    const dir = scratchDir('oculus-route-');
    const folder = join(dir, 'projects', 'manuscripts', 'alpha');
    expect(resolve(folder).startsWith(resolve(dir) + sep)).toBe(true);
    mkdirSync(folder, { recursive: true });
    writeFileSync(join(folder, 'project.yml'), MANIFEST);
    for (const [path, body] of [
        ['tasks/tasks.yml', TASKS],
        ['registries/venues.yml', VENUES],
        ['registries/data.yml', DATA],
        ['registries/career.yml', CAREER],
        ['feeds/literature-radar.yml', RADAR],
        ['feeds/position-leads.yml', LEADS]
    ]) {
        const file = join(dir, path);
        expect(resolve(file).startsWith(resolve(dir) + sep)).toBe(true);
        mkdirSync(join(file, '..'), { recursive: true });
        writeFileSync(file, body);
    }
    const linkedin = join(dir, 'theaxec.github.io', '_linkedin');
    expect(resolve(linkedin).startsWith(resolve(dir) + sep)).toBe(true);
    mkdirSync(linkedin, { recursive: true });
    writeFileSync(
        join(linkedin, 'xx-route-idea.md'),
        '---\ntitle: "Route idea"\ncategory: research\ndate: 2026-09-12\n---\n\n'
    );
    // The overrides file is inside the same temporary directory, so a session write in this suite
    // can never reach ~/.oculus/sessions.json.
    const overrides = join(dir, 'sessions.json');
    expect(resolve(overrides).startsWith(resolve(dir) + sep)).toBe(true);
    // The bookmarks file is inside it too, so a collection write in this suite can never reach
    // ~/.oculus/bookmarks.yml.
    const bookmarks = join(dir, 'bookmarks.yml');
    expect(resolve(bookmarks).startsWith(resolve(dir) + sep)).toBe(true);
    // The change log is inside the same temporary directory, so no write of this suite can reach
    // ~/.oculus/changes.jsonl.
    const changes = join(dir, 'changes.jsonl');
    expect(resolve(changes).startsWith(resolve(dir) + sep)).toBe(true);
    return targetOver(dir, { overrides, bookmarks, changes });
}

/**
 * Loads the engine's configuration once. The first load of a process costs about twice a later one,
 * so a file that loads it in every case registers this as a hook, and that cost is the hook's and
 * not the first case's.
 */
export function warmConfig(): void {
    loadConfig(engineDir());
}

/**
 * The write target over a synthetic hub whose overrides file, bookmarks and change log were
 * checked to be inside it, over the engine's own configuration with two scanned folders and the
 * folder a new project of the tier `projects` is made in.
 */
export function targetOver(
    dir: string,
    files: { overrides: string; bookmarks: string; changes: string },
    keep = 500
): PrimaryTarget {
    const merged = loadConfig(engineDir()).config;
    const real = portfolioConfigFrom(merged);
    return {
        hub: dir,
        primary: 'hub',
        config: {
            ...real,
            scan: [{ dir: 'projects/manuscripts' }, { dir: 'projects/ideas', optional: true }],
            newProjectDir: { projects: 'projects/ideas' }
        },
        engine: engineDir(),
        career: careerRules(merged),
        overrides: files.overrides,
        projects: () => [],
        bookmarks: files.bookmarks,
        behaviorFile: join(dir, 'behavior.yml'),
        layoutFile: join(dir, 'layout.yml'),
        glyphs: [],
        changes: { file: files.changes, keep, writes: fsWrites() }
    };
}

/** The change log of a target, which an undo case addresses a change of. */
function logOf(into: WriteTarget): ChangeLog {
    const log = into.changes;
    if (log === undefined) throw new Error('the target carries no change log');
    return log;
}

/** The log of a target, newest first. */
export function changesOf(into: WriteTarget): Change[] {
    return readChanges(logOf(into));
}

/** What the overrides file holds, or null when nothing has written it yet. */
export function overridesOf(into: WriteTarget): unknown {
    const path = present(into.overrides, 'overrides file for the target');
    if (!existsSync(path)) return null;
    return JSON.parse(readFileSync(path, 'utf8'));
}

/** A request as the page makes it, with whatever headers and body a case wants instead. */
export function request(body: unknown, headers: Record<string, string> = {}): Request {
    return new Request(URL_, {
        method: 'POST',
        headers: {
            host: HOST,
            origin: `http://${HOST}`,
            'sec-fetch-site': 'same-origin',
            'content-type': 'application/json',
            'x-oculus-token': TOKEN,
            ...headers
        },
        body: typeof body === 'string' ? body : JSON.stringify(body)
    });
}

export const GOOD = { kind: 'manifest', id: 'alpha', fields: { 'status.line': 'a new line' } };

/** An absolute area to pin a session to. It is never opened: the overrides file only names it. */
export const AREA = '/hub/projects/manuscripts/alpha';

/** The tasks collection file of a target, which the undo cases read back. */
export function tasksOf(into: PrimaryTarget): string {
    return readFileSync(join(into.hub, 'tasks', 'tasks.yml'), 'utf8');
}

/** The manifest of a target, which the manifest cases read back and replace. */
function manifestFile(into: PrimaryTarget): string {
    return join(into.hub, 'projects', 'manuscripts', 'alpha', 'project.yml');
}

export function manifestOf(into: PrimaryTarget): string {
    return readFileSync(manifestFile(into), 'utf8');
}

/** The answer of the undo route for one change. */
export function undone(into: WriteTarget, change: Change): Promise<Response> {
    return handleWrite(request({ kind: 'undo', at: change.at }), TOKEN, into);
}

/**
 * Undo a change and prove the file is back to `before` byte for byte and the log holds the undo
 * above the change; answers the undo's record.
 */
export async function undoneBack(
    into: PrimaryTarget,
    change: Change,
    file: string,
    before: string
): Promise<Change> {
    const response = await undone(into, change);
    expect(response.status).toBe(200);
    expect(readFileSync(file, 'utf8')).toBe(before);
    const [back, first] = changesOf(into);
    expect(first.at).toBe(change.at);
    return back;
}

/**
 * The portfolio deck's file, a deck file with comments the edit must keep: three groups, and an
 * order of a file and the slides of two of them.
 */
export const DECK = `deck:
    title: A deck

groups:
    # the pillars
    pillars:
        find: { folders: projects/*/*/present, tiers: [projects] }
        slides:
            - alpha
    # the rest
    more:
        find: { folders: projects/*/*/present }
        slides: []
    ideas:
        find: { folders: projects/*/*/present, tiers: [archive] }
        slides:
            - gamma

# what is shown
order:
    - intro.md
    - { slides: pillars }
    # the rest follows
    - { slides: more }
`;

/** The order's tokens in that file, as the write names them. */
export const DECK_ORDER = ['intro.md', 'slides:pillars', 'slides:more'];

/** The hub folder of the portfolio deck the deck target holds. */
const DECK_FOLDER = 'deck';

/** One project that holds a deck of one slide, at the tier it is found by. */
function deckProject(id: string, tier: Tier): Project {
    return fixtureProject({
        id,
        tier,
        type: tier === 'projects' ? 'active' : 'published',
        title: id,
        folder: `projects/${tier}/${id}`,
        file: `projects/${tier}/${id}/project.yml`
    });
}

/**
 * A target over a hub in a temporary directory that holds the portfolio deck and the decks of three
 * projects: `alpha` is named by the group `pillars`, `beta` is found by it and waits as a
 * candidate, and `gamma` is archived, so the group `pillars`, whose `tiers:` do not find it, offers
 * it no place; the group `more` finds every project and `ideas` the archived ones.
 */
export function deckTarget(): PrimaryTarget {
    const dir = scratchDir('oculus-deck-');
    const file = join(dir, DECK_FOLDER, 'present.yml');
    expect(resolve(file).startsWith(resolve(dir) + sep)).toBe(true);
    mkdirSync(join(dir, DECK_FOLDER), { recursive: true });
    writeFileSync(file, DECK);
    writeFileSync(join(dir, DECK_FOLDER, 'intro.md'), '# Intro\n');
    const projects = [
        deckProject('alpha', 'projects'),
        deckProject('beta', 'projects'),
        deckProject('gamma', 'archive')
    ];
    for (const project of projects) {
        const folder = join(dir, project.folder, 'present');
        mkdirSync(folder, { recursive: true });
        writeFileSync(join(folder, 'present.yml'), 'order: [main.md]\n');
        writeFileSync(join(folder, 'main.md'), `# ${project.id}\n`);
    }
    const real = portfolioConfigFrom(loadConfig(engineDir()).config);
    const changes = join(dir, 'changes.jsonl');
    expect(resolve(changes).startsWith(resolve(dir) + sep)).toBe(true);
    return {
        hub: dir,
        primary: 'hub',
        config: { ...real, portfolioDeck: DECK_FOLDER },
        engine: engineDir(),
        career: careerRules(loadConfig(engineDir()).config),
        projects: () => projects,
        files: { roots: () => [{ key: 'hub', dir }] },
        bookmarks: join(dir, 'bookmarks.yml'),
        behaviorFile: join(dir, 'behavior.yml'),
        layoutFile: join(dir, 'layout.yml'),
        glyphs: [],
        changes: { file: changes, keep: 500, writes: fsWrites() }
    };
}

/**
 * The manifest of each personal project `plantPersonal` plants, with the research keys a write
 * takes.
 */
export const PERSONAL_MANIFEST = [
    'tier: personal',
    'type: idea',
    'title: "An idea"',
    'status:',
    '  chips: [nascent]',
    '  line: "New project."',
    'eli5: "what it is"',
    'snooze: 2026-11-01',
    'subtasks:',
    '  - { do: read it }',
    ''
].join('\n');

/** The scan rule that names the hub's folder of personal projects. */
export const PERSONAL_SCAN = { dir: 'side-projects' };

/**
 * The name of the folder `personalTarget` adds to the workspace, which is also the id of its
 * project.
 */
export const PERSONAL_ROOT = 'r';

/** What `plantPersonal` plants: the served root and the manifest file of each project by its id. */
export type PlantedPersonal = {
    /** The served root that holds the second project's `.oculus/project.yml`. */
    served: string;
    /** The manifest file of the hub project `idea` and of the repository project `r`. */
    files: Record<'idea' | 'r', string>;
};

/**
 * Two personal projects planted, both holding `PERSONAL_MANIFEST`: `idea` in the `side-projects/`
 * folder of `hubDir`, and `r` at `.oculus/project.yml` of a served root under the system temporary
 * directory. Every path is asserted to be inside the folder it is planted in.
 */
export function plantPersonal(hubDir: string): PlantedPersonal {
    const served = scratchDir('oculus-served-');
    const files = {
        idea: join(hubDir, 'side-projects', 'idea', 'project.yml'),
        r: join(served, '.oculus', 'project.yml')
    };
    for (const [id, file] of Object.entries(files)) {
        const inside = id === 'r' ? served : hubDir;
        expect(resolve(file).startsWith(resolve(inside) + sep)).toBe(true);
        mkdirSync(join(file, '..'), { recursive: true });
        writeFileSync(file, PERSONAL_MANIFEST);
    }
    return { served, files };
}

/**
 * The configuration of a target with one more folder of the workspace read as a project: the folder
 * joins the repositories the server reads from the workspace's folders.
 */
function withRoot(base: PrimaryTarget, entry: { key: string; dir: string }): PortfolioConfig {
    return { ...base.config, repositories: [...base.config.repositories, entry] };
}

/** What `personalTarget` plants: the target, and the manifest file of each project by its id. */
export type PersonalTarget = { into: PrimaryTarget; files: PlantedPersonal['files'] };

/**
 * The target with the two personal projects of `plantPersonal` planted, its scan naming the hub's
 * `side-projects/` folder and the served folder `r` among the workspace's folders.
 */
export function personalTarget(base: PrimaryTarget = target()): PersonalTarget {
    const { served, files } = plantPersonal(base.hub);
    const scan = [...base.config.scan, PERSONAL_SCAN];
    const rooted = withRoot(base, { key: PERSONAL_ROOT, dir: served });
    return { into: { ...base, config: { ...rooted, scan } }, files };
}

/**
 * The target with a personal project of a second hub, the hub `two`, added to the two of
 * `personalTarget`: its manifest is planted at `side-projects/idea/project.yml` of a folder of its
 * own under the system temporary directory, and the target names the hub, whose project is
 * `two:idea`.
 */
export function secondHubPersonal(
    base: PrimaryTarget = target()
): PersonalTarget & { second: string } {
    const first = personalTarget(base);
    const second = scratchDir('oculus-second-');
    const file = join(second, 'side-projects', 'idea', 'project.yml');
    expect(resolve(file).startsWith(resolve(second) + sep)).toBe(true);
    mkdirSync(join(file, '..'), { recursive: true });
    writeFileSync(file, PERSONAL_MANIFEST);
    const config = { ...first.into.config, scan: [PERSONAL_SCAN], repositories: [] };
    return {
        into: { ...first.into, hubs: [{ key: 'two', hub: second, config }] },
        files: first.files,
        second: file
    };
}

/** The id of the project `repositoryTarget` plants, which is the name of its folder. */
export const REPOSITORY_ID = 'gamma';

/** The manifest of the repository `repositoryTarget` plants. */
export const REPOSITORY_MANIFEST = [
    'tier: personal',
    'type: active',
    'title: "A repository"',
    'status:',
    '  chips: [building]',
    '  line: "the line"',
    'snooze: 2026-11-01',
    'subtasks:',
    '  - { do: read it }',
    ''
].join('\n');

/** What `repositoryTarget` plants: the target, the repository's folder and its manifest file. */
export type RepositoryTarget = { into: PrimaryTarget; dir: string; file: string };

/**
 * The target with a repository planted as a project: a folder under the system temporary directory
 * holding a README and, unless `manifest` is false, `.oculus/project.yml`, a folder of the
 * workspace. The target's published projects stay empty, so a write finds the repository by reading
 * the roots in force, as the server's writers do.
 */
export function repositoryTarget(
    base: PrimaryTarget = target(),
    manifest = true
): RepositoryTarget {
    const dir = scratchDir('oculus-repository-');
    const file = join(dir, '.oculus', 'project.yml');
    expect(resolve(file).startsWith(resolve(dir) + sep)).toBe(true);
    mkdirSync(join(dir, '.oculus'), { recursive: true });
    if (manifest) writeFileSync(file, REPOSITORY_MANIFEST);
    writeFileSync(join(dir, 'README.md'), '# A repository\n');
    return { into: { ...base, config: withRoot(base, { key: REPOSITORY_ID, dir }) }, dir, file };
}

/** The path of the portfolio deck's file under the hub of a deck target. */
export const DECK_PATH = `${DECK_FOLDER}/present.yml`;

/** What the portfolio deck's file of a target holds now. */
export function deckOf(into: PrimaryTarget): string {
    return readFileSync(join(into.hub, DECK_PATH), 'utf8');
}

/**
 * A scratch engine holding a copy of this checkout's tracked config/, which is what a case of the
 * config-key write is made over.
 */
export function scratchEngine(): string {
    const engine = scratchDir('oculus-engine-');
    expect(resolve(engine).startsWith(resolve(tmpdir()) + sep)).toBe(true);
    cpSync(join(engineDir(), 'config'), join(engine, 'config'), { recursive: true });
    return engine;
}

/** One file of a scratch engine's config folder, by its path under config/. */
export function engineFile(engine: string, name: string): string {
    const file = join(engine, 'config', name);
    expect(resolve(file).startsWith(resolve(tmpdir()) + sep)).toBe(true);
    return file;
}

/**
 * The write target of a scratch engine: the synthetic hub and change log of `target()`, over an
 * engine that is not the checkout, so the config-key write reads and writes the copy.
 */
export function configTarget(engine: string = scratchEngine()): PrimaryTarget {
    return {
        ...target(),
        engine,
        behaviorFile: engineFile(engine, 'behavior.yml'),
        layoutFile: engineFile(engine, 'layout.yml')
    };
}

/** The one refusal an outcome carries, with the proof that it changed and recorded nothing. */
export function refusalOf(outcome: ConfigKeyOutcome, field: string): string | undefined {
    expect(outcome.changed).toEqual([]);
    expect(outcome.records).toBeUndefined();
    expect(outcome.refused.map((one) => one.field)).toEqual([field]);
    return outcome.refused[0]?.reason;
}
