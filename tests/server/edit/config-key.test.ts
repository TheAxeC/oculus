// Layer 4, server test. The config-key writer: one option set at its place (the open workspace
// file's `settings:`, or the primary hub's settings file for a key of the hub list), the refusals
// that leave every file as it was, and the bytes a write keeps.
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
import { writeConfigKey } from '../../../src/lib/server/edit/writes/config/config-key.ts';
import { plantSaved } from '../../fixtures/hubs/workspace.ts';
import { it, scratchDir } from '../../fixtures/scratch.ts';
import { defaultsFile, refusalOf, scratchEngine } from '../../routes/edit/write-fixture.ts';
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
