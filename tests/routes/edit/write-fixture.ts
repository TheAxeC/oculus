// The synthetic hub, the deck file and the request every case of the write endpoint is made over.
//
// The hub is under the system temporary directory and every path is asserted to be inside it before
// anything is written, the overrides file, the reader's own bookmarks and the change log included,
// so no case of either suite reaches ~/.oculus or the checkout.
//
// It is its own file because the suites are made over it: tests/routes/edit/write.test.ts, which
// is what each write kind answers, tests/routes/edit/undo/undo.test.ts, which is what taking one
// of them back writes, and the two config-key suites, which write a scratch copy of the engine's
// config folder (`scratchEngine`) and never the checkout's.

import {
    copyFileSync,
    existsSync,
    mkdirSync,
    readdirSync,
    readFileSync,
    writeFileSync
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve, sep } from 'node:path';
import { expect } from 'vitest';
import { parse } from 'yaml';
import { logChanges, readChanges } from '../../../src/lib/server/core/changes.ts';
import { fsWrites } from '../../../src/lib/server/core/json.ts';
import { mintToken } from '../../../src/lib/server/core/auth.ts';
import { portfolioConfigFrom } from '../../../src/lib/data/index.ts';
import { LOCAL_NAME, engineDir, loadConfig } from '../../../src/lib/data/sources/config.ts';
import type { Project, Tier } from '../../../src/lib/data/model/index.ts';
import { handleWrite } from '../../../src/lib/server/edit/writes.ts';
import type { Change, ChangeLog, ChangeRecord } from '../../../src/lib/server/core/changes.ts';
import type { WriteTarget } from '../../../src/lib/server/edit/writes.ts';
import type { ConfigKeyOutcome } from '../../../src/lib/server/edit/writes/config/config-key.ts';
import { present } from '../../fixtures/present.ts';
import { scratchDir } from '../../fixtures/scratch.ts';
import { careerRules } from '../../../src/lib/server/edit/writes/subtasks.ts';
import { fixtureProject } from '../../fixtures/entities-fixture.ts';

export const MANIFEST =
    'id: alpha\ntype: manuscript\ntitle: "A title"\nstatus:\n  line: "the line"\n';

/** A collection file and a career file, at the hub paths config/sources.yml names. */
export const TASKS =
    'title: Tasks\nschema:\n  - { field: title, type: text }\n  - { field: meta, type: metalist }\nentries:\n  - title: "Review the draft"\n    status: open\n    subtasks:\n      - { do: read it }\n\n  - title: "Another task"\n    status: open\n';

export const VENUES =
    'title: Venues\nschema:\n  - { field: name, type: text }\n  - { field: id, type: text }\nvenues:\n  - name: Existing Venue\n    id: existing\n';

export const DATA =
    'title: Data\nschema:\n  - { field: key, type: text }\n  - { field: retrieval, type: raw }\ndatasets:\n  - key: mimic-iv\n    retrieval:\n      method: curl\n';

export const CAREER = 'title: Career\nhosts:\n  - { name: "Naesens", status: "warm" }\n';
export const RADAR = 'meta: {}\nentries:\n  - title: "Paper"\n';
export const LEADS = `meta: {}
schema:
  - { field: title, type: text }
  - { field: status, type: select, options: [open, applied, declined, dismissed] }
  - { field: date, type: date }
entries:
  - title: "Lead"
    status: open
`;
export const TOKEN = mintToken();
export const HOST = '127.0.0.1:8791';
export const URL_ = `http://${HOST}/api/write`;

export function target(): WriteTarget {
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
 * The write target over a synthetic hub whose overrides file, bookmarks and change log were
 * checked to be inside it, over the engine's own configuration with one scanned folder.
 */
export function targetOver(
    dir: string,
    files: { overrides: string; bookmarks: string; changes: string },
    keep = 500
): WriteTarget {
    const real = portfolioConfigFrom(loadConfig(engineDir()).config, engineDir());
    return {
        hub: dir,
        config: { ...real, scan: [{ dir: 'projects/manuscripts', type: 'manuscript' }] },
        engine: engineDir(),
        career: careerRules(loadConfig(engineDir()).config),
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
export function logOf(into: WriteTarget): ChangeLog {
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
export function tasksOf(into: WriteTarget): string {
    return readFileSync(join(into.hub, 'tasks', 'tasks.yml'), 'utf8');
}

/** The manifest of a target, which the manifest cases read back and replace. */
function manifestFile(into: WriteTarget): string {
    return join(into.hub, 'projects', 'manuscripts', 'alpha', 'project.yml');
}

export function manifestOf(into: WriteTarget): string {
    return readFileSync(manifestFile(into), 'utf8');
}

/** The manifest of a target, replaced by a text that holds the value a case starts from. */
export function hold(into: WriteTarget, text: string): void {
    writeFileSync(manifestFile(into), text);
}

/** One manifest write through the route, and the change it left at the head of the log. */
export async function wrote(into: WriteTarget, fields: Record<string, unknown>): Promise<Change> {
    const response = await handleWrite(
        request({ kind: 'manifest', id: 'alpha', fields }),
        TOKEN,
        into
    );
    expect(response.status).toBe(200);
    return changesOf(into)[0];
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
    into: WriteTarget,
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
 * Undo a change the file has moved on from and prove the answer is `moved` and `file` is `held`.
 */
export async function undoneMoved(
    into: WriteTarget,
    change: Change,
    file: string,
    held: string
): Promise<void> {
    const response = await undone(into, change);
    expect(response.status).toBe(409);
    expect(await response.json()).toEqual({ error: 'moved' });
    expect(readFileSync(file, 'utf8')).toBe(held);
}

/**
 * A record made by hand, appended to the log as if a write had left it, and read back. `removed`
 * is whatever the case wants the line to carry, well-formed or not.
 */
export async function recorded(
    into: WriteTarget,
    field: string,
    before: unknown,
    after: unknown,
    removed?: unknown
): Promise<Change> {
    const record: ChangeRecord = {
        file: join('projects', 'manuscripts', 'alpha', 'project.yml'),
        key: 'alpha',
        field,
        before,
        after,
        undo: 'field'
    };
    if (removed !== undefined) record.removed = removed as ChangeRecord['removed'];
    await logChanges(into.changes, 'manifest', [record]);
    return changesOf(into)[0];
}

/** A deck file of the same shape as config/present.yml, with comments the edit must keep. */
export const DECK = `deck:
    # the deck's own slides, in the order it shows them
    order:
        - { slide: title }
        - { slide: framing, ref: engine }
        - { slide: project, ref: alpha }
        - { slide: closing }
    framing:
        engine: { title: 'The common engine' }
`;

/** The `deck:` map of a deck file, as the portfolio config carries it. */
export function deckMapOf(source: string): unknown {
    return (parse(source) as { deck: unknown }).deck;
}

/** One project with one slide, at the tier whose slides join the deck on their own. */
export function slideProject(id: string, tier: Tier): Project {
    return fixtureProject({
        id,
        tier,
        type: tier === 'active' ? 'active' : 'archive',
        title: id,
        present: [{ id, projectId: id, specs: [], panels: [], method: [], results: [] }],
        folder: `projects/${tier}/${id}`,
        file: `projects/${tier}/${id}/project.yml`
    });
}

/**
 * A target whose deck file is a copy under the system temporary directory, so no case here writes
 * the engine's own config/present.yml. The projects are the snapshot the catalog is built over:
 * `alpha` is placed by the order and `gamma` is archived, so neither the view nor the write offers
 * it a place in the catalog.
 */
export function deckTarget(): WriteTarget {
    const dir = scratchDir('oculus-deck-');
    const file = join(dir, 'present.yml');
    expect(resolve(file).startsWith(resolve(dir) + sep)).toBe(true);
    writeFileSync(file, DECK);
    const real = portfolioConfigFrom(loadConfig(engineDir()).config, engineDir());
    const changes = join(dir, 'changes.jsonl');
    expect(resolve(changes).startsWith(resolve(dir) + sep)).toBe(true);
    return {
        hub: dir,
        config: { ...real, deck: deckMapOf(DECK), deckFile: file },
        engine: engineDir(),
        career: careerRules(loadConfig(engineDir()).config),
        projects: () => [slideProject('alpha', 'active'), slideProject('gamma', 'archive')],
        bookmarks: join(dir, 'bookmarks.yml'),
        behaviorFile: join(dir, 'behavior.yml'),
        layoutFile: join(dir, 'layout.yml'),
        glyphs: [],
        changes: { file: changes, keep: 500, writes: fsWrites() }
    };
}

/** What the deck file of a target holds now. */
export function deckOf(into: WriteTarget): string {
    return readFileSync(into.config.deckFile, 'utf8');
}

/**
 * A folder copied file by file, the machine's own file left out by name before anything of it is
 * read.
 */
function copyConfig(from: string, to: string): void {
    mkdirSync(to, { recursive: true });
    for (const entry of readdirSync(from, { withFileTypes: true })) {
        if (entry.name === LOCAL_NAME) continue;
        if (entry.isDirectory()) copyConfig(join(from, entry.name), join(to, entry.name));
        else copyFileSync(join(from, entry.name), join(to, entry.name));
    }
}

/**
 * A scratch engine holding a copy of this checkout's tracked config/, the machine's own file left
 * out, which is what a case of the config-key write is made over.
 */
export function scratchEngine(): string {
    const engine = scratchDir('oculus-engine-');
    expect(resolve(engine).startsWith(resolve(tmpdir()) + sep)).toBe(true);
    copyConfig(join(engineDir(), 'config'), join(engine, 'config'));
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
export function configTarget(engine: string = scratchEngine()): WriteTarget {
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
