// Layer 4, data test. The user: the one person the key `self` of the primary hub's
// `.oculus/local.yml` names, resolved from the primary hub, as the watcher publishes it
// (lib/server/root/watch/portfolio/portfolio.ts through lib/data/snapshot/hubs/self.ts). The
// primary's person of that key is marked, else the person of the one other hub that holds it; a key
// two or more other hubs hold, or one no hub holds, marks nobody and is one finding on that file;
// an empty key, or a workspace with no primary, marks nobody and gives no finding. The key is read
// from the primary's file alone (data/sources/config/machine.ts), and a workspace file's
// `settings:` that names it is a key that is no option.
//
// The hubs are copies of tests/fixtures/hubs/demo/ (hubs-fixture.ts), each row adding the people
// its case needs to a hub's people file and writing its `local.yml`, and the watcher reads the key
// as the server does: from the primary's file through `readMachine` at each build.

import { appendFileSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect } from 'vitest';
import { findingText } from '../../../src/lib/data/helpers/finding-text.ts';
import type { Snapshot } from '../../../src/lib/data/model/index.ts';
import { engineDir, loadConfig, textCatalog } from '../../../src/lib/data/sources/config.ts';
import { checkLocal, localFile } from '../../../src/lib/data/sources/config/local.ts';
import { readMachine } from '../../../src/lib/data/sources/config/machine.ts';
import { rebuiltBy } from '../../../src/lib/server/root/watch/local.ts';
import { selfName } from '../../../src/lib/server/sessions/stores/hooks.ts';
import { plantSaved, workspaceWith, type FolderSpec } from '../../fixtures/hubs/workspace.ts';
import { it, scratchDir } from '../../fixtures/scratch.ts';
import { copyHub, published, watchedOnce } from './hubs-fixture.ts';

const CATALOG = textCatalog(loadConfig(engineDir()).config);

/** The demo hub the copies are made from, whose people file holds none of the keys added. */
const DEMO = join(engineDir(), 'tests', 'fixtures', 'hubs', 'demo');

/** The people file of a demo copy. */
function peopleFile(dir: string): string {
    return join(dir, '.oculus', 'data', 'people', 'people.yml');
}

/**
 * Hubs named as `people` lists them, in that order, each a copy of the demo hub with a person of
 * each key added to its people file, and the `local.yml` text `local` gives a hub written.
 */
function hubsWith(
    people: Record<string, readonly string[]>,
    local: Record<string, string> = {}
): FolderSpec[] {
    const base = scratchDir('oculus-self-');
    return Object.entries(people).map(([name, keys]) => {
        const dir = copyHub(base, name);
        const entries = keys.map((key) => `\n  - key: "${key}"\n    name: "${key} of ${name}"\n`);
        appendFileSync(peopleFile(dir), entries.join(''));
        if (Object.hasOwn(local, name)) writeFileSync(localFile(dir), local[name]);
        return { name, dir };
    });
}

/** The folder of the hub named `name`. */
function dirOf(folders: readonly FolderSpec[], name: string): string {
    const found = folders.find((one) => one.name === name);
    if (found === undefined) throw new Error(`no hub is named ${name}`);
    return found.dir;
}

/** The ids of the people a snapshot marks as the user. */
function marked(snapshot: Snapshot): string[] {
    return Object.values(snapshot.entities.people)
        .filter((one) => one.self === true)
        .map((one) => one.id);
}

/**
 * The findings about the key: those on the primary's `local.yml`, and any other whose words name
 * the key, as file, key and words.
 */
function aboutSelf(snapshot: Snapshot, primary: string, key: string): string[][] {
    return snapshot.findings
        .filter((one) => one.file === localFile(primary) || one.message.includes(` ${key},`))
        .map((one) => [one.file, one.key, one.message]);
}

/** The finding a key no hub holds gives, on the primary's file at `self`. */
function unknownFinding(primary: string, key: string): string[] {
    return [
        localFile(primary),
        'self',
        findingText(CATALOG, 'findings.validate.self_unknown', key)
    ];
}

describe('the user the key self names', { tags: ['slow'] }, () => {
    it('marks the primary person of the key, and gives no finding (case 1)', () => {
        const folders = hubsWith({ hub: ['ada'], lab: [] }, { hub: 'self: ada\n' });
        const { snapshot } = published(folders, 'hub');
        expect(marked(snapshot)).toEqual(['hub:ada']);
        expect(aboutSelf(snapshot, dirOf(folders, 'hub'), 'ada')).toEqual([]);
    });

    it('marks the person of the one other hub that holds the key, and gives no finding (case 2)', () => {
        const folders = hubsWith({ hub: [], lab: ['kim'] }, { hub: 'self: kim\n' });
        const { snapshot } = published(folders, 'hub');
        expect(marked(snapshot)).toEqual(['lab:kim']);
        expect(aboutSelf(snapshot, dirOf(folders, 'hub'), 'kim')).toEqual([]);
    });

    it("names another hub's person as the portfolio chat's user (case 27)", () => {
        const folders = hubsWith({ hub: [], lab: ['kim'] }, { hub: 'self: kim\n' });
        expect(selfName(watchedOnce(workspaceWith(folders, 'hub')))).toBe('kim of lab');
    });

    it("marks the primary's person of a key another hub holds too, and not the other's (case 3)", () => {
        const folders = hubsWith({ hub: ['kim'], lab: ['kim'] }, { hub: 'self: kim\n' });
        const { snapshot } = published(folders, 'hub');
        expect(marked(snapshot)).toEqual(['hub:kim']);
        expect(aboutSelf(snapshot, dirOf(folders, 'hub'), 'kim')).toEqual([]);
    });

    it('marks nobody for a key two other hubs hold, with one finding naming them (case 4)', () => {
        const folders = hubsWith({ hub: [], lab: ['kim'], lab2: ['kim'] }, { hub: 'self: kim\n' });
        const { snapshot } = published(folders, 'hub');
        const words = findingText(CATALOG, 'findings.validate.self_ambiguous', 'kim', 'lab, lab2');
        expect(marked(snapshot)).toEqual([]);
        expect(aboutSelf(snapshot, dirOf(folders, 'hub'), 'kim')).toEqual([
            [localFile(dirOf(folders, 'hub')), 'self', words]
        ]);
    });

    it('marks nobody for a key no hub holds, with exactly one finding on the file at self (case 5)', () => {
        const folders = hubsWith({ hub: [], lab: [] }, { hub: 'self: zed\n' });
        const { snapshot } = published(folders, 'hub');
        expect(marked(snapshot)).toEqual([]);
        expect(aboutSelf(snapshot, dirOf(folders, 'hub'), 'zed')).toEqual([
            unknownFinding(dirOf(folders, 'hub'), 'zed')
        ]);
    });

    it.each([
        { row: 'an empty key', text: "self: ''\n" },
        { row: 'no key', text: 'port: 8790\n' }
    ])('marks nobody, and gives no finding, for $row (case 6)', ({ text }) => {
        const folders = hubsWith({ hub: ['ada'], lab: [] }, { hub: text });
        const { snapshot } = published(folders, 'hub');
        expect(marked(snapshot)).toEqual([]);
        expect(aboutSelf(snapshot, dirOf(folders, 'hub'), 'ada')).toEqual([]);
    });

    it("reads the key from the primary's file alone: another hub's is a problem naming the key and the hub (case 7)", () => {
        const folders = hubsWith({ hub: [], lab: ['kim'] }, { lab: 'self: kim\n' });
        const { snapshot } = published(folders, 'hub');
        expect(marked(snapshot)).toEqual([]);
        const problems = readMachine(folders, 'hub').problems.map((one) => [
            one.file,
            one.problem.key,
            one.problem.kind,
            'hub' in one.problem ? one.problem.hub : ''
        ]);
        expect(problems).toEqual([[localFile(dirOf(folders, 'lab')), 'self', 'other-hub', 'lab']]);
    });

    it("applies no self of a workspace file's settings, which is a key that is no option (case 8)", () => {
        const [hub] = hubsWith({ hub: ['ada'] });
        const saved = plantSaved(hub.dir, 'settings:\n  self: ada\n');
        const { findings } = loadConfig(engineDir(), {
            hub: hub.dir,
            workspace: { file: saved.file }
        });
        const channels = watchedOnce({
            stateFolder: saved.state,
            open: () => saved.open,
            subscribe: () => () => undefined,
            changed: () => undefined,
            close: () => undefined
        });
        expect(marked(channels.latest('portfolio')?.payload as Snapshot)).toEqual([]);
        expect(findings.map((one) => [one.file, one.message])).toContainEqual([
            saved.file,
            findingText(CATALOG, 'findings.config.settings_unknown', 'self')
        ]);
    });

    it('marks nobody, and gives no finding, in a workspace with no primary (case 9)', () => {
        const folders = hubsWith({ hub: ['ada'], lab: [] }, { hub: 'self: ada\n' });
        const { snapshot } = published(folders);
        expect(marked(snapshot)).toEqual([]);
        expect(aboutSelf(snapshot, dirOf(folders, 'hub'), 'ada')).toEqual([]);
    });

    it('moves the mark at the build a save of the key starts (case 10)', () => {
        const folders = hubsWith({ hub: ['ada', 'bob'] }, { hub: 'self: ada\n' });
        const workspace = workspaceWith(folders, 'hub');
        const first = watchedOnce(workspace).latest('portfolio')?.payload as Snapshot;
        writeFileSync(localFile(dirOf(folders, 'hub')), 'self: bob\n');
        expect(rebuiltBy(['self']).portfolio).toBe(true);
        const second = watchedOnce(workspace).latest('portfolio')?.payload as Snapshot;
        expect([marked(first), marked(second)]).toEqual([['hub:ada'], ['hub:bob']]);
    });

    it('follows a move of the primary, reading the key from the new primary (case 30)', () => {
        const folders = hubsWith(
            { hub: ['lee'], lab: ['lee'] },
            { hub: 'self: ada\n', lab: 'self: lee\n' }
        );
        expect(marked(published(folders, 'lab').snapshot)).toEqual(['lab:lee']);
    });

    it.each([
        { row: 'a number', text: 'self: 5\n' },
        { row: 'a list', text: 'self: [a]\n' }
    ])(
        'marks nobody for $row, a problem naming self that a save is refused by (case 31)',
        ({ text }) => {
            const folders = hubsWith({ hub: ['a'] }, { hub: text });
            const { snapshot } = published(folders, 'hub');
            expect(marked(snapshot)).toEqual([]);
            const keys = readMachine(folders, 'hub').problems.map((one) => one.problem.key);
            expect(keys).toEqual(['self']);
            expect(checkLocal(text)).toMatch(/^local\.yml: self /);
        }
    );

    it('marks the next single holder once a holder leaves the workspace (case 32)', () => {
        const folders = hubsWith({ hub: [], lab: ['kim'], lab2: ['kim'] }, { hub: 'self: kim\n' });
        const left = folders.filter((one) => one.name !== 'lab');
        expect(marked(published(left, 'hub').snapshot)).toEqual(['lab2:kim']);
    });

    it('gives the finding of a key no hub holds once the person leaves its people file (case 32)', () => {
        const folders = hubsWith({ hub: [], lab: ['kim'] }, { hub: 'self: kim\n' });
        expect(marked(published(folders, 'hub').snapshot)).toEqual(['lab:kim']);
        writeFileSync(peopleFile(dirOf(folders, 'lab')), readFileSync(peopleFile(DEMO), 'utf8'));
        const { snapshot } = published(folders, 'hub');
        expect(marked(snapshot)).toEqual([]);
        expect(aboutSelf(snapshot, dirOf(folders, 'hub'), 'kim')).toEqual([
            unknownFinding(dirOf(folders, 'hub'), 'kim')
        ]);
    });
});
