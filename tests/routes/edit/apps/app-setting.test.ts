// Layer 2, route tests. What the /api/write route does with an `app-setting` write: the value of a
// setting an app declares, stored under `app_settings:` in the primary hub's settings file, the
// refusals that leave the file as it was, the stored values the apps watcher judges, the values a
// host reads, and the undo. These are the settings rows of G77.
//
// The engine is a scratch copy of the checkout's config/ folder (write-fixture.ts) and the hub and
// apps are synthetic, so no case writes the checkout or the machine's own files. What this does NOT
// cover: the Settings control that sends the write and the host's own `getConfiguration`
// (tests/server/machine/apps).
// @module-tag slow: every case writes a setting through the route into a scratch engine.

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect } from 'vitest';
import { HUB_FILE } from '../../../../src/lib/data/helpers/hub-names.ts';
import { findingText } from '../../../../src/lib/data/helpers/finding-text.ts';
import { APP_HEADER, KIND_HEADER } from '../../../../src/lib/data/helpers/files/apps/apps.ts';
import {
    appSettingValues,
    settingValues
} from '../../../../src/lib/data/helpers/files/apps/settings.ts';
import { loadConfig, textCatalog } from '../../../../src/lib/data/sources/config.ts';
import { handleWrite } from '../../../../src/lib/server/edit/writes.ts';
import type { PrimaryTarget } from '../../../../src/lib/server/edit/writes.ts';
import { words } from '../../../../src/lib/server/core/words.ts';
import { approveApp } from '../../../../src/lib/server/machine/approvals/approvals.ts';
import { judgeStored } from '../../../../src/lib/server/machine/apps/read/across/stored.ts';
import { plantHub } from '../../../fixtures/hubs/workspace.ts';
import { it } from '../../../fixtures/scratch.ts';
import { notesFiles, routeSetup } from '../../apps/apps-fixture.ts';
import { TOKEN, changesOf, configTarget, request, undone } from '../write-fixture.ts';

const WIDTH =
    'contributes:\n  configuration:\n    title: Notes\n    properties:\n      notes.width:\n        type: number\n        default: 80\n        minimum: 40\n';
const MANIFEST = 'name: notes\ntitle: Notes\nbridge: 1\n';

/** A target whose apps are `notes` declaring `notes.width`, approved unless the case says not. */
function world(approve = true, extra = '') {
    const apps = routeSetup({ machine: notesFiles(`${MANIFEST}${extra}${WIDTH}`) });
    if (approve) {
        for (const app of apps.held().apps) {
            approveApp(apps.approvals, {
                hash: app.row.hash,
                folder: app.row.folder,
                label: app.id
            });
        }
        apps.options.apps.reread();
    }
    const into: PrimaryTarget = {
        ...configTarget(),
        apps: { held: apps.held, data: join(apps.fixture.base, 'data'), maxKb: 256 }
    };
    plantHub(into.hub, EMPTY);
    return { apps, into };
}

/** The hub's settings file, where the write lands. */
const layerOf = (into: PrimaryTarget): string => join(into.hub, HUB_FILE);

/** The text a hub's settings file holds before any write: the empty map. */
const EMPTY = '{}\n';

/** One app-setting write as the page sends it, and the answer. */
async function send(into: PrimaryTarget, key: string, value: unknown, headers = {}) {
    const response = await handleWrite(
        request({ kind: 'app-setting', key, value }, headers),
        TOKEN,
        into
    );
    return { status: response.status, body: (await response.json()) as Record<string, unknown> };
}

const CATALOG = textCatalog(loadConfig(world().into.engine).config);
const why = (key: string, ...args: (string | number)[]): string =>
    words(CATALOG, `server.app_setting.${key}`, ...args);

/** The refusal reasons an answer carries. */
const reasons = (body: Record<string, unknown>): string[] =>
    ((body.refused ?? []) as { reason: string }[]).map((one) => one.reason);

describe('a setting an approved app declares', () => {
    it('writes the one key into the settings file, which the merged configuration then reads', async () => {
        const { into } = world();
        const sent = await send(into, 'notes.width', 100);
        expect(sent.status).toBe(200);
        expect(readFileSync(layerOf(into), 'utf8')).toBe('app_settings:\n  notes.width: 100\n');
        const merged = loadConfig(into.engine, { hub: into.hub }).config;
        expect(appSettingValues(merged)).toEqual({ 'notes.width': 100 });
        expect(changesOf(into)[0]).toMatchObject({
            kind: 'app-setting',
            field: 'notes.width',
            before: null,
            after: 100
        });
    });

    it('gives the host the stored value and the default for one that breaks the declaration', () => {
        const { apps } = world();
        const settings = apps.held().apps[0].row.contributes.configuration?.properties ?? [];
        expect(settingValues(settings, { 'notes.width': 100 })).toEqual({ 'notes.width': 100 });
        expect(settingValues(settings, { 'notes.width': 10 })).toEqual({ 'notes.width': 80 });
        expect(settingValues(settings, {})).toEqual({ 'notes.width': 80 });
    });

    it('takes the write back, leaving the settings file as the empty map it was', async () => {
        const { into } = world();
        await send(into, 'notes.width', 100);
        const [change] = changesOf(into);
        expect((await undone(into, change)).status).toBe(200);
        expect(readFileSync(layerOf(into), 'utf8')).toBe(EMPTY);
    });
});

describe('a write that is refused leaves the settings file as it was', () => {
    it.each([
        ['a value below the least the app declares', 'notes.width', 10, why('minimum', 40), true],
        ['a value of another type', 'notes.width', 'wide', why('type_number'), true],
        ['a key no app declares', 'gone.x', 1, why('not_declared', 'gone.x'), true],
        [
            'the key of an app that is not approved',
            'notes.width',
            100,
            why('not_declared', 'notes.width'),
            false
        ]
    ] as [string, string, unknown, string, boolean][])(
        '%s',
        async (_row, key, value, reason, approved) => {
            const { into } = world(approved);
            const sent = await send(into, key, value);
            expect([reasons(sent.body), readFileSync(layerOf(into), 'utf8')]).toEqual([
                [reason],
                EMPTY
            ]);
        }
    );

    it('refuses the key of an app that is disabled', async () => {
        const { apps, into } = world();
        const held = apps.held();
        const disabled = {
            ...held,
            apps: held.apps.map((one) => ({ ...one, row: { ...one.row, disabled: true } }))
        };
        const sent = await send(
            { ...into, apps: { held: () => disabled, data: '', maxKb: 256 } },
            'notes.width',
            100
        );
        expect([reasons(sent.body), readFileSync(layerOf(into), 'utf8')]).toEqual([
            [why('not_declared', 'notes.width')],
            EMPTY
        ]);
    });

    it('is closed to an app: the gate refuses the kind whatever the header names', async () => {
        const { into } = world(true, 'writes: [radar-add]\n');
        const sent = await send(into, 'notes.width', 100, {
            [APP_HEADER]: 'app:notes',
            [KIND_HEADER]: 'app-setting'
        });
        expect([sent.status, readFileSync(layerOf(into), 'utf8')]).toEqual([403, EMPTY]);
    });
});

describe('the stored values the apps watcher judges', () => {
    /** The findings a stored map gives over the held apps, as [key, sentence]. */
    function judged(stored: Record<string, unknown>) {
        const { apps, into } = world();
        const held = apps.held();
        held.findings.length = 0;
        judgeStored(held, {
            config: { app_settings: stored },
            catalog: CATALOG,
            settingsFile: layerOf(into),
            appearanceFile: join(into.hub, 'appearance.yml')
        });
        return held.findings.map((one) => [one.key, one.message]);
    }

    it('names a value set by hand below the minimum, with the setting and the app', () => {
        expect(judged({ 'notes.width': 10 })).toEqual([
            [
                'config/behavior.yml',
                findingText(CATALOG, 'findings.apps.setting_minimum', 'notes.width', 'Notes')
            ]
        ]);
    });

    it('names a key no app declares', () => {
        expect(judged({ 'gone.x': 1 })).toEqual([
            [
                'config/behavior.yml',
                findingText(CATALOG, 'findings.apps.setting_undeclared', 'gone.x')
            ]
        ]);
    });

    it('gives no finding for a value that keeps its declaration', () => {
        expect(judged({ 'notes.width': 100 })).toEqual([]);
    });
});
