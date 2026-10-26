// Layer 2, client state tests. The hub a Settings row of a key each hub's own file is read for
// names (state/system/config/view/hub-settings.svelte.ts): in a workspace of more than one hub
// the row offers every hub, the primary first and chosen, none chosen with no primary; a row of a
// key read from the primary alone offers none; in a workspace of one hub the row names that hub.
// With a hub other than the primary chosen the row shows that hub's value, default and line, read
// from the slice of its merged settings the server answers (server/files/source/hub-settings.ts)
// and from its own settings file, and a row whose hub file or settings are not read yet, or whose
// hub is not picked, says why and writes nothing. The texts typed in a box are kept under the hub
// chosen, beside the drafts of editor-saved.test.ts.
//
// What this does NOT cover: the choice the item draws and the look of the row, which the look on
// TEST does, and the route's reach from an app, which the same-origin guard of the /api routes
// closes.

import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it, vi } from 'vitest';
import { HUB_FILE } from '../../../../src/lib/data/helpers/hub-names.ts';
import { engineDir, loadConfig, textCatalog } from '../../../../src/lib/data/sources/config.ts';
import { words } from '../../../../src/lib/server/core/words.ts';
import { hubSettingsAnswer } from '../../../../src/lib/server/files/source/hub-settings.ts';
import { slotOf } from '../../../../src/lib/state/system/config/editors/slots.ts';
import { settingsGroups } from '../../../../src/lib/state/system/config/groups.ts';
import { catalogOf } from '../../../../src/lib/data/sources/config/catalog/options.ts';
import { placeName, placeOf } from '../../../../src/lib/state/system/config/rows.ts';
import { typedText, withTypedText } from '../../../../src/lib/state/system/config/typed.ts';
import {
    hubReader,
    withHubs,
    type HubRead
} from '../../../../src/lib/state/system/config/view/hub-settings.svelte.ts';
import { scratchDir } from '../../../fixtures/scratch.ts';
import {
    LAB_CHOSEN,
    LAB_FILE,
    LAB_SLICE,
    LAB_STAGES,
    STAGES,
    config,
    hubRowOf as rowOf,
    text,
    type HubCase as Case
} from './fixture.ts';

/** Oculus's stages, which the primary's empty settings file leaves as they are. */
const stages = config.stages;

/** The error a read of lab's settings failed with, and that read. */
const NO_LAB = 'The workspace has no hub named lab';
const LAB_FAILED: HubRead = { state: 'failed', error: NO_LAB };

/**
 * One row per outcome of a case: the hubs offered, the hub chosen, the hub a write names, the hub
 * its drafts are kept under, and whether it says why it writes nothing.
 */
const ROWS: {
    row: string;
    id: string;
    one: Case;
    offered: string[] | undefined;
    chosen: string | undefined;
    hub: string | undefined;
    slot: string | undefined;
    blocked: string | undefined;
}[] = [
    {
        row: 'two hubs: the primary first and chosen',
        id: STAGES,
        one: { hubs: ['hub', 'lab'], primary: 'hub' },
        offered: ['hub', 'lab'],
        chosen: 'hub',
        hub: undefined,
        slot: undefined,
        blocked: undefined
    },
    {
        row: 'two hubs, lab chosen',
        id: STAGES,
        one: { hubs: ['hub', 'lab'], primary: 'hub', chosen: LAB_CHOSEN },
        offered: ['hub', 'lab'],
        chosen: 'lab',
        hub: 'lab',
        slot: 'lab',
        blocked: undefined
    },
    {
        row: 'a key read from the primary alone: no choice',
        id: 'behavior.yml:lint.writing_skip',
        one: { hubs: ['hub', 'lab'], primary: 'hub' },
        offered: undefined,
        chosen: undefined,
        hub: undefined,
        slot: undefined,
        blocked: undefined
    },
    {
        row: 'one hub, the primary: no choice',
        id: STAGES,
        one: { hubs: ['hub'], primary: 'hub' },
        offered: undefined,
        chosen: undefined,
        hub: undefined,
        slot: undefined,
        blocked: undefined
    },
    {
        row: 'one hub that is not the primary: no choice, the write names it',
        id: STAGES,
        one: { hubs: ['lab'], primary: null },
        offered: undefined,
        chosen: undefined,
        hub: 'lab',
        slot: undefined,
        blocked: undefined
    },
    {
        row: 'two hubs and no primary: none chosen, nothing written',
        id: STAGES,
        one: { hubs: ['hub', 'lab'], primary: null },
        offered: ['hub', 'lab'],
        chosen: undefined,
        hub: undefined,
        slot: undefined,
        blocked: 'workbench.settings_pick_hub'
    },
    {
        row: 'two hubs and no primary, lab picked',
        id: STAGES,
        one: { hubs: ['hub', 'lab'], primary: null, chosen: LAB_CHOSEN },
        offered: ['hub', 'lab'],
        chosen: 'lab',
        hub: 'lab',
        slot: 'lab',
        blocked: undefined
    },
    {
        row: 'lab chosen and gone from the workspace: the primary chosen again',
        id: STAGES,
        one: { hubs: ['hub', 'other'], primary: 'hub', chosen: LAB_CHOSEN },
        offered: ['hub', 'other'],
        chosen: 'hub',
        hub: undefined,
        slot: undefined,
        blocked: undefined
    },
    {
        row: "lab chosen while lab's file does not parse",
        id: STAGES,
        one: {
            hubs: ['hub', 'lab'],
            primary: 'hub',
            chosen: LAB_CHOSEN,
            file: { text: text('stages: [\n'), present: true }
        },
        offered: ['hub', 'lab'],
        chosen: 'lab',
        hub: 'lab',
        slot: 'lab',
        blocked: 'workbench.settings_unparsed'
    },
    {
        row: "lab chosen while lab's file is being read",
        id: STAGES,
        one: {
            hubs: ['hub', 'lab'],
            primary: 'hub',
            chosen: LAB_CHOSEN,
            file: { text: text('', { loading: true }), present: true }
        },
        offered: ['hub', 'lab'],
        chosen: 'lab',
        hub: 'lab',
        slot: 'lab',
        blocked: 'workbench.settings_loading'
    },
    {
        row: "lab chosen while lab's settings are being read",
        id: STAGES,
        one: {
            hubs: ['hub', 'lab'],
            primary: 'hub',
            chosen: LAB_CHOSEN,
            read: { state: 'loading' }
        },
        offered: ['hub', 'lab'],
        chosen: 'lab',
        hub: 'lab',
        slot: 'lab',
        blocked: 'workbench.settings_hub_loading'
    },
    {
        row: "lab chosen after lab's settings could not be read",
        id: STAGES,
        one: { hubs: ['hub', 'lab'], primary: 'hub', chosen: LAB_CHOSEN, read: LAB_FAILED },
        offered: ['hub', 'lab'],
        chosen: 'lab',
        hub: 'lab',
        slot: 'lab',
        blocked: 'workbench.settings_hub_failed'
    }
];

/** The primary's settings file, which sets the stages on its first line. */
const PRIMARY_FILE = 'stages:\n  nascent: { label: Idea }\n';

/** Lab's settings, being read and failed, each with the sentence the row says in their place. */
const UNREAD: { name: string; read: HubRead; said: string; args: unknown[] }[] = [
    { name: 'are being read', read: { state: 'loading' }, said: 'hub_loading', args: ['lab'] },
    { name: 'could not be read', read: LAB_FAILED, said: 'hub_failed', args: ['lab', NO_LAB] }
];

describe('the hub a Settings row names', () => {
    it.each(ROWS)('$row', ({ id, one, offered, chosen, hub, slot, blocked }) => {
        const row = rowOf(id, one);
        expect(row.choice?.offered).toEqual(offered);
        expect(row.choice?.chosen).toEqual(chosen);
        expect([row.hub, row.slot, row.blocked?.key]).toEqual([hub, slot, blocked]);
    });

    it("names lab's file in the sentence of a lab file that does not parse", () => {
        const file = { text: text('stages: [\n'), present: true };
        const row = rowOf(STAGES, {
            hubs: ['hub', 'lab'],
            primary: 'hub',
            chosen: LAB_CHOSEN,
            file
        });
        expect(row.blocked?.args[0]).toBe(`lab/${HUB_FILE}`);
    });

    it.each(UNREAD)(
        "holds no value, default or line of the primary, and names lab's file, while lab's settings $name",
        ({ read, said, args }) => {
            const one = { hubs: ['hub', 'lab'], primary: 'hub', primaryFile: PRIMARY_FILE };
            const primary = rowOf(STAGES, one);
            expect([primary.own, primary.line]).toEqual([true, 1]);
            const row = rowOf(STAGES, { ...one, chosen: LAB_CHOSEN, read });
            expect([row.value, row.default, row.modified, row.own, row.line]).toEqual([
                undefined,
                undefined,
                false,
                false,
                undefined
            ]);
            expect([row.unread, row.blocked?.key, row.blocked?.args]).toEqual([
                true,
                `workbench.settings_${said}`,
                args
            ]);
            expect([placeOf(row), placeName(row)]).toEqual([
                { root: 'lab', file: HUB_FILE },
                `lab/${HUB_FILE}`
            ]);
        }
    );

    it("shows lab's value, default and line, and opens lab's file, with lab chosen", () => {
        const primary = rowOf(STAGES, { hubs: ['hub', 'lab'], primary: 'hub' });
        const row = rowOf(STAGES, { hubs: ['hub', 'lab'], primary: 'hub', chosen: LAB_CHOSEN });
        expect(primary.value).toEqual(stages);
        expect([row.value, row.default, row.modified, row.own, row.line]).toEqual([
            LAB_STAGES,
            stages,
            true,
            true,
            1
        ]);
        expect(row.place).toEqual({ layer: 'hub', root: 'lab', path: HUB_FILE, present: true });
    });
});

describe('the text typed in a box with a hub chosen', () => {
    it("is kept under lab and not shown on the primary's row, and both are kept", () => {
        const row = rowOf('sources.yml:memories_dir', {
            hubs: ['hub', 'lab'],
            primary: 'hub',
            chosen: { 'sources.yml:memories_dir': 'lab' }
        });
        const primary = rowOf('sources.yml:memories_dir', { hubs: ['hub', 'lab'], primary: 'hub' });
        const typed = withTypedText({}, slotOf(row), 'pictures');
        expect([typedText(typed, slotOf(row)), typedText(typed, slotOf(primary))]).toEqual([
            'pictures',
            undefined
        ]);
        const both = withTypedText(typed, slotOf(primary), 'photos');
        expect([typedText(both, slotOf(row)), typedText(both, slotOf(primary))]).toEqual([
            'pictures',
            'photos'
        ]);
    });
});

describe("the reader of a hub's settings", () => {
    it('reads each hub wanted, reads it again at a new version, and keeps no answer it overtook', async () => {
        const answers: ((body: unknown, status?: number) => void)[] = [];
        const get = vi.fn(
            () =>
                new Promise<Response>((done) =>
                    answers.push((body, status = 200) =>
                        done(new Response(JSON.stringify(body), { status }))
                    )
                )
        );
        const reader = hubReader(get);
        reader.want(['lab'], 1);
        expect(reader.read('lab')).toEqual({ state: 'loading' });
        reader.want(['lab'], 2);
        expect(get).toHaveBeenCalledTimes(2);
        answers[1](LAB_SLICE);
        await vi.waitFor(() => expect(reader.read('lab').state).toBe('ready'));
        answers[0]({ error: 'old' }, 404);
        await Promise.resolve();
        expect(reader.read('lab').state).toBe('ready');
        reader.want(['lab'], 2);
        expect(get).toHaveBeenCalledTimes(2);
        reader.want(['lab'], 3);
        answers[2]({ error: 'The workspace has no hub named lab' }, 404);
        await vi.waitFor(() =>
            expect(reader.read('lab')).toEqual({
                state: 'failed',
                error: 'The workspace has no hub named lab'
            })
        );
        reader.close();
    });
});

describe('the route that answers the settings of a hub', { tags: ['slow'] }, () => {
    it("answers lab's slice as lab's merge gives it, keeps a stage the primary removes, and refuses another name", () => {
        const engine = engineDir();
        const hub = scratchDir('oculus-hub-');
        const lab = scratchDir('oculus-lab-');
        for (const [dir, body] of [
            [hub, 'stages:\n  nascent: null\n'],
            [lab, LAB_FILE]
        ]) {
            mkdirSync(join(dir, '.oculus'), { recursive: true });
            writeFileSync(join(dir, HUB_FILE), body);
        }
        const settings = (dir: string) => loadConfig(engine, { hub: dir });
        const open = {
            hubs: [
                { name: 'hub', dir: hub },
                { name: 'lab', dir: lab }
            ]
        };
        const textOf = textCatalog(config);
        const answer = hubSettingsAnswer('lab', open, settings, textOf);
        const merged = settings(lab).config;
        expect(answer.status).toBe(200);
        const body = answer.body as { hub: string; config: Record<string, unknown> };
        expect([Object.keys(body), body.hub]).toEqual([['hub', 'config'], 'lab']);
        expect(body.config.stages).toEqual(merged.stages);
        expect(body.config.lint).toBeUndefined();
        const primary = settings(hub).config;
        const read: HubRead = { state: 'ready', slice: answer.body as never };
        const rows = withHubs(
            settingsGroups(catalogOf(primary), primary, {
                hubFile: { text: text('stages:\n  nascent: null\n'), present: true },
                workspace: null
            }),
            {
                hubs: ['hub', 'lab'],
                primary: 'hub',
                chosen: { 'catalogs/vocab.yml:categories': 'lab' },
                config: primary,
                read: () => read,
                file: () => ({ text: text(LAB_FILE), present: true })
            }
        ).flatMap((group) => group.sections.flatMap((section) => section.rows));
        const categories = rows.find((one) => one.id === 'catalogs/vocab.yml:categories');
        if (categories?.kind !== 'config') throw new Error('no categories row');
        expect(JSON.stringify(categories.value)).toContain('nascent');
        expect(JSON.stringify(primary.categories)).not.toContain('nascent');
        expect(categories.modified).toBe(false);
        expect(hubSettingsAnswer('nowhere', open, settings, textOf)).toEqual({
            status: 404,
            body: { error: words(textOf, 'server.workspace.no_hub_named', 'nowhere') }
        });
    });
});
