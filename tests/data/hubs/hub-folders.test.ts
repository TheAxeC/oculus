// Layer 4, data test. What the folders of a workspace file are read as (lib/server/files/workspace/
// folders.ts, through openWorkspace): the entries that are served, the findings that name the
// entries that are not, what makes a folder a hub, and a primary that names no hub. A file that
// does not parse serves no folder. Every folder and the workspace file are made under the system
// temporary directory by scratchDir, and the state names the file as the open workspace.

import { mkdirSync, symlinkSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect } from 'vitest';
import { repositoryDepths } from '../../../src/lib/server/files/roots.ts';
import { openWorkspace } from '../../../src/lib/server/files/workspace/open.ts';
import { writeState } from '../../../src/lib/server/files/workspace/state.ts';
import { it, scratchDir } from '../../fixtures/scratch.ts';

/** The folders a row is made over, all under one scratch directory. */
type At = {
    /** The hub the workspace file lies in. */
    hub: string;
    /** A second hub. */
    lab: string;
    /** A folder holding `.oculus/project.yml` and no `.oculus/config/`. */
    cathedra: string;
    /** A plain folder. */
    notes: string;
    /** A symbolic link to `notes`. */
    link: string;
    /** A project folder inside the hub, holding `.oculus/project.yml`. */
    inside: string;
    /** A project folder inside the hub, holding a top `project.yml`. */
    insideTop: string;
    /** A folder holding a top `project.yml` and no `.oculus/config/`. */
    topAway: string;
};

/** A folder made here. */
function folder(...parts: string[]): string {
    const full = join(...parts);
    mkdirSync(full, { recursive: true });
    return full;
}

/** A scratch directory holding the folders of `At`. */
function world(): At {
    const base = scratchDir('oculus-hub-folders-');
    const hub = join(base, 'hub');
    folder(hub, '.oculus', 'config');
    const lab = join(base, 'lab');
    folder(lab, '.oculus', 'config');
    const cathedra = join(base, 'cathedra');
    writeFileSync(
        join(folder(cathedra, '.oculus'), 'project.yml'),
        'tier: projects\ntype: active\n'
    );
    const notes = folder(base, 'notes');
    const link = join(base, 'link');
    symlinkSync(notes, link);
    const inside = folder(hub, 'projects', 'x', '.oculus');
    writeFileSync(join(inside, 'project.yml'), 'tier: projects\ntype: active\n');
    const insideTop = folder(hub, 'projects', 'y');
    writeFileSync(join(insideTop, 'project.yml'), 'tier: projects\ntype: active\n');
    const topAway = folder(base, 'top-away');
    writeFileSync(join(topAway, 'project.yml'), 'tier: personal\ntype: active\n');
    return {
        hub,
        lab,
        cathedra,
        notes,
        link,
        inside: join(hub, 'projects', 'x'),
        insideTop,
        topAway
    };
}

/** The workspace a file with this text is, as the state names it, and the file. */
function opened(at: At, text: string) {
    const state = scratchDir('oculus-hub-folders-state-');
    const file = join(folder(at.hub, '.oculus', 'workspaces'), 'work.yml');
    writeFileSync(file, text);
    writeState(state, { open: file, recent: [], unsaved: { folders: [] } });
    return { open: openWorkspace(state), file };
}

type Row = {
    name: string;
    text: (at: At) => string;
    /** The names of the folders served, in order. */
    served: string[];
    /** The findings: the entry each names and the id of its sentence. */
    findings: [string, string][];
    primary?: string | null;
};

const entry = (name: string, path: string): string => `  - { name: ${name}, path: ${path} }`;

const ROWS: Row[] = [
    {
        name: 'a folder with no name as a finding on its place in the list, the others served',
        text: (at) => `folders:\n  - { path: ${at.notes} }\n${entry('hub', at.hub)}\n`,
        served: ['hub'],
        findings: [['folders[0]', 'findings.workspace.no_name']]
    },
    {
        name: 'a folder with no path as a finding naming it, the others served',
        text: (at) => `folders:\n  - { name: gap }\n${entry('hub', at.hub)}\n`,
        served: ['hub'],
        findings: [['gap', 'findings.workspace.no_path']]
    },
    {
        name: 'a repeated name as a finding, the later folder left out',
        text: (at) => `folders:\n${entry('same', at.hub)}\n${entry('same', at.notes)}\n`,
        served: ['same'],
        findings: [['same', 'findings.workspace.repeated_name']]
    },
    {
        name: 'a name with a colon or a slash as a finding, the folder left out',
        text: (at) =>
            `folders:\n  - { name: "a:b", path: ${at.notes} }\n  - { name: "a/b", path: ${at.cathedra} }\n${entry('hub', at.hub)}\n`,
        served: ['hub'],
        findings: [
            ['a:b', 'findings.workspace.bad_name'],
            ['a/b', 'findings.workspace.bad_name']
        ]
    },
    {
        name: 'a path that is neither under the home folder nor absolute as a finding, the folder left out',
        text: (at) => `folders:\n${entry('rel', 'relative/path')}\n${entry('hub', at.hub)}\n`,
        served: ['hub'],
        findings: [['rel', 'findings.workspace.relative']]
    },
    {
        name: 'two entries over one real path as a finding on the later, which is left out, a link included',
        text: (at) =>
            `folders:\n${entry('notes', at.notes)}\n${entry('again', at.notes)}\n${entry('linked', at.link)}\n`,
        served: ['notes'],
        findings: [
            ['again', 'findings.workspace.same_dir'],
            ['linked', 'findings.workspace.same_dir']
        ]
    },
    {
        name: 'a primary that names no folder as a finding and no primary, the folders served',
        text: (at) => `folders:\n${entry('hub', at.hub)}\nprimary: nowhere\n`,
        served: ['hub'],
        findings: [['primary', 'findings.workspace.primary_unknown']],
        primary: null
    },
    {
        name: 'a primary that names a folder with no .oculus/config as a finding and no primary',
        text: (at) =>
            `folders:\n${entry('hub', at.hub)}\n${entry('notes', at.notes)}\nprimary: notes\n`,
        served: ['hub', 'notes'],
        findings: [['primary', 'findings.workspace.primary_not_hub']],
        primary: null
    },
    {
        name: 'a primary that names a hub folder as the primary, with no finding',
        text: (at) => `folders:\n${entry('hub', at.hub)}\n${entry('lab', at.lab)}\nprimary: lab\n`,
        served: ['hub', 'lab'],
        findings: [],
        primary: 'lab'
    },
    {
        name: 'a key a workspace file does not take as a finding on the key, the folders served',
        text: (at) => `folders:\n${entry('hub', at.hub)}\nsince: 2026\n`,
        served: ['hub'],
        findings: [['since', 'findings.workspace.unknown_key']]
    },
    {
        name: 'a folder that is not on this machine as a finding, still listed',
        text: (at) =>
            `folders:\n${entry('gone', join(at.notes, 'nowhere'))}\n${entry('hub', at.hub)}\n`,
        served: ['gone', 'hub'],
        findings: [['gone', 'findings.workspace.missing_dir']]
    },
    {
        name: 'a folder with a project manifest beside a hub as a project, with no finding',
        text: (at) => `folders:\n${entry('hub', at.hub)}\n${entry('cathedra', at.cathedra)}\n`,
        served: ['hub', 'cathedra'],
        findings: []
    },
    {
        name: 'a folder with a project manifest that lies inside a hub as no project, with a finding',
        text: (at) => `folders:\n${entry('hub', at.hub)}\n${entry('inner', at.inside)}\n`,
        served: ['hub', 'inner'],
        findings: [['inner', 'findings.workspace.project_in_hub']]
    },
    {
        name: 'a folder with a top project.yml beside a hub as a project, with no finding',
        text: (at) => `folders:\n${entry('hub', at.hub)}\n${entry('top', at.topAway)}\n`,
        served: ['hub', 'top'],
        findings: []
    },
    {
        name: 'a folder with a top project.yml that lies inside a hub as no project, with a finding',
        text: (at) => `folders:\n${entry('hub', at.hub)}\n${entry('inner', at.insideTop)}\n`,
        served: ['hub', 'inner'],
        findings: [['inner', 'findings.workspace.project_in_hub']]
    }
];

describe('the folders of a workspace file', () => {
    it.each(ROWS)('reads $name', (row) => {
        const at = world();
        const { open } = opened(at, row.text(at));
        expect(open.folders.map((one) => one.name)).toEqual(row.served);
        expect(open.findings.map((one) => [one.key, one.id])).toEqual(row.findings);
        expect(open.primary).toBe(row.primary === undefined ? null : row.primary);
    });

    it('marks a folder that holds .oculus/config as a hub and no other', () => {
        const at = world();
        const { open } = opened(
            at,
            `folders:\n${entry('hub', at.hub)}\n${entry('cathedra', at.cathedra)}\n${entry('notes', at.notes)}\nprimary: hub\n`
        );
        expect(open.folders.map((one) => [one.name, one.hub])).toEqual([
            ['hub', true],
            ['cathedra', false],
            ['notes', false]
        ]);
        expect(open.roots.map((one) => [one.key, one.hub === true])).toEqual([
            ['hub', true],
            ['cathedra', false],
            ['notes', false]
        ]);
        expect(open.hubs.map((one) => one.name)).toEqual(['hub']);
        expect(open.primaryDir).toBe(at.hub);
    });

    it.each([
        ['-1', -1],
        ['0', 0],
        ['2', 2]
    ])('reads a repository_scan_depth of %s on the entry', (written, depth) => {
        const at = world();
        const { open } = opened(
            at,
            `folders:\n  - { name: notes, path: ${at.notes}, repository_scan_depth: ${written} }\n`
        );
        expect(open.findings).toEqual([]);
        expect(open.folders.map((one) => one.scanDepth)).toEqual([depth]);
        expect(open.roots.map((one) => one.scanDepth)).toEqual([depth]);
        expect(repositoryDepths(open)).toEqual(new Map([[at.notes, depth]]));
    });

    it.each(['abc', '-2', '2.5', 'true', '[1]'])(
        'gives a finding naming the entry for a repository_scan_depth of %s and leaves the folder with none',
        (written) => {
            const at = world();
            const { open } = opened(
                at,
                `folders:\n  - { name: notes, path: ${at.notes}, repository_scan_depth: ${written} }\n`
            );
            expect(open.findings.map((one) => [one.key, one.id])).toEqual([
                ['notes', 'findings.workspace.bad_scan_depth']
            ]);
            expect(open.folders.map((one) => [one.name, one.scanDepth])).toEqual([
                ['notes', undefined]
            ]);
            expect(open.roots.map((one) => one.scanDepth)).toEqual([undefined]);
            expect(repositoryDepths(open)).toEqual(new Map());
        }
    );

    it('serves no folder and gives a finding naming the file when the file does not parse', () => {
        const at = world();
        const { open, file } = opened(at, 'folders: [unclosed\n  - {\n');
        expect(open.folders).toEqual([]);
        expect(open.primary).toBeNull();
        expect(open.unreadable).toBe(file);
        expect(open.findings.map((one) => [one.file, one.id])).toEqual([
            [file, 'findings.workspace.file_unparsed']
        ]);
    });
});
