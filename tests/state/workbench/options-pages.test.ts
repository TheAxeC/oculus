// Layer 2, client-state tests. The options the page's controls set, over two pages of one server:
// the text size row of Settings, the theme list and the status bar's Hide each write their option
// into the open workspace file's `settings:`, and the second page, which wrote nothing, shows the
// new value once the config push that follows the write is installed. Before the push the page
// that wrote shows the value it wrote and the other page the old one.
//
// The server stand-in is a scratch engine (a copy of config/) and a scratch hub with a saved
// workspace file: a write goes through the server's own writers, and the push is the merged config
// read over the written files (`loadLayers`), installed in every page by the socket's
// `installConfig`, as a `config` message is. Each page is a client over the page state stand-in
// (tests/fixtures/state-server.ts) with the ui store over its page state and the stand-in's writes.
// What this does NOT cover: the route between a page and the writers
// (tests/routes/edit/config-key.test.ts) and the watcher that sends the push.
//
// Each case merges the whole config folder several times and takes over 100 ms, so the cases are
// tagged slow.

import { readFileSync } from 'node:fs';
import { describe, expect } from 'vitest';
import { parse } from 'yaml';
import { textCatalog } from '../../../src/lib/data/sources/config.ts';
import { catalogOf } from '../../../src/lib/data/sources/config/catalog/options.ts';
import { writeConfigKey } from '../../../src/lib/server/edit/writes/config/config-key.ts';
import {
    loadLayers,
    type ConfigKeyOutcome,
    type ConfigLayers
} from '../../../src/lib/server/edit/writes/config/config-place.ts';
import { writeConfigValue } from '../../../src/lib/server/edit/writes/config/config-value.ts';
import type { ClientState } from '../../../src/lib/state/client/context.ts';
import type { WriteAnswer } from '../../../src/lib/state/shared/stores/shapes.ts';
import type { Lists } from '../../../src/lib/state/system/config/editors/sources.ts';
import { fileRows } from '../../../src/lib/state/system/config/rows.ts';
import { createRowWriter } from '../../../src/lib/state/system/config/write.ts';
import { createUi, type UiStore } from '../../../src/lib/state/workbench/ui.svelte.ts';
import { plantSaved } from '../../fixtures/hubs/workspace.ts';
import { it, scratchDir } from '../../fixtures/scratch.ts';
import { stateServer } from '../../fixtures/state-server.ts';
import { defaultsFile, scratchEngine } from '../../routes/edit/write-fixture.ts';

/** The writes of the Settings write path a ui store sends an option through. */
type OptionWrites = NonNullable<NonNullable<Parameters<typeof createUi>[0]>['writes']>;

/** The workspace file `plantSaved` writes, by its path in the hub. */
const WORKSPACE = '.oculus/workspaces/main.yml';

/** One page of the server: its client and the ui store over its page state. */
type Page = { client: ClientState; ui: UiStore };

/** The answer a page reads of a writer's outcome. */
function answerOf(outcome: ConfigKeyOutcome): WriteAnswer {
    return { ok: outcome.refused.length === 0, changed: outcome.changed, refused: outcome.refused };
}

/** Let the answers of the writes sent land. */
function settle(): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, 0));
}

/**
 * A server over a scratch engine and hub with a saved workspace file, two pages of it, and the
 * merged config pushed to both once.
 */
function world() {
    const engine = scratchEngine();
    const hub = scratchDir('oculus-hub-');
    const workspace = plantSaved(hub).file;
    const layers: ConfigLayers = { hub, workspace };
    const writes: OptionWrites = {
        writeConfigKey: (file, key, value) =>
            Promise.resolve(answerOf(writeConfigKey(engine, file, key, value, layers))),
        writeConfigValue: (file, key, value, base) =>
            Promise.resolve(answerOf(writeConfigValue(engine, file, key, value, base, layers))),
        resetConfig: () => Promise.reject(new Error('no reset in these cases'))
    };
    const server = stateServer();
    const pages: Page[] = [server.page(), server.page()].map((client) => ({
        client,
        ui: createUi({ state: client.pageState, writes, workspaceFile: () => true })
    }));
    /** The merged config over the files as they are now, installed in every page. */
    function push(): Record<string, unknown> {
        const { config } = loadLayers(engine, layers);
        for (const { client } of pages) {
            client.socket.installConfig({
                config,
                hubs: { primary: null, lists: {}, order: [], own: config, ownCollections: [] },
                text: textCatalog(config),
                icons: {},
                codeThemeClasses: [],
                host: { name: 'host', address: '' },
                findings: [],
                from: {}
            });
        }
        return config;
    }
    /** The `settings:` map of the workspace file as it is on disk. */
    function settings(): unknown {
        return (parse(readFileSync(workspace, 'utf8')) as { settings?: unknown }).settings;
    }
    const defaults = (file: string): string => readFileSync(defaultsFile(engine, file), 'utf8');
    const config = push();
    return { workspace, writes, pages, config, push, settings, defaults };
}

describe('an option set on one page, over two pages of one server', { tags: ['slow'] }, () => {
    it('writes the text size row into the workspace file, shown on the other page after the push', async () => {
        const at = world();
        const [one, two] = at.pages;
        const before = at.defaults('appearance.yml');
        const open = {
            root: 'hub',
            path: WORKSPACE,
            text: {
                text: readFileSync(at.workspace, 'utf8'),
                truncated: false,
                error: '',
                loading: false
            }
        };
        const entries = catalogOf(at.config)['appearance.yml'];
        const rows = fileRows('appearance.yml', entries, at.config, { workspace: open }).rows;
        const row = rows.find((each) => each.key === 'text_size');
        if (row === undefined) throw new Error('no text_size row');
        const writer = createRowWriter(
            at.writes.writeConfigKey,
            at.writes.resetConfig,
            () => undefined,
            () => ({}) as Lists
        );
        expect([one.ui.textScale(), two.ui.textScale()]).toEqual([null, null]);
        await writer.submit(row, '1.2');
        expect(at.settings()).toEqual({ text_size: 1.2 });
        expect(at.defaults('appearance.yml')).toBe(before);
        expect(two.ui.textScale()).toBe(null);
        at.push();
        expect([one.ui.textScale(), two.ui.textScale()]).toEqual([1.2, 1.2]);
    });

    it('writes the theme chosen in the theme list, shown on the other page after the push', async () => {
        const at = world();
        const [one, two] = at.pages;
        const before = at.defaults('appearance.yml');
        const start = two.ui.chosenTheme();
        expect(start).not.toBe('vscode-dark-modern');
        one.ui.setTheme('vscode-dark-modern');
        await settle();
        expect(at.settings()).toEqual({ theme: 'vscode-dark-modern' });
        expect(at.defaults('appearance.yml')).toBe(before);
        expect([one.ui.chosenTheme(), two.ui.chosenTheme()]).toEqual(['vscode-dark-modern', start]);
        at.push();
        expect(two.ui.chosenTheme()).toBe('vscode-dark-modern');
    });

    it("writes the status bar's Hide of an item, shown hidden on the other page after the push", async () => {
        const at = world();
        const [one, two] = at.pages;
        const before = at.defaults('behavior.yml');
        expect(two.ui.statusHidden()).toEqual([]);
        one.ui.setStatusHidden('clock', true);
        await settle();
        expect(at.settings()).toEqual({ status_bar: { hidden: ['clock'] } });
        expect(at.defaults('behavior.yml')).toBe(before);
        expect([one.ui.statusHidden(), two.ui.statusHidden()]).toEqual([['clock'], []]);
        at.push();
        expect(two.ui.statusHidden()).toEqual(['clock']);
    });
});
