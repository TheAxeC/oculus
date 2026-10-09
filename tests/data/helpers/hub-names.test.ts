// Layer 1, data test. The one function that decides whether two names are one file on disk
// (data/helpers/hub-names.ts `sameDiskFile`, with `diskPath` under it), the guarded entry G28: a
// write over a file a source tab holds unsaved text of is refused, and the tab's file and the
// write's file are told apart by this function. Each row gives synthetic folders and two names.
//
// What this does NOT cover: the refusal itself, which tests/state/client/held-unsaved.test.ts runs
// through the page's write store, and the folders a real server serves.

import { describe, expect, it } from 'vitest';
import {
    diskPath,
    sameDiskFile,
    type FileName,
    type RootFolder
} from '../../../src/lib/data/helpers/hub-names.ts';

const HUB = '/work/hub';
const WORKTREE = '/work/hub/.agents/worktrees/feature';

type Row = {
    title: string;
    roots: RootFolder[];
    one: FileName;
    other: FileName;
    same: boolean;
};

const ENGINE_FILE: FileName = { root: 'engine', path: 'layout.yml' };
const HUB_COPY: FileName = { root: 'hub', path: 'tools/oculus/config/layout.yml' };

const rows: Row[] = [
    {
        title: 'is one file for the engine root served from the hub own config folder',
        roots: [
            { key: 'hub', dir: HUB, real: HUB },
            { key: 'engine', dir: `${HUB}/tools/oculus/config`, real: `${HUB}/tools/oculus/config` }
        ],
        one: ENGINE_FILE,
        other: HUB_COPY,
        same: true
    },
    {
        title: 'is two files for the engine root served from a worktree config folder',
        roots: [
            { key: 'hub', dir: HUB, real: HUB },
            {
                key: 'engine',
                dir: `${WORKTREE}/tools/oculus/config`,
                real: `${WORKTREE}/tools/oculus/config`
            }
        ],
        one: ENGINE_FILE,
        other: HUB_COPY,
        same: false
    },
    {
        title: 'is one file for a configured root inside the hub and the hub name of its folder',
        roots: [
            { key: 'hub', dir: HUB, real: HUB },
            { key: 'x', dir: `${HUB}/projects/x`, real: `${HUB}/projects/x` }
        ],
        one: { root: 'x', path: 'project.yml' },
        other: { root: 'hub', path: 'projects/x/project.yml' },
        same: true
    },
    {
        title: 'is two files when a root real folder is empty, a folder that does not exist',
        roots: [
            { key: 'hub', dir: HUB, real: HUB },
            { key: 'x', dir: `${HUB}/projects/x`, real: '' }
        ],
        one: { root: 'x', path: 'project.yml' },
        other: { root: 'hub', path: 'projects/x/project.yml' },
        same: false
    },
    {
        title: 'uses the dir of a root that carries no real folder',
        roots: [
            { key: 'hub', dir: HUB },
            { key: 'x', dir: `${HUB}/projects/x` }
        ],
        one: { root: 'x', path: 'project.yml' },
        other: { root: 'hub', path: 'projects/x/project.yml' },
        same: true
    },
    {
        title: 'compares the names of a root not among the roots by root and path',
        roots: [{ key: 'hub', dir: HUB, real: HUB }],
        one: { root: 'gone', path: 'a.yml' },
        other: { root: 'gone', path: 'a.yml' },
        same: true
    },
    {
        title: 'tells two names of a root not among the roots apart when the paths differ',
        roots: [{ key: 'hub', dir: HUB, real: HUB }],
        one: { root: 'gone', path: 'a.yml' },
        other: { root: 'gone', path: 'b.yml' },
        same: false
    },
    {
        title: 'is one file by the prefix rule while the roots are not yet read',
        roots: [],
        one: ENGINE_FILE,
        other: HUB_COPY,
        same: true
    },
    {
        title: 'tells two files of the hub apart while the roots are not yet read',
        roots: [],
        one: { root: 'hub', path: 'registries/venues.yml' },
        other: { root: 'hub', path: 'registries/people.yml' },
        same: false
    },
    {
        title: 'counts a trailing slash of a root folder once',
        roots: [
            { key: 'hub', dir: `${HUB}/`, real: `${HUB}/` },
            { key: 'x', dir: `${HUB}/projects/x`, real: `${HUB}/projects/x` }
        ],
        one: { root: 'x', path: 'project.yml' },
        other: { root: 'hub', path: 'projects/x/project.yml' },
        same: true
    }
];

describe('one disk file under two names', () => {
    it.each(rows)('$title', (row) => {
        expect(sameDiskFile(row.one, row.other, row.roots)).toBe(row.same);
        expect(sameDiskFile(row.other, row.one, row.roots)).toBe(row.same);
    });

    it('names a file by its root real folder, and null for a root with none', () => {
        const roots: RootFolder[] = [
            { key: 'hub', dir: '/dir/hub', real: '/real/hub' },
            { key: 'empty', dir: '/dir/e', real: '' }
        ];
        expect(diskPath({ root: 'hub', path: 'a/b.yml' }, roots)).toBe('/real/hub/a/b.yml');
        expect(diskPath({ root: 'hub', path: '' }, roots)).toBe('/real/hub');
        expect(diskPath({ root: 'empty', path: 'a.yml' }, roots)).toBeNull();
        expect(diskPath({ root: 'other', path: 'a.yml' }, roots)).toBeNull();
    });
});
