// Layer 3, view test. What the command bar says of a command (views/shared/sessions/commands.ts):
// the words of where it was read from, its tooltip, the items of its menu by source, the overflow
// menu and its Manage submenu, the reading of a pick, and the lines of a repository's findings.
//
// The catalog is the real config. What this does NOT cover: the menus' opening and a pick's
// effect, which need a DOM and are seen on screen.

import { beforeAll, describe, expect, it } from 'vitest';
import {
    DELETE,
    EDIT,
    OPEN,
    RUN,
    commandKey,
    commandLabel,
    commandMenu,
    commandTip,
    findingLines,
    keyOf,
    overflowMenu,
    pickOf
} from '../../../../src/lib/views/shared/sessions/commands.ts';
import type { ProjectCommand } from '../../../../src/lib/state/sessions/terminal/commands.svelte.ts';
import { engineDir, loadConfig, textCatalog } from '../../../../src/lib/data/sources/config.ts';
import { setCatalog } from '../../../../src/lib/state/shared/words/text.ts';

const catalog = textCatalog(loadConfig(engineDir()).config);

beforeAll(() => setCatalog(catalog));

const REPO = '/work/repo';

function command(name: string, over: Partial<ProjectCommand> = {}): ProjectCommand {
    return { name, run: `make ${name}`, cwd: REPO, depends_on: [], source: 'file', ...over };
}

const filed = command('build', { entry: { file: `${REPO}/.oculus/commands.yml`, line: 4 } });
const saved = command('deploy', { source: 'saved' });
const found = command('npm: dev', {
    source: 'found',
    entry: { file: `${REPO}/package.json`, line: 7 }
});
const loose = command('make: all', { source: 'found' });

describe('the words of a command', () => {
    it('audits that the place a command was read from is named in one word each', () => {
        expect(commandTip(filed)).toContain(catalog['commands.source_file']);
        expect(commandTip(saved)).toContain(catalog['commands.source_saved']);
        expect(commandTip(found)).toContain(catalog['commands.source_found']);
    });

    it('audits that the tooltip of a command holds its line and its place', () => {
        const tip = commandTip(filed);
        expect(tip).toContain('make build');
        expect(tip).toContain(catalog['commands.source_file']);
    });
});

describe('the menu of a command', () => {
    it('audits that the menu of a saved command is Edit and Delete, and no Open File', () => {
        expect(commandMenu(REPO, saved).map((item) => item.id)).toEqual([EDIT, DELETE]);
    });

    it('audits that the menu of a file command and of a found one is Open File at the entry', () => {
        expect(commandMenu(REPO, filed).map((item) => item.id)).toEqual([OPEN]);
        expect(commandMenu(REPO, found).map((item) => item.id)).toEqual([OPEN]);
    });

    it('audits that the menu of a found command with no entry file is empty', () => {
        expect(commandMenu(REPO, loose)).toEqual([]);
    });

    it('audits that the menu of a command whose entry file is outside the repository is empty', () => {
        const outside = command('x', { entry: { file: '/elsewhere/package.json', line: 1 } });
        expect(commandMenu(REPO, outside)).toEqual([]);
    });
});

describe('the key and the label of a command', () => {
    const twin = command('build', { source: 'saved' });

    it('audits that a command is keyed by its source and its name, and the key reads back', () => {
        expect(commandKey(filed)).toBe('file:build');
        expect(commandKey(twin)).toBe('saved:build');
        expect(keyOf('found:npm: dev')).toEqual({ source: 'found', name: 'npm: dev' });
        expect(keyOf('build')).toBeNull();
        expect(keyOf('other:build')).toBeNull();
    });

    it('audits that a name only one command holds is its label alone', () => {
        expect(commandLabel(filed, [filed, saved])).toBe('build');
    });

    it('audits that a name two commands hold is labelled with the source of each', () => {
        const both = [filed, twin];
        expect(commandLabel(filed, both)).toBe(
            catalog['commands.named']
                .replace('{0}', 'build')
                .replace('{1}', catalog['commands.word_file'])
        );
        expect(commandLabel(twin, both)).toContain(catalog['commands.word_saved']);
        expect(commandLabel(filed, both)).not.toBe(commandLabel(twin, both));
    });
});

describe('the overflow menu', () => {
    it('audits that each command beyond the bar runs by a pick that carries its source and name', () => {
        const items = overflowMenu(REPO, [filed, saved], [filed, saved]);
        expect(items.slice(0, 2).map((item) => item.id)).toEqual([
            `${RUN}:file:build`,
            `${RUN}:saved:deploy`
        ]);
        expect(items.slice(0, 2).map((item) => item.label)).toEqual(['build', 'deploy']);
    });

    it('audits that a name held by two sources is two items with distinct ids and labels', () => {
        const twin = command('build', { source: 'saved' });
        const items = overflowMenu(REPO, [filed, twin], [filed, twin]);
        const runs = items.filter((item) => item.id.startsWith(`${RUN}:`));
        expect(new Set(runs.map((item) => item.id)).size).toBe(2);
        expect(new Set(runs.map((item) => item.label)).size).toBe(2);
    });

    it('audits that a command beyond the bar is labelled with its source when a command on the bar has its name', () => {
        const twin = command('build', { source: 'saved' });
        const items = overflowMenu(REPO, [twin], [filed, twin]);
        expect(items[0].label).toContain(catalog['commands.word_saved']);
    });

    it('audits that Manage lists the menu of each command and leaves out a command with no item', () => {
        const items = overflowMenu(REPO, [filed, saved, loose], [filed, saved, loose]);
        const manage = items.find((item) => item.id === 'manage');
        expect(manage?.label).toBe(catalog['commands.manage']);
        expect(manage?.items?.map((item) => item.label)).toEqual(['build', 'deploy']);
        expect(manage?.items?.[1].items?.map((item) => item.id)).toEqual([
            `${EDIT}:saved:deploy`,
            `${DELETE}:saved:deploy`
        ]);
    });

    it('audits that no Manage submenu is drawn when no command has an item', () => {
        expect(overflowMenu(REPO, [loose], [loose]).map((item) => item.id)).toEqual([
            `${RUN}:found:make: all`
        ]);
    });
});

describe('the reading of a pick', () => {
    it('audits that a pick splits the action, the source and the name, whatever the name holds', () => {
        expect(pickOf('run:file:build')).toEqual({ action: 'run', source: 'file', name: 'build' });
        expect(pickOf('edit:found:npm: dev')).toEqual({
            action: 'edit',
            source: 'found',
            name: 'npm: dev'
        });
    });

    it('audits that the heading of a submenu, and a pick with no source, are read as no pick', () => {
        expect(pickOf('manage')).toBeNull();
        expect(pickOf('run:build')).toBeNull();
    });
});

describe('the lines of the findings', () => {
    it('audits that a finding is written as the last part of its file, then the field and the message, one a line', () => {
        const lines = findingLines([
            { file: `${REPO}/.oculus/commands.yml`, field: 'commands[1].run', message: 'is wrong' },
            { file: `${REPO}/package.json`, field: 'scripts', message: 'is not a map' }
        ]);
        expect(lines).toBe(
            'commands.yml commands[1].run is wrong\npackage.json scripts is not a map'
        );
    });

    it('audits that no findings are written as nothing', () => {
        expect(findingLines([])).toBe('');
    });
});
