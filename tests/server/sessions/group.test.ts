// Workspace resolution, area scoring, overrides and ordering.
//
// Every record here is hand-built and every path is synthetic, so nothing depends on this
// machine's checkouts; the only directories touched are the temporary ones a case makes for the
// `.git` markers it needs. Real transcripts hold private research content and never enter a test.

import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve, sep } from 'node:path';
import { afterAll, describe, expect, it } from 'vitest';
import {
    GENERAL,
    UNKNOWN_NAME,
    defaultRoots,
    group,
    type ProjectFolder
} from '../../../src/lib/server/sessions/group.ts';
import { defaultOverridesPath } from '../../../src/lib/server/sessions/overrides.ts';
import type { Area, SessionRecord, Workspace } from '../../../src/lib/data/model/index.ts';
import { scratchDir, sweepScratch } from '../../fixtures/scratch.ts';

afterAll(sweepScratch);

const WS = '/synthetic/space/hub';
const OTHER = '/synthetic/space/other';
const ROOTS = ['/synthetic/space', '/synthetic'];
const T0 = '2026-01-01T10:00:00.000Z';
const T1 = '2026-01-01T11:00:00.000Z';
const T2 = '2026-01-01T12:00:00.000Z';
const T3 = '2026-01-01T13:00:00.000Z';

/** A record with only the fields grouping reads. `files` is a list of [path, stamp]. */
function record(
    options: Partial<{
        id: string;
        cwd: string | null;
        files: [string, string][];
        last: string;
        title: string;
    }> = {}
): SessionRecord {
    return {
        id: options.id ?? 's1',
        cwd: options.cwd === undefined ? WS : options.cwd,
        title: options.title ?? 'a session',
        lastActivity: options.last ?? T0,
        files: (options.files ?? []).map(([path, stamp]) => ({
            path,
            tool: 'Read',
            count: 1,
            last: stamp
        }))
    } as unknown as SessionRecord;
}

/** One temporary directory per case, for the `.git` markers and the overrides file. */
function fixture(): { dir: string; overrides: string } {
    const dir = scratchDir('oculus-group-');
    expect(resolve(dir).startsWith(resolve(tmpdir()) + sep)).toBe(true);
    return { dir, overrides: join(dir, 'sessions.json') };
}

function arrange(
    records: SessionRecord[],
    options: Partial<{
        folders: ProjectFolder[];
        roots: string[] | null;
        attached: string[];
        overrides: string;
    }> = {}
): Workspace[] {
    return group(
        records,
        options.folders ?? [],
        options.roots === undefined ? ROOTS : options.roots,
        options.attached ?? [],
        options.overrides ?? join(tmpdir(), 'oculus-group-absent', 'sessions.json')
    );
}

/** The one workspace, its one area and its first session, asserted to be the only ones there. */
function one(
    records: SessionRecord[],
    options: Parameters<typeof arrange>[1] = {}
): { workspace: Workspace; area: Area; session: Workspace['areas'][0]['sessions'][0] } {
    const found = arrange(records, options);
    expect(found.length).toBe(1);
    expect(found[0].areas.length).toBe(1);
    return { workspace: found[0], area: found[0].areas[0], session: found[0].areas[0].sessions[0] };
}

describe('the workspace', () => {
    it('is marked by a .git directory and by a .git file alike', () => {
        const { dir } = fixture();
        for (const [marker, name] of [
            ['dir', 'checkout'],
            ['file', 'worktree']
        ]) {
            const root = join(dir, name);
            const deep = join(root, 'a', 'b');
            mkdirSync(deep, { recursive: true });
            if (marker === 'dir') mkdirSync(join(root, '.git'));
            else writeFileSync(join(root, '.git'), 'gitdir: /elsewhere\n');
            const { workspace, area } = one([record({ cwd: deep })], { roots: [dir] });
            expect(workspace.key).toBe(root);
            expect(workspace.name).toBe(name);
            expect(area.short).toBe(join('a', 'b'));
        }
        rmSync(dir, { recursive: true, force: true });
    });

    it('falls back to the first segment below the longest root', () => {
        const { workspace } = one([record({ cwd: WS + '/tools/cockpit' })]);
        expect(workspace.key).toBe(WS);
        expect(workspace.name).toBe('hub');
    });

    it('uses a shorter root only when no longer one matches', () => {
        const { workspace } = one([record({ cwd: '/synthetic/loose/deep/inner' })]);
        expect(workspace.key).toBe('/synthetic/loose');
    });

    it('is the cwd itself when nothing else matches', () => {
        const { workspace, area } = one([record({ cwd: '/elsewhere/solo' })], { roots: [] });
        expect(workspace.key).toBe('/elsewhere/solo');
        expect(area.short).toBe('solo');
    });

    it('is the unknown workspace for a record without a cwd', () => {
        const { workspace, area, session } = one([record({ cwd: null })]);
        expect(workspace.key).toBe('');
        expect(workspace.name).toBe(UNKNOWN_NAME);
        expect(area.key).toBe(GENERAL);
        expect(session.workspace).toBe('');
    });
});

describe('the area score', () => {
    it('gives the deepest project folder the session, and its title', () => {
        const deep = WS + '/projects/paper';
        const { area, session } = one(
            [record({ cwd: deep + '/code', files: [[deep + '/code/run.py', T1]] })],
            {
                folders: [
                    [WS + '/projects', 'All projects'],
                    [deep, 'The paper']
                ]
            }
        );
        expect(area.key).toBe(deep);
        expect(area.short).toBe('projects/paper');
        expect(area.full).toBe('The paper');
        expect(area.known).toBe(true);
        expect(session.area).toBe(deep);
    });

    it('labels an unknown area by itself and does not call it known', () => {
        const { area } = one([record({ cwd: WS + '/tools/cockpit' })], {
            folders: [WS + '/projects']
        });
        expect(area.short).toBe('tools/cockpit');
        expect(area.full).toBe('tools/cockpit');
        expect(area.known).toBe(false);
    });

    it('does not score a file outside the workspace', () => {
        const outside: [string, string][] = [
            [OTHER + '/x.py', T1],
            ['/var/tmp/scratch/y.md', T2]
        ];
        const { area, session } = one([
            record({ cwd: WS + '/tools', files: [...outside, ...outside, ...outside] })
        ]);
        expect(area.key).toBe(WS + '/tools');
        expect(session.secondaryAreas).toEqual([]);
    });

    it('settles a tie with the cwd bonus that a single file would win', () => {
        // One file elsewhere, touched later than the session's own last activity: it would take
        // the tie on recency if the cwd only scored one.
        const { area } = one([record({ cwd: WS + '/tools', files: [[WS + '/docs/note.md', T3]] })]);
        expect(area.key).toBe(WS + '/tools');
    });

    it('lets two files outrank the cwd bonus', () => {
        const { area } = one([
            record({
                cwd: WS + '/tools',
                files: [
                    [WS + '/docs/a.md', T1],
                    [WS + '/docs/b.md', T2]
                ]
            })
        ]);
        expect(area.key).toBe(WS + '/docs');
    });

    it('catches a session with nothing to score in the general area', () => {
        const { area, session } = one([record({ cwd: null, files: [[OTHER + '/x.py', T1]] })]);
        expect(area.key).toBe(GENERAL);
        expect(area.short).toBe(GENERAL);
        expect(area.full).toBe(GENERAL);
        expect(session.area).toBe(GENERAL);
    });

    it('scores, orders and caps the secondary areas', () => {
        const files: [string, string][] = [
            [WS + '/a/1.py', T0],
            [WS + '/a/2.py', T0],
            [WS + '/a/3.py', T0],
            [WS + '/a/4.py', T0],
            [WS + '/b/1.py', T0],
            [WS + '/b/2.py', T0],
            [WS + '/b/3.py', T0],
            [WS + '/c/1.py', T0],
            [WS + '/c/2.py', T0],
            [WS + '/d/1.py', T2],
            [WS + '/d/2.py', T2],
            [WS + '/e/1.py', T1],
            [WS + '/e/2.py', T1],
            [WS + '/f/only.py', T0]
        ];
        const { area, session } = one([record({ cwd: WS + '/a', files })]);
        expect(area.key).toBe(WS + '/a');
        expect(session.secondaryAreas.map((entry) => entry.key)).toEqual([
            WS + '/b',
            WS + '/d',
            WS + '/e'
        ]);
        expect(session.secondaryAreas.map((entry) => entry.short)).toEqual(['b', 'd', 'e']);
    });

    it('clamps a deep directory to two segments', () => {
        // A session that reads several files out of one deep subfolder is still filed under the
        // place it works, not under the subfolder.
        const deep = WS + '/tools/cockpit/design';
        const found = arrange([
            record({
                cwd: WS + '/tools/cockpit',
                files: [
                    [deep + '/a.md', T1],
                    [deep + '/b.md', T1],
                    [deep + '/c.md', T1],
                    [deep + '/d.md', T1]
                ]
            })
        ]);
        expect(found[0].areas[0].key).toBe(WS + '/tools/cockpit');
    });

    it('exempts a known project folder from the clamp', () => {
        // A manifest folder deeper than the clamp still wins: the clamp only applies to
        // directories nothing else identifies.
        const project = WS + '/projects/manuscripts/ward';
        const found = arrange(
            [
                record({
                    cwd: WS,
                    files: [
                        [project + '/manuscript/main.tex', T1],
                        [project + '/manuscript/refs.bib', T1],
                        [project + '/README.md', T1]
                    ]
                })
            ],
            { folders: [[project, 'Ward paper']] }
        );
        expect(found[0].areas[0].key).toBe(project);
        expect(found[0].areas[0].full).toBe('Ward paper');
    });
});

describe('the overrides', () => {
    it('repins the session on an area override and keeps the scored area secondary', () => {
        const { overrides } = fixture();
        writeFileSync(
            overrides,
            JSON.stringify({ sessions: { s1: { area: WS + '/pinned', title: 'my name for it' } } })
        );
        const { area, session } = one(
            [record({ cwd: WS + '/tools', files: [[WS + '/tools/x.py', T1]] })],
            { overrides }
        );
        expect(area.key).toBe(WS + '/pinned');
        expect(area.short).toBe('pinned');
        expect(session.pinned).toBe(true);
        expect(session.title).toBe('my name for it');
        expect(session.secondaryAreas.map((entry) => entry.key)).toEqual([WS + '/tools']);
    });

    it('leaves the scored area alone for a title override', () => {
        const { overrides } = fixture();
        writeFileSync(overrides, JSON.stringify({ sessions: { s1: { title: 'renamed' } } }));
        const { area, session } = one([record({ cwd: WS + '/tools' })], { overrides });
        expect(area.key).toBe(WS + '/tools');
        expect(session.title).toBe('renamed');
        expect(session.pinned).toBe(false);
    });

    it('moves the workspace with an override pointing outside it', () => {
        const { overrides } = fixture();
        writeFileSync(overrides, JSON.stringify({ sessions: { s1: { area: OTHER + '/deep' } } }));
        const { workspace, area } = one([record({ cwd: WS + '/tools' })], { overrides });
        expect(workspace.key).toBe(OTHER);
        expect(area.short).toBe('deep');
    });

    it('ignores a corrupt or missing overrides file', () => {
        const { dir, overrides } = fixture();
        for (const text of ['{not json', '[]', '{"sessions": 3}']) {
            writeFileSync(overrides, text);
            const { area, session } = one([record({ cwd: WS + '/tools' })], { overrides });
            expect(area.key).toBe(WS + '/tools');
            expect(session.pinned).toBe(false);
        }
        rmSync(overrides);
        const { session } = one([record({ cwd: WS + '/tools' })], { overrides });
        expect(session.pinned).toBe(false);
        rmSync(dir, { recursive: true, force: true });
    });

    it('changes nothing for an override naming a session that is not there', () => {
        const { overrides } = fixture();
        writeFileSync(overrides, JSON.stringify({ sessions: { ghost: { area: WS + '/pinned' } } }));
        const { area } = one([record({ cwd: WS + '/tools' })], { overrides });
        expect(area.key).toBe(WS + '/tools');
    });
});

describe('the tree', () => {
    it('sets the kind from the attached ids', () => {
        const found = arrange(
            [record({ id: 's1', cwd: WS + '/tools' }), record({ id: 's2', cwd: WS + '/tools' })],
            { attached: ['s2'] }
        );
        const kinds = Object.fromEntries(
            found[0].areas[0].sessions.map((session) => [session.id, session.kind])
        );
        expect(kinds).toEqual({ s1: 'observed', s2: 'attached' });
    });

    it('sorts workspaces, areas and sessions newest first', () => {
        const found = arrange([
            record({ id: 'old', cwd: WS + '/tools', last: T0 }),
            record({ id: 'new', cwd: WS + '/tools', last: T2 }),
            record({ id: 'docs', cwd: WS + '/docs', last: T1 }),
            record({ id: 'away', cwd: OTHER + '/x', last: T3 })
        ]);
        expect(found.map((workspace) => workspace.key)).toEqual([OTHER, WS]);
        expect(found[0].lastActivity).toBe(T3);
        const hub = found[1];
        expect(hub.lastActivity).toBe(T2);
        expect(hub.areas.map((area) => area.short)).toEqual(['tools', 'docs']);
        expect(hub.areas[0].lastActivity).toBe(T2);
        expect(hub.areas[0].sessions.map((session) => session.id)).toEqual(['new', 'old']);
    });
});

describe('robustness', () => {
    it('does not modify the input records', () => {
        const original = record({ cwd: WS + '/tools' });
        arrange([original]);
        expect(Object.keys(original).sort()).toEqual([
            'cwd',
            'files',
            'id',
            'lastActivity',
            'title'
        ]);
    });

    it('raises nothing on junk', () => {
        const junk = [
            null,
            3,
            'text',
            {},
            { cwd: 7, files: 'no' },
            { cwd: WS, files: [null, {}] },
            { id: 's', cwd: WS + '/tools', lastActivity: 9, title: null }
        ] as unknown as SessionRecord[];
        const found = arrange(junk, {
            folders: [null, [], ['', 'x'], 7] as unknown as ProjectFolder[]
        });
        expect(found.some((workspace) => workspace.areas.length > 0)).toBe(true);
        expect(group(null as unknown as SessionRecord[])).toEqual([]);
        expect(
            group(
                3 as unknown as SessionRecord[],
                'nonsense' as unknown as ProjectFolder[],
                4 as unknown as string[],
                5 as unknown as string[],
                6 as unknown as string
            )
        ).toEqual([]);
    });

    it('exposes defaults that are absolute paths', () => {
        expect(defaultRoots().length).toBe(3);
        for (const path of [...defaultRoots(), defaultOverridesPath()]) {
            expect(path.startsWith('/')).toBe(true);
        }
    });
});
