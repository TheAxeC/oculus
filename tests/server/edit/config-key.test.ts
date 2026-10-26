// Layer 4, server test. The config-key writer: one option set at its place (the open workspace
// file's `settings:`, or for a key of the hub list the settings file of the hub the write names,
// the primary's when it names none), the refusals that leave every file as it was, and the bytes a
// write keeps.
//
// Every case runs over a scratch engine, a copy of the checkout's config/ folder
// (tests/routes/edit/write-fixture.ts), and a scratch hub with a saved workspace file
// (tests/fixtures/hubs/workspace.ts `plantSaved`), so the writer reads the options and the text
// from the copy and writes the scratch files; every case proves oculus's defaults file is left
// byte for byte. What this does NOT cover: the route that carries the writer
// (tests/routes/edit/config-key.test.ts) and the page's call of it.
//
// A case that merges the whole config folder and takes 100 ms or more in a run of its own is
// tagged slow.

import {
    existsSync,
    mkdirSync,
    readFileSync,
    rmSync,
    statSync,
    symlinkSync,
    writeFileSync
} from 'node:fs';
import { join } from 'node:path';
import { describe, expect } from 'vitest';
import { HUB_FILE } from '../../../src/lib/data/helpers/hub-names.ts';
import { engineDir, loadConfig, textCatalog } from '../../../src/lib/data/sources/config.ts';
import { words } from '../../../src/lib/server/core/words.ts';
import type { WriteTarget } from '../../../src/lib/server/edit/writes.ts';
import {
    writeConfigKey,
    type ConfigKeyOutcome
} from '../../../src/lib/server/edit/writes/config/config-key.ts';
import { configWrite } from '../../../src/lib/server/edit/writes/config/config-write.ts';
import { plantSaved } from '../../fixtures/hubs/workspace.ts';
import { it, scratchDir } from '../../fixtures/scratch.ts';
import {
    LAB,
    LAB_SETTINGS,
    defaultsFile,
    labTarget,
    refusalOf,
    scratchEngine
} from '../../routes/edit/write-fixture.ts';
import { linkedHub } from './writes-fixture.ts';

const CATALOG = textCatalog(loadConfig(engineDir()).config);

/** One of the writer's own reason sentences, out of config/text/server.yml. */
function why(key: string, ...args: string[]): string {
    return words(CATALOG, `server.config_key.${key}`, ...args);
}

/** The `settings:` block a case starts from: a comment above `keep` and one after its value. */
const KEEP_HELD = 'settings:\n  changes:\n    # how long the log is\n    keep: 200  # how many\n';

/** What one write left behind: its answer, the files it may touch, and its records. */
type Left = {
    changed: string[];
    refused: unknown[];
    defaults: string;
    workspace: string | null;
    layer: string | null;
    records: unknown[] | undefined;
};

/** The world of one case: a scratch engine, a hub and, unless `unsaved`, a saved workspace. */
type World = { engine: string; hub: string; workspace: string | null };

function world(settings: string | null, hubSettings?: string): World {
    const engine = scratchEngine();
    const hub = scratchDir('oculus-hub-');
    const workspace = settings === null ? null : plantSaved(hub, settings).file;
    mkdirSync(join(hub, '.oculus'), { recursive: true });
    if (hubSettings === undefined) rmSync(join(hub, HUB_FILE), { force: true });
    else writeFileSync(join(hub, HUB_FILE), hubSettings);
    return { engine, hub, workspace };
}

/** A file's text, or null when it is not there. */
function textOf(path: string | null): string | null {
    return path !== null && existsSync(path) ? readFileSync(path, 'utf8') : null;
}

/**
 * The writes of one value, one row per place the value goes: the row names the workspace file's
 * `settings:` block (null for the unsaved workspace), the hub's settings file (none when left out),
 * the file, key and value written, and what the write leaves in oculus's defaults file, the
 * workspace file, the hub's settings file and the records.
 */
const ROWS: {
    row: string;
    settings: string | null;
    hubSettings?: string;
    file: string;
    key: string;
    value: unknown;
    left: (before: { defaults: string; workspace: string | null }, at: World) => Left;
}[] = [
    {
        row: 'an option the workspace file does not hold is added under a new settings map',
        settings: '',
        file: 'appearance.yml',
        key: 'code_theme',
        value: 'vscode-dark-2026',
        left: (before, at) => ({
            changed: ['appearance.yml:code_theme'],
            refused: [],
            defaults: before.defaults,
            workspace: `${before.workspace ?? ''}settings:\n  code_theme: vscode-dark-2026\n`,
            layer: null,
            records: [
                {
                    file: at.workspace,
                    key: 'appearance.yml',
                    field: 'code_theme',
                    before: 'tokens',
                    after: 'vscode-dark-2026',
                    undo: 'field',
                    replaced: {
                        offset: (before.workspace ?? '').length,
                        before: '',
                        after: 'settings:\n  code_theme: vscode-dark-2026\n'
                    },
                    created: []
                }
            ]
        })
    },
    {
        row: 'an option the workspace file holds is replaced over its own bytes, its comments kept',
        settings: KEEP_HELD,
        file: 'behavior.yml',
        key: 'changes.keep',
        value: 300,
        left: (before, at) => ({
            changed: ['behavior.yml:changes.keep'],
            refused: [],
            defaults: before.defaults,
            workspace: (before.workspace ?? '').replace(
                'keep: 200  # how many',
                'keep: 300  # how many'
            ),
            layer: null,
            records: [
                {
                    file: at.workspace,
                    key: 'behavior.yml',
                    field: 'changes.keep',
                    before: 200,
                    after: 300,
                    undo: 'field'
                }
            ]
        })
    },
    {
        row: 'a key of the hub list lands in the hub settings file, which is made',
        settings: '',
        file: 'appearance.yml',
        key: 'wallpaper.image',
        value: 'x.png',
        left: (before, at) => ({
            changed: ['appearance.yml:wallpaper.image'],
            refused: [],
            defaults: before.defaults,
            workspace: before.workspace,
            layer: 'wallpaper: { image: x.png }\n',
            records: [
                {
                    file: join(at.hub, HUB_FILE),
                    key: 'appearance.yml',
                    field: 'wallpaper.image',
                    before: '',
                    after: 'x.png',
                    undo: 'field',
                    replaced: { offset: 0, before: '', after: 'wallpaper: { image: x.png }\n' },
                    created: [join(at.hub, HUB_FILE)]
                }
            ]
        })
    },
    {
        row: 'a key of the hub list, with a settings file that holds other keys and comments',
        settings: '',
        hubSettings: '# the cluster of this hub\nslurm:\n  resource: utwente  # the ssh alias\n',
        file: 'behavior.yml',
        key: 'slurm.resource',
        value: 'other',
        left: (before, at) => ({
            changed: ['behavior.yml:slurm.resource'],
            refused: [],
            defaults: before.defaults,
            workspace: before.workspace,
            layer: '# the cluster of this hub\nslurm:\n  resource: other  # the ssh alias\n',
            records: [
                {
                    file: join(at.hub, HUB_FILE),
                    key: 'behavior.yml',
                    field: 'slurm.resource',
                    before: 'utwente',
                    after: 'other',
                    undo: 'field'
                }
            ]
        })
    },
    {
        row: 'a key of the hub list lands in the hub settings file with the unsaved workspace',
        settings: null,
        hubSettings: '{}\n',
        file: 'behavior.yml',
        key: 'slurm.resource',
        value: 'other',
        left: (before, at) => ({
            changed: ['behavior.yml:slurm.resource'],
            refused: [],
            defaults: before.defaults,
            workspace: null,
            layer: 'slurm: { resource: other }\n',
            records: [
                {
                    file: join(at.hub, HUB_FILE),
                    key: 'behavior.yml',
                    field: 'slurm.resource',
                    before: '',
                    after: 'other',
                    undo: 'field',
                    replaced: { offset: 0, before: '{', after: 'slurm: { resource: other ' },
                    created: []
                }
            ]
        })
    },
    {
        row: 'any other option with the unsaved workspace is refused, and no file changes',
        settings: null,
        hubSettings: '{}\n',
        file: 'appearance.yml',
        key: 'code_theme',
        value: 'vscode-dark-2026',
        left: (before) => ({
            changed: [],
            refused: [
                {
                    field: 'appearance.yml:code_theme',
                    reason: words(CATALOG, 'server.config_key.no_workspace')
                }
            ],
            defaults: before.defaults,
            workspace: null,
            layer: '{}\n',
            records: undefined
        })
    }
];

describe('one value written at its place', { tags: ['slow'] }, () => {
    it.each(ROWS)(
        "writes the option where it belongs and leaves oculus's defaults file as it was: $row",
        ({ settings, hubSettings, file, key, value, left }) => {
            const at = world(settings, hubSettings);
            const before = {
                defaults: readFileSync(defaultsFile(at.engine, file), 'utf8'),
                workspace: textOf(at.workspace)
            };
            const layers = {
                hub: at.hub,
                ...(at.workspace === null ? {} : { workspace: at.workspace })
            };
            const outcome = writeConfigKey(at.engine, file, key, value, layers);
            expect({
                changed: outcome.changed,
                refused: outcome.refused,
                defaults: readFileSync(defaultsFile(at.engine, file), 'utf8'),
                workspace: textOf(at.workspace),
                layer: textOf(join(at.hub, HUB_FILE)),
                records: outcome.records
            }).toEqual(left(before, at));
        }
    );

    it('refuses a key of the hub list with no primary hub, and writes nothing', () => {
        const at = world('');
        const before = textOf(at.workspace);
        const outcome = writeConfigKey(at.engine, 'behavior.yml', 'slurm.resource', 'other', {
            ...(at.workspace === null ? {} : { workspace: at.workspace })
        });
        expect(refusalOf(outcome, 'behavior.yml:slurm.resource')).toBe(
            words(CATALOG, 'server.workspace.no_primary')
        );
        expect(textOf(at.workspace)).toBe(before);
    });

    it('adds a copy of the value in force for Edit in a file, though the value is unchanged', () => {
        const at = world('');
        const workspace = at.workspace ?? '';
        const before = readFileSync(workspace, 'utf8');
        const plain = writeConfigKey(at.engine, 'behavior.yml', 'changes.keep', 500, {
            workspace
        });
        expect(plain).toEqual({ changed: [], refused: [] });
        const copied = writeConfigKey(
            at.engine,
            'behavior.yml',
            'changes.keep',
            500,
            { workspace },
            undefined,
            [],
            true
        );
        expect(copied.changed).toEqual(['behavior.yml:changes.keep']);
        expect(readFileSync(workspace, 'utf8')).toBe(
            `${before}settings:\n  changes: { keep: 500 }\n`
        );
    });
});

/** One config-key write as the page sends it, through the dispatch of the write route. */
function sent(into: WriteTarget, body: Record<string, unknown>): ConfigKeyOutcome {
    const answer = configWrite({ kind: 'config-key', ...body }, into);
    if (answer === null || !('outcome' in answer)) throw new Error('the write was not answered');
    return answer.outcome;
}

/** The settings file of a hub folder. */
const settingsOf = (dir: string): string => join(dir, HUB_FILE);

/**
 * The writes that name a hub, one row per outcome: the target (`labTarget`, with or without a
 * primary, and with what `lab`'s settings file holds), the body sent, and what the primary's and
 * lab's settings files hold after, with the refusal or the file the record names.
 */
const NAMED: {
    row: string;
    primary?: false;
    labFile?: string | null;
    body: Record<string, unknown>;
    refused?: (lab: string) => string;
    hub: string;
    lab: (before: string) => string | null;
    records?: 'hub' | 'lab';
}[] = [
    {
        row: "a folder of lab written into lab's settings file, the primary's left",
        body: { file: 'sources.yml', key: 'memories_dir', value: 'pictures', root: LAB },
        hub: '{}\n',
        lab: (before) => `${before}memories_dir: pictures\n`,
        records: 'lab'
    },
    {
        row: 'a hub no workspace folder carries, refused',
        body: { file: 'sources.yml', key: 'memories_dir', value: 'pictures', root: 'nowhere' },
        refused: () => words(CATALOG, 'server.workspace.no_hub_named', 'nowhere'),
        hub: '{}\n',
        lab: (before) => before
    },
    {
        row: 'an empty hub name, refused',
        body: { file: 'sources.yml', key: 'memories_dir', value: 'pictures', root: '' },
        refused: () => words(CATALOG, 'server.workspace.no_hub_named', ''),
        hub: '{}\n',
        lab: (before) => before
    },
    {
        row: 'a hub name that is a path, refused',
        body: { file: 'sources.yml', key: 'memories_dir', value: 'pictures', root: '../x' },
        refused: () => words(CATALOG, 'server.workspace.no_hub_named', '../x'),
        hub: '{}\n',
        lab: (before) => before
    },
    {
        row: 'a key read from the primary alone, refused for lab',
        body: { file: 'behavior.yml', key: 'slurm.resource', value: 'other', root: LAB },
        refused: () => words(CATALOG, 'server.workspace.primary_only', 'slurm.resource', LAB),
        hub: '{}\n',
        lab: (before) => before
    },
    {
        row: 'lab whose settings file is gone, refused, and no file is made',
        labFile: null,
        body: { file: 'sources.yml', key: 'memories_dir', value: 'pictures', root: LAB },
        refused: () => words(CATALOG, 'server.workspace.no_hub_named', LAB),
        hub: '{}\n',
        lab: () => null
    },
    {
        row: 'lab whose settings file does not parse, refused',
        labFile: 'stages: [\n',
        body: { file: 'sources.yml', key: 'memories_dir', value: 'pictures', root: LAB },
        refused: () => words(CATALOG, 'server.config_key.not_parsed'),
        hub: '{}\n',
        lab: (before) => before
    },
    {
        row: 'a folder of lab in a workspace with no primary, written into lab',
        primary: false,
        body: { file: 'sources.yml', key: 'memories_dir', value: 'pictures', root: LAB },
        hub: '{}\n',
        lab: (before) => `${before}memories_dir: pictures\n`,
        records: 'lab'
    },
    {
        row: 'a key read from the primary alone, with no primary and lab named, refused',
        primary: false,
        body: { file: 'behavior.yml', key: 'slurm.resource', value: 'other', root: LAB },
        refused: () => words(CATALOG, 'server.workspace.primary_only', 'slurm.resource', LAB),
        hub: '{}\n',
        lab: (before) => before
    },
    {
        row: 'a key read from the primary alone, with no primary and no hub named, refused',
        primary: false,
        body: { file: 'behavior.yml', key: 'slurm.resource', value: 'other' },
        refused: () => words(CATALOG, 'server.workspace.no_primary'),
        hub: '{}\n',
        lab: (before) => before
    },
    {
        row: "Edit in a file with lab named: lab's value in force copied into lab's file",
        body: {
            file: 'sources.yml',
            key: 'memories_dir',
            value: '.oculus/memories',
            root: LAB,
            copy: true
        },
        hub: '{}\n',
        lab: (before) => `${before}memories_dir: .oculus/memories\n`,
        records: 'lab'
    }
];

describe('a write that names a hub', { tags: ['slow'] }, () => {
    it.each(NAMED)('$row', ({ primary, labFile, body, refused, hub, lab, records }) => {
        const made = labTarget(labFile ?? LAB_SETTINGS, primary !== false);
        mkdirSync(join(made.lab, '.oculus', 'memories'), { recursive: true });
        if (labFile === null) rmSync(settingsOf(made.lab));
        const before = textOf(settingsOf(made.lab)) ?? '';
        const outcome = sent(made.into, body);
        const field = `${String(body.file)}:${String(body.key)}`;
        if (refused === undefined) {
            expect([outcome.refused, outcome.changed]).toEqual([[], [field]]);
            const file = settingsOf(records === 'lab' ? made.lab : made.hub);
            expect(outcome.records?.map((one) => one.file)).toEqual([file]);
        } else {
            expect(refusalOf(outcome, field)).toBe(refused(made.lab));
        }
        expect(textOf(settingsOf(made.hub))).toBe(hub);
        expect(textOf(settingsOf(made.lab))).toBe(lab(before));
        expect(existsSync(join(made.hub, '..', 'x'))).toBe(false);
    });

    it('writes the primary alike for a body naming it and a body naming no hub', () => {
        const named = labTarget();
        const plain = labTarget();
        for (const made of [named, plain]) mkdirSync(join(made.hub, 'pics'));
        const body = { file: 'sources.yml', key: 'wallpaper_dir', value: 'pics' };
        const one = sent(named.into, { ...body, root: 'hub' });
        const two = sent(plain.into, body);
        expect([one.changed, two.changed]).toEqual([
            [`sources.yml:wallpaper_dir`],
            [`sources.yml:wallpaper_dir`]
        ]);
        expect(one.records?.[0]?.file).toBe(settingsOf(named.hub));
        expect(textOf(settingsOf(named.hub))).toBe(textOf(settingsOf(plain.hub)));
        expect(textOf(settingsOf(named.lab))).toBe(LAB_SETTINGS);
    });

    it("refuses lab's settings file that is a link to a hub's .oculus/local.yml, and writes nothing", () => {
        const made = labTarget();
        const local = join(made.lab, '.oculus', 'local.yml');
        writeFileSync(local, 'port: 8791\n');
        rmSync(settingsOf(made.lab));
        symlinkSync('local.yml', settingsOf(made.lab));
        const body = { file: 'sources.yml', key: 'memories_dir', value: 'pictures', root: LAB };
        expect(refusalOf(sent(made.into, body), 'sources.yml:memories_dir')).toBe(why('local'));
        expect(readFileSync(local, 'utf8')).toBe('port: 8791\n');
    });
});

describe("the machine's own file", { tags: ['slow'] }, () => {
    it('refuses the file name local.yml without reading or writing any file', () => {
        const at = world('', '{}\n');
        const local = join(at.hub, '.oculus', 'local.yml');
        writeFileSync(local, 'port: 8791\n');
        const stamp = statSync(local).mtimeMs;
        const before = textOf(at.workspace);
        const outcome = writeConfigKey(at.engine, 'local.yml', 'port', 8792, {
            hub: at.hub,
            ...(at.workspace === null ? {} : { workspace: at.workspace })
        });
        expect(refusalOf(outcome, 'local.yml:port')).toBe(why('local'));
        expect(readFileSync(local, 'utf8')).toBe('port: 8791\n');
        expect(statSync(local).mtimeMs).toBe(stamp);
        expect(textOf(at.workspace)).toBe(before);
    });

    it("refuses a hub settings file that is a link to a hub's .oculus/local.yml, and writes nothing", () => {
        const engine = scratchEngine();
        const { hub, local } = linkedHub();
        const outcome = writeConfigKey(
            engine,
            'behavior.yml',
            'slurm.resource',
            'other',
            { hub },
            undefined,
            [hub]
        );
        expect(refusalOf(outcome, 'behavior.yml:slurm.resource')).toBe(why('local'));
        expect(readFileSync(local, 'utf8')).toBe('port: 8791\n');
    });

    it("refuses a workspace file that is a link to a hub's .oculus/local.yml, and writes nothing", () => {
        const engine = scratchEngine();
        const { hub, local } = linkedHub();
        const workspace = join(hub, '.oculus', 'linked.yml');
        symlinkSync('local.yml', workspace);
        const outcome = writeConfigKey(
            engine,
            'appearance.yml',
            'code_theme',
            'nord',
            { workspace },
            undefined,
            [hub]
        );
        expect(refusalOf(outcome, 'appearance.yml:code_theme')).toBe(why('local'));
        expect(readFileSync(local, 'utf8')).toBe('port: 8791\n');
    });
});
