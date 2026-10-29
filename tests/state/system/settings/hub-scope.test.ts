// Layer 2, client state tests. The rows of the Settings view's Hub scope with a hub other than the
// primary picked (state/system/config/view/hub-settings.svelte.ts): a row of a key each hub's own
// file is read for is that hub's, showing its value, default and line, read from the slice of its
// merged settings the server answers (server/files/source/hub-settings.ts) and from its own
// settings file, and kept under that hub; a row whose hub file or settings are not read yet, or
// could not be, says why and writes nothing; a row of a key read from the primary alone is left
// as the Primary hub scope draws it. The texts typed in a box are kept under the hub, beside the
// drafts of editor-saved.test.ts.
//
// What this does NOT cover: the scope bar and the look of the rows, which the look on TEST does,
// and the route's reach from an app, which the same-origin guard of the /api routes closes.

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
import { typedText, withTypedText } from '../../../../src/lib/state/system/config/typed.ts';
import {
    hubReader,
    withHubs,
    type HubRead
} from '../../../../src/lib/state/system/config/view/hub-settings.svelte.ts';
import { scratchDir } from '../../../fixtures/scratch.ts';
import {
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
 * One row per outcome of a case: the hub a write names, the hub its drafts are kept under, and
 * whether it says why it writes nothing.
 */
const ROWS: {
    row: string;
    id: string;
    one: Case;
    hub: string | undefined;
    slot: string | undefined;
    blocked: string | undefined;
}[] = [
    {
        row: 'the Primary hub scope: the row is the primary hub file',
        id: STAGES,
        one: {},
        hub: undefined,
        slot: undefined,
        blocked: undefined
    },
    {
        row: "the Hub scope of lab: the row is lab's and kept under lab",
        id: STAGES,
        one: { hub: 'lab' },
        hub: 'lab',
        slot: 'lab',
        blocked: undefined
    },
    {
        row: 'a key read from the primary alone, in the Hub scope of lab: left as it is',
        id: 'behavior.yml:lint.writing_skip',
        one: { hub: 'lab' },
        hub: undefined,
        slot: undefined,
        blocked: undefined
    },
    {
        row: "the Hub scope of lab while lab's file does not parse",
        id: STAGES,
        one: { hub: 'lab', file: { text: text('stages: [\n'), present: true } },
        hub: 'lab',
        slot: 'lab',
        blocked: 'workbench.settings_unparsed'
    },
    {
        row: "the Hub scope of lab while lab's file is being read",
        id: STAGES,
        one: { hub: 'lab', file: { text: text('', { loading: true }), present: true } },
        hub: 'lab',
        slot: 'lab',
        blocked: 'workbench.settings_loading'
    },
    {
        row: "the Hub scope of lab while lab's settings are being read",
        id: STAGES,
        one: { hub: 'lab', read: { state: 'loading' } },
        hub: 'lab',
        slot: 'lab',
        blocked: 'workbench.settings_hub_loading'
    },
    {
        row: "the Hub scope of lab after lab's settings could not be read",
        id: STAGES,
        one: { hub: 'lab', read: LAB_FAILED },
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

describe('a row of the Hub scope', () => {
    it.each(ROWS)('$row', ({ id, one, hub, slot, blocked }) => {
        const row = rowOf(id, one);
        expect([row.hub, row.slot, row.blocked?.key]).toEqual([hub, slot, blocked]);
    });

    it("names lab's file and the line in the sentence of a lab file that does not parse", () => {
        const file = { text: text('stages: [\n'), present: true };
        const row = rowOf(STAGES, { hub: 'lab', file });
        // The flow list opened on line 1 is left open at the end of the text, on line 2.
        expect(row.blocked?.args.slice(0, 2)).toEqual([`lab/${HUB_FILE}`, 2]);
    });

    it.each(UNREAD)(
        "holds no value, default or line of the primary, and names lab's file, while lab's settings $name",
        ({ read, said, args }) => {
            const primary = rowOf(STAGES, { primaryFile: PRIMARY_FILE });
            expect([primary.own, primary.line]).toEqual([true, 1]);
            const row = rowOf(STAGES, { hub: 'lab', primaryFile: PRIMARY_FILE, read });
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
            expect([row.place.root, row.place.path, row.place.layer, row.hub]).toEqual([
                'lab',
                HUB_FILE,
                'hub',
                'lab'
            ]);
        }
    );

    it("shows lab's value, default and line, and writes lab's file", () => {
        const primary = rowOf(STAGES, {});
        const row = rowOf(STAGES, { hub: 'lab' });
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

describe('the text typed in a box of the Hub scope', () => {
    it("is kept under lab and not shown on the primary's row, and both are kept", () => {
        const row = rowOf('sources.yml:memories_dir', { hub: 'lab' });
        const primary = rowOf('sources.yml:memories_dir', {});
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
                hub: 'lab',
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
