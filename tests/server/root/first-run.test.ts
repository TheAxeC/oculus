// Layer 2, server tests. The first-run check refuses a start for what oculus cannot run without: a
// Node outside 24.15 or later on the 24 line and 26 or later, installed packages that are not what
// package-lock.json says. A start with no workspace, an unparseable workspace state or a workspace
// that names a hub that is not there is no lack, since the server then serves an empty workspace.
// One table holds a row per input that gives a different verdict, each over a scratch directory.

import { chmodSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect } from 'vitest';
import { engineDir } from '../../../src/lib/data/places/engine-dir.ts';
import {
    installLacks,
    machineFacts,
    machineLacks,
    type Lack
} from '../../../src/lib/server/root/process/start/first-run.ts';
import { wordsOf } from '../../../src/lib/server/root/process/words.ts';
import { it, plantFile, plantScratch } from '../../fixtures/scratch.ts';

const t = wordsOf(engineDir());
const PREFIX = 'oculus-first-run-';

/** The lacks an input gives and the texts their sentences must hold together. */
type Read = { lacks: Lack[]; mentions: string[] };

/** The entries package-lock.json asks for besides the root: two required and one optional. */
const ENTRIES: Record<string, object> = {
    'node_modules/first': { version: '1.0.0' },
    'node_modules/second': { version: '2.0.0' },
    'node_modules/extra': { version: '3.0.0', optional: true }
};

/** A checkout holding that lockfile and, when given, the hidden lockfile npm writes at install. */
function checkout(installed: Record<string, object> | null): string {
    const files: Record<string, string> = {
        'package-lock.json': JSON.stringify({ packages: { '': { name: 'scratch' }, ...ENTRIES } })
    };
    if (installed !== null) {
        files['node_modules/.package-lock.json'] = JSON.stringify({ packages: installed });
    }
    return plantScratch(PREFIX, files);
}

/** The entries as installed, without those of `drop` and with those of `change` replaced. */
function installedWith(
    drop: string[],
    change: Record<string, object> = {}
): Record<string, object> {
    const kept = Object.entries(ENTRIES).filter(([path]) => !drop.includes(path));
    return { ...Object.fromEntries(kept), ...change };
}

/** What the sentence of an unsupported Node names: the supported range and the install command. */
const NODE_SAID = ['Node 24.15 or later on the 24 line, or Node 26 or later', 'nvm install 24'];

/** Stands in a row's mentions for the path of the checkout the row made. */
const CHECKOUT = '<checkout>';

/** The first part over a new checkout, with the texts its sentences must name. */
function installed(
    version: string,
    hidden: Record<string, object> | null,
    mentions: string[] = []
): Read {
    const dir = checkout(hidden);
    return {
        lacks: installLacks(dir, version),
        mentions: mentions.map((mention) => (mention === CHECKOUT ? dir : mention))
    };
}

/** The programs the second part looks for on every platform, and on Linux. */
const PROGRAMS = ['git', 'tmux', 'perl', 'claude'];
const LINUX_PROGRAMS = ['zenity', 'xdg-open', 'wslview'];

/** A scratch folder `bin` under `root` holding a runnable file for each program named. */
function binOf(root: string, programs: string[]): string {
    for (const program of programs) {
        chmodSync(plantFile(root, `bin/${program}`, '#!/bin/sh\n'), 0o755);
    }
    return join(root, 'bin');
}

/**
 * The second part over a scratch state folder holding `state` as its `workspace.json` (none when
 * null), with the programs on a PATH of their own so only the workspace could be a lack.
 */
async function startLacks(root: string, state: string | null) {
    const stateFolder = join(root, 'state');
    if (state !== null) plantFile(stateFolder, 'workspace.json', state);
    binOf(root, [...PROGRAMS, ...LINUX_PROGRAMS]);
    const env = { PATH: join(root, 'bin') };
    const lacks = machineLacks(await machineFacts(8811, env, stateFolder), t);
    return { lacks, mentions: [] };
}

type Row = {
    title: string;
    /** The lacks the input gives, and the texts their sentences must hold together. */
    run: () => Read | Promise<Read>;
    /** The kinds of the lacks, all required; none for an input that is no lack. */
    kinds: Lack['kind'][];
};

const ROWS: Row[] = [
    {
        title: 'Node 24.21.0 is no lack',
        run: () => installed('24.21.0', installedWith([])),
        kinds: []
    },
    {
        title: 'Node 22.12.0 is one lack naming Node 24 and nvm install 24',
        run: () => installed('22.12.0', installedWith([]), ['Node 24', 'nvm install 24']),
        kinds: ['node']
    },
    {
        title: 'Node 24.14.0 is one lack naming the range and nvm install 24',
        run: () => installed('24.14.0', installedWith([]), NODE_SAID),
        kinds: ['node']
    },
    {
        title: 'Node 25.0.0 is one lack naming the range and nvm install 24',
        run: () => installed('25.0.0', installedWith([]), NODE_SAID),
        kinds: ['node']
    },
    {
        title: 'Node 24.15.0 is no lack',
        run: () => installed('24.15.0', installedWith([])),
        kinds: []
    },
    {
        title: 'Node 26.0.0 is no lack',
        run: () => installed('26.0.0', installedWith([])),
        kinds: []
    },
    {
        title: 'the pre-release 26.0.0-nightly20260101abc is read by its major 26',
        run: () => installed('26.0.0-nightly20260101abc', installedWith([])),
        kinds: []
    },
    {
        title: 'no node_modules/.package-lock.json is one lack naming npm ci and the checkout',
        run: () => installed('24.21.0', null, ['npm ci', CHECKOUT]),
        kinds: ['packages']
    },
    {
        title: 'a hidden lockfile missing one required entry is one lack naming the count 1',
        run: () =>
            installed('24.21.0', installedWith(['node_modules/second']), [
                'npm ci',
                CHECKOUT,
                'version: 1)'
            ]),
        kinds: ['packages']
    },
    {
        title: 'a hidden lockfile with one entry at another version is one lack naming the count 1',
        run: () =>
            installed(
                '24.21.0',
                installedWith([], { 'node_modules/second': { version: '2.0.1' } }),
                ['npm ci', CHECKOUT, 'version: 1)']
            ),
        kinds: ['packages']
    },
    {
        title: 'a hidden lockfile lacking only the optional entries is no lack',
        run: () => installed('24.21.0', installedWith(['node_modules/extra'])),
        kinds: []
    },
    {
        title: 'no workspace state is no lack',
        run: () => startLacks(plantScratch(PREFIX, {}), null),
        kinds: []
    },
    {
        title: 'a workspace state that does not parse is no lack',
        run: () => startLacks(plantScratch(PREFIX, {}), '{ "open": '),
        kinds: []
    },
    {
        title: 'a workspace state naming a workspace file that is gone is no lack',
        run: () => {
            const root = plantScratch(PREFIX, {});
            const gone = join(root, 'hub', '.oculus', 'workspaces', 'gone.yml');
            return startLacks(root, JSON.stringify({ open: gone, recent: [gone] }));
        },
        kinds: []
    },
    {
        title: 'an unsaved workspace listing a folder that is not there is no lack',
        run: () => {
            const root = plantScratch(PREFIX, {});
            const state = { unsaved: { folders: [{ name: 'hub', path: join(root, 'nowhere') }] } };
            return startLacks(root, JSON.stringify({ open: null, recent: [], ...state }));
        },
        kinds: []
    }
];

describe('the first-run check refuses a start for a required lack', () => {
    it.each(ROWS)('$title', async ({ run, kinds }) => {
        const { lacks, mentions } = await run();
        expect(lacks.map((lack) => lack.kind)).toEqual(kinds);
        expect(lacks.every((lack) => lack.required)).toBe(true);
        const said = lacks.map((lack) => lack.sentence).join('\n');
        for (const mention of mentions) expect(said).toContain(mention);
    });
});

describe('the first-run check names the folder panel and the opener a Linux machine lacks', () => {
    /** The second part for a platform, over a PATH holding the programs named and no other. */
    function lacksOn(platform: NodeJS.Platform, programs: string[], opener?: string) {
        const env = { PATH: binOf(plantScratch(PREFIX, {}), programs) };
        const facts = { claudeBin: 'claude', platform, env, ...(opener ? { opener } : {}) };
        return machineLacks(facts, t);
    }

    it('names zenity and xdg-utils as optional lacks on Linux, and neither on macOS', () => {
        const linux = lacksOn('linux', PROGRAMS, 'xdg-open');
        expect(linux.map((lack) => [lack.kind, lack.required])).toEqual([
            ['zenity', false],
            ['opener', false]
        ]);
        const said = linux.map((lack) => lack.sentence).join('\n');
        expect(said).toContain('Install zenity');
        expect(said).toContain('Install xdg-utils');
        expect(lacksOn('darwin', PROGRAMS)).toEqual([]);
    });

    it('names wslview of wslu under WSL2, and no lack once the programs are there', () => {
        const wsl = lacksOn('linux', [...PROGRAMS, 'zenity'], 'wslview');
        expect(wsl.map((lack) => lack.kind)).toEqual(['opener']);
        expect(wsl[0].sentence).toContain('wslview was not found');
        expect(wsl[0].sentence).toContain('Install wslu');
        expect(lacksOn('linux', [...PROGRAMS, ...LINUX_PROGRAMS], 'xdg-open')).toEqual([]);
    });
});
