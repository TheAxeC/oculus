// Layer 4, test. The Save of one file of a Settings view's scopes
// (views/system/workbench/settings/scopes/scopes.svelte.ts): a change and a `downloads` secret
// typed while the Save of their file was out are the reader's newer word, so they are held after
// the answer for the next Save, and what the Save sent is dropped. The secrets are made up.
//
// The scopes, the family editors' writer (state/system/config/editors/writer.ts) and the rows'
// writer (state/system/config/scopes/write.ts) driven together, as the Settings view wires them:
// once a Save of a family row lands, the row holds no change and no draft whichever value the
// pushes around its answer bring, in the scope and file the Save wrote and in no other, which the
// slots the Save tells name; a row edited again while its Save was out keeps the newer change and
// its draft and is not among those slots; a family or a top-level row edited back to its file's
// value while its Save was out holds, once the Save lands, the change back to the value it had
// before, or the taking out of a key the file did not hold, and is not among those slots either; a
// Discard while the Save was out leaves nothing held; and a refused Save keeps its change and its
// draft until a Save lands. The same holds for an app's setting and for the workspace's primary and
// a folder's name brought back while their Save is out, a renamed folder getting its old name back;
// an edit back to the value the Save wrote holds nothing; and of two Saves of one file out at once,
// a refused one gives up no edit back the other still sent. The tab's instance state is a value
// held here, as the editors' slots keep it (state/system/config/editors/slots.ts), and an edit that
// leaves the draft equal to the file's value puts the file's own back, as the family editor does.
//
// What this does NOT cover: the server's write of the Save, which
// tests/routes/edit/undo/config-save.test.ts holds, nor the scope bar, the tab's mark and the
// editor's lines, which the look does.

import { describe, expect, it } from 'vitest';
import {
    applyEdit,
    draftOf,
    isEdited,
    movedFrom,
    type Draft,
    type Edit
} from '../../../../src/lib/state/system/config/editors/draft.ts';
import {
    savedBase,
    savedDraft,
    slotOf,
    withSavedDraft,
    type Slot
} from '../../../../src/lib/state/system/config/editors/slots.ts';
import { createEditorWriter } from '../../../../src/lib/state/system/config/editors/writer.ts';
import { fileRows, type ConfigRow } from '../../../../src/lib/state/system/config/rows.ts';
import {
    PRIMARY_NAME,
    folderName,
    keyName,
    type SaveBody
} from '../../../../src/lib/state/system/config/scopes/changes.ts';
import {
    fileOf,
    type Scope,
    type ScopeGround
} from '../../../../src/lib/state/system/config/scopes/scope.ts';
import { createRowWriter } from '../../../../src/lib/state/system/config/scopes/write.ts';
import type { WriteAnswer } from '../../../../src/lib/state/shared/stores/shapes.ts';
import { createScopes } from '../../../../src/lib/views/system/workbench/settings/scopes/scopes.svelte.ts';
import { bareLists, config, shipped, text } from '../../../state/system/settings/fixture.ts';

const GROUND: ScopeGround = {
    folders: [{ key: 'hub', dir: '/w/hub', hub: true }],
    primary: 'hub',
    workspaceFile: '.oculus/workspaces/w.yml'
};

/** The name the This machine scope of `hub` keeps its changes under. */
const LOCAL = 'local:hub';

const PORT = keyName('local.yml', 'port');

const WRITTEN: WriteAnswer = { ok: true, changed: ['local.yml'], refused: [] };

/** The scopes of a view on the This machine scope of `hub`, each Save held until it is answered. */
function scopesOnLocal() {
    const sent: SaveBody[] = [];
    const answers: ((answer: WriteAnswer) => void)[] = [];
    const settles: (() => void)[] = [];
    /** Settles once the Save has been sent, so what is typed next is typed while it is out. */
    const out = new Promise<void>((settle) => settles.push(settle));
    const scopes = createScopes({
        scope: () => ({ kind: 'local', hub: 'hub' }),
        ground: () => GROUND,
        read: () => ({ name: 'local.yml', present: true, blocked: null, digest: 'digest' }),
        downloads: () => [{ service: 'ieee', user: 'me', secret: true }],
        send: (body) => {
            sent.push(body);
            const answered = new Promise<WriteAnswer>((answer) => answers.push(answer));
            for (const settle of settles) settle();
            return answered;
        },
        saveWorkspace: () => Promise.resolve(WRITTEN),
        wrote: () => undefined
    });
    return { scopes, sent, out, answer: () => answers.shift()?.(WRITTEN) };
}

describe('a change and a secret typed while the Save of their file is out', () => {
    it('holds a port changed again while the Save was out, and drops the port it sent', async () => {
        const { scopes, sent, out, answer } = scopesOnLocal();
        scopes.changes.stage(LOCAL, PORT, { file: 'local.yml', key: 'port', value: 8799 });
        const saving = scopes.save();
        await out;
        scopes.changes.stage(LOCAL, PORT, { file: 'local.yml', key: 'port', value: 8800 });
        answer();
        expect(await saving).toBe(true);
        expect(sent.map((body) => body.changes)).toEqual([
            [{ file: 'local.yml', key: 'port', value: 8799 }]
        ]);
        expect(scopes.changes.of(LOCAL)).toEqual([{ file: 'local.yml', key: 'port', value: 8800 }]);
    });

    it('holds a secret typed again and one typed for another row while the Save was out, and drops the secret it sent', async () => {
        const { scopes, sent, out, answer } = scopesOnLocal();
        scopes.changes.stageSecret(LOCAL, 'ieee', 'the first made-up secret');
        const saving = scopes.save();
        await out;
        scopes.changes.stageSecret(LOCAL, 'ieee', 'the second made-up secret');
        scopes.changes.stageSecret(LOCAL, 'acm', null);
        answer();
        expect(await saving).toBe(true);
        expect(sent).toHaveLength(1);
        expect([...scopes.changes.secretsOf(LOCAL)]).toEqual([
            ['ieee', 'the second made-up secret'],
            ['acm', null]
        ]);
    });

    it('drops a secret the Save sent when nothing was typed while it was out', async () => {
        const { scopes, out, answer } = scopesOnLocal();
        scopes.changes.stageSecret(LOCAL, 'ieee', 'the first made-up secret');
        const saving = scopes.save();
        await out;
        answer();
        expect(await saving).toBe(true);
        expect(scopes.changes.count(LOCAL)).toBe(0);
    });
});

/** A workspace of the primary `hub` and the hub `lab`. */
const HUBS: ScopeGround = {
    folders: [
        { key: 'hub', dir: '/w/hub', hub: true },
        { key: 'lab', dir: '/w/lab', hub: true }
    ],
    primary: 'hub',
    workspaceFile: '.oculus/workspaces/w.yml'
};

const PRIMARY: Scope = { kind: 'primary' };
const LAB: Scope = { kind: 'hub', hub: 'lab' };

/** A refusal of a Save, its file changed since the page read it. */
const STALE_DIGEST: WriteAnswer = {
    ok: false,
    changed: [],
    refused: [{ field: 'digest', reason: 'The file changed since it was read.' }]
};

const LITWATCH = {
    task: 'litwatch',
    label: 'Literature',
    note: 'The radar',
    last_run: 'radar',
    stale_days: 31
};
const SCOUT = {
    task: 'scout',
    label: 'Scout',
    note: 'The leads',
    last_run: 'scout',
    stale_days: 7
};

/** The two rows the primary's file holds. */
const TASKS = [LITWATCH, SCOUT];

/**
 * The `update_tasks` row holding `value`, in the scope of the primary or of `lab`, the file of the
 * scope holding the key.
 */
function tasks(value: unknown, scope: Scope = PRIMARY): ConfigRow {
    const made = fileRows(
        'sources.yml',
        shipped['sources.yml'],
        { ...config, update_tasks: value },
        {
            hubFile: { text: text(`update_tasks: ${JSON.stringify(value)}\n`), present: true },
            workspace: null
        }
    ).rows.find((one) => one.key === 'update_tasks');
    if (made === undefined) throw new Error('no update_tasks row');
    return scope.kind === 'hub' ? { ...made, hub: scope.hub, slot: scope.hub } : made;
}

/**
 * The `update_tasks` row holding `value` from a layer under the primary's file, which holds no
 * key for it.
 */
function inherited(value: unknown): ConfigRow {
    const made = fileRows(
        'sources.yml',
        shipped['sources.yml'],
        { ...config, update_tasks: value },
        { hubFile: { text: text('{}\n'), present: true }, workspace: null }
    ).rows.find((one) => one.key === 'update_tasks');
    if (made === undefined) throw new Error('no update_tasks row');
    return made;
}

/** The `apps_dir` row of the primary's file holding `value`, or with null holding no key for it. */
function appsDir(value: string | null): ConfigRow {
    const made = fileRows(
        'sources.yml',
        shipped['sources.yml'],
        value === null ? config : { ...config, apps_dir: value },
        {
            hubFile: {
                text: text(value === null ? '{}\n' : `apps_dir: ${value}\n`),
                present: true
            },
            workspace: null
        }
    ).rows.find((one) => one.key === 'apps_dir');
    if (made === undefined) throw new Error('no apps_dir row');
    return made;
}

const LISTS = bareLists(config);

/**
 * The scopes of a view and its family editors' writer, wired as the Settings view wires them, the
 * tab's drafts a value held here. A Save is answered, once it is out, with the answer `save` takes.
 */
function bench(on: Scope) {
    let scope = on;
    let state: unknown = {};
    const sent: SaveBody[] = [];
    /** The slots each landed Save told the view it wrote. */
    const told: Slot[][] = [];
    const answers: ((answer: WriteAnswer) => void)[] = [];
    let sending: () => void = () => undefined;
    const scopes = createScopes({
        scope: () => scope,
        ground: () => HUBS,
        read: () => ({
            name: '.oculus/config.yml',
            present: true,
            blocked: null,
            digest: 'digest'
        }),
        downloads: () => undefined,
        send: (body) => {
            sent.push(body);
            const answered = new Promise<WriteAnswer>((answer) => answers.push(answer));
            sending();
            return answered;
        },
        saveWorkspace: () => Promise.resolve(WRITTEN),
        wrote: (slots) => {
            told.push(slots);
            writer.saved(slots);
        }
    });
    const writer = createEditorWriter({
        stage: scopes.stage,
        changed: () => undefined,
        ended: (row) => {
            state = withSavedDraft(state, slotOf(row), null);
        },
        held: (row) => savedDraft(state, row),
        stale: (row) => movedFrom(savedBase(state, slotOf(row)), row),
        lists: () => LISTS
    });
    const rows = createRowWriter(
        scopes.stage,
        () => undefined,
        () => LISTS
    );

    /**
     * An edit of a row's draft as the family editor makes it: kept in the tab and held as a change,
     * or with the draft equal to the file's value, no draft and the change dropped.
     */
    function edit(row: ConfigRow, next: Edit): void {
        const held = savedDraft(state, row);
        const draft: Draft | null = held ?? draftOf(row);
        if (draft === null) throw new Error('no draft');
        const changed = applyEdit(draft, next);
        if (!isEdited(changed, row, LISTS)) {
            state = withSavedDraft(state, slotOf(row), null);
            writer.save(row, changed);
            return;
        }
        const base = held === undefined ? row.value : savedBase(state, slotOf(row));
        state = withSavedDraft(state, slotOf(row), changed, base);
        writer.save(row, changed);
    }

    /**
     * Save the scope on screen; `meanwhile` runs while the Save is out, before its answer, or once
     * the Save is done for a scope with nothing to send.
     */
    async function save(answer: WriteAnswer, meanwhile: () => void = () => undefined) {
        const out = new Promise<void>((settle) => {
            sending = settle;
        });
        const saving = scopes.save();
        await Promise.race([out, saving]);
        meanwhile();
        answers.shift()?.(answer);
        return saving;
    }

    /** The changes held for the scope's file and whether the row's draft is kept. */
    function left(row: ConfigRow, of: Scope = scope) {
        return [scopes.changes.count(fileOf(of, HUBS)), savedDraft(state, row) !== undefined];
    }

    return {
        scopes,
        writer,
        rows,
        edit,
        save,
        left,
        /** The changes each Save sent. */
        sent: () => sent.map((body) => body.changes),
        /** The value the last Save sent for the row's key. */
        saved: () => {
            const change = sent.at(-1)?.changes.at(0);
            return change !== undefined && 'value' in change ? change.value : undefined;
        },
        show: (next: Scope) => {
            scope = next;
        },
        told,
        /** Start a Save of the scope on screen and wait until it is out, its answer held back. */
        start: async () => {
            const out = new Promise<void>((settle) => {
                sending = settle;
            });
            const saving = scopes.save();
            await out;
            return { saving };
        },
        /** Answer the Save sent at a place among those still out. */
        answerAt: (at: number, answer: WriteAnswer) => answers.splice(at, 1)[0]?.(answer)
    };
}

/** One row whose Save is sent: what is done, and what is left of it, change and draft. */
type Landing = { name: string; run: () => Promise<unknown>; left: unknown };

const LANDINGS: Landing[] = [
    {
        name: "scout's stale_days changed from 7 to 8, the old value pushed and then the saved one",
        run: async () => {
            const view = bench(PRIMARY);
            view.edit(tasks(TASKS), { do: 'set', index: 1, field: 'stale_days', value: '8' });
            await view.save(WRITTEN);
            view.writer.pushed(tasks(TASKS));
            view.writer.pushed(tasks(view.saved()));
            return view.left(tasks(view.saved()));
        },
        left: [0, false]
    },
    {
        name: "litwatch's stale_days cleared, the old value pushed and then the saved one",
        run: async () => {
            const view = bench(PRIMARY);
            view.edit(tasks(TASKS), { do: 'set', index: 0, field: 'stale_days', value: undefined });
            await view.save(WRITTEN);
            view.writer.pushed(tasks(TASKS));
            view.writer.pushed(tasks(view.saved()));
            return [view.saved(), view.left(tasks(view.saved()))];
        },
        left: [[{ ...LITWATCH, stale_days: undefined }, SCOUT].map(withoutUnset), [0, false]]
    },
    {
        name: "litwatch's last_run set to Not set, the old value pushed and then the saved one",
        run: async () => {
            const view = bench(PRIMARY);
            view.edit(tasks(TASKS), { do: 'set', index: 0, field: 'last_run', value: undefined });
            await view.save(WRITTEN);
            view.writer.pushed(tasks(TASKS));
            view.writer.pushed(tasks(view.saved()));
            return view.left(tasks(view.saved()));
        },
        left: [0, false]
    },
    {
        name: 'an entry added, the old value pushed and then the saved one',
        run: async () => {
            const view = bench(PRIMARY);
            view.edit(tasks(TASKS), { do: 'add' });
            for (const [field, value] of Object.entries({
                task: 'news',
                label: 'News',
                note: 'N'
            })) {
                view.edit(tasks(TASKS), { do: 'set', index: 2, field, value });
            }
            await view.save(WRITTEN);
            view.writer.pushed(tasks(TASKS));
            view.writer.pushed(tasks(view.saved()));
            return view.left(tasks(view.saved()));
        },
        left: [0, false]
    },
    {
        name: 'the family emptied, the old value pushed and then the saved one',
        run: async () => {
            const view = bench(PRIMARY);
            view.edit(tasks(TASKS), { do: 'remove', index: 1 });
            view.edit(tasks(TASKS), { do: 'remove', index: 0 });
            await view.save(WRITTEN);
            view.writer.pushed(tasks(TASKS));
            view.writer.pushed(tasks(view.saved()));
            return [view.saved(), view.left(tasks(view.saved()))];
        },
        left: [[], [0, false]]
    },
    {
        name: 'the saved value pushed alone',
        run: async () => {
            const view = bench(PRIMARY);
            view.edit(tasks(TASKS), { do: 'set', index: 1, field: 'stale_days', value: '8' });
            await view.save(WRITTEN);
            view.writer.pushed(tasks(view.saved()));
            return view.left(tasks(view.saved()));
        },
        left: [0, false]
    },
    {
        name: 'the saved value pushed while the Save is out, before its answer',
        run: async () => {
            const view = bench(PRIMARY);
            const row = tasks(TASKS);
            view.edit(row, { do: 'set', index: 1, field: 'stale_days', value: '8' });
            await view.save(WRITTEN, () => view.writer.pushed(tasks(view.saved())));
            return view.left(tasks(view.saved()));
        },
        left: [0, false]
    },
    {
        name: 'a row edited again while its Save is out, the old value pushed, then the saved one',
        run: async () => {
            const view = bench(PRIMARY);
            view.edit(tasks(TASKS), { do: 'set', index: 1, field: 'stale_days', value: '8' });
            await view.save(WRITTEN, () =>
                view.edit(tasks(TASKS), { do: 'set', index: 1, field: 'stale_days', value: '9' })
            );
            const saved = view.saved();
            view.writer.pushed(tasks(TASKS));
            view.writer.pushed(tasks(saved));
            return [view.left(tasks(saved)), view.told];
        },
        left: [[1, true], [[]]]
    },
    {
        name: 'a refused Save, then a Save that lands, each followed by the old and saved value',
        run: async () => {
            const view = bench(PRIMARY);
            view.edit(tasks(TASKS), { do: 'set', index: 1, field: 'stale_days', value: '8' });
            const first = await view.save(STALE_DIGEST);
            view.writer.pushed(tasks(TASKS));
            const refused = [
                first,
                ...view.left(tasks(TASKS)),
                view.scopes.said('hub:hub') !== null
            ];
            const second = await view.save(WRITTEN);
            view.writer.pushed(tasks(TASKS));
            view.writer.pushed(tasks(view.saved()));
            return [refused, [second, ...view.left(tasks(view.saved()))]];
        },
        left: [
            [false, 1, true, true],
            [true, 0, false]
        ]
    },
    {
        name: "a Save of lab's file, the primary holding a draft of the same key",
        run: async () => {
            const view = bench(PRIMARY);
            view.edit(tasks(TASKS), { do: 'set', index: 0, field: 'stale_days', value: '30' });
            view.show(LAB);
            view.edit(tasks(TASKS, LAB), { do: 'set', index: 1, field: 'stale_days', value: '8' });
            await view.save(WRITTEN);
            view.writer.pushed(tasks(TASKS, LAB));
            view.writer.pushed(tasks(view.saved(), LAB));
            return [
                view.left(tasks(view.saved(), LAB), LAB),
                view.left(tasks(TASKS), PRIMARY),
                view.told
            ];
        },
        left: [[0, false], [1, true], [[{ file: 'sources.yml', key: 'update_tasks', hub: 'lab' }]]]
    },
    {
        name: "scout's stale_days changed from 7 to 8 and set back to 7 while its Save is out",
        run: async () => {
            const view = bench(PRIMARY);
            view.edit(tasks(TASKS), { do: 'set', index: 1, field: 'stale_days', value: '8' });
            await view.save(WRITTEN, () =>
                view.edit(tasks(TASKS), { do: 'set', index: 1, field: 'stale_days', value: '7' })
            );
            const saved = view.saved();
            view.writer.pushed(tasks(TASKS));
            view.writer.pushed(tasks(saved));
            const held = view.scopes.changes.of('hub:hub');
            const unsaved = view.writer.unsaved(tasks(saved));
            const left = view.left(tasks(saved));
            await view.save(WRITTEN);
            return [saved, held, unsaved, left, view.told, view.sent().at(-1)];
        },
        left: [
            [LITWATCH, { ...SCOUT, stale_days: 8 }],
            [
                {
                    file: 'sources.yml',
                    key: 'update_tasks',
                    value: TASKS,
                    base: [LITWATCH, { ...SCOUT, stale_days: 8 }]
                }
            ],
            true,
            [1, false],
            [[], [{ file: 'sources.yml', key: 'update_tasks' }]],
            [
                {
                    file: 'sources.yml',
                    key: 'update_tasks',
                    value: TASKS,
                    base: [LITWATCH, { ...SCOUT, stale_days: 8 }]
                }
            ]
        ]
    },
    {
        name: "apps_dir changed and typed back to the file's value while its Save is out",
        run: async () => {
            const view = bench(PRIMARY);
            view.rows.submit(appsDir('apps'), 'more-apps');
            await view.save(WRITTEN, () => view.rows.submit(appsDir('apps'), 'apps'));
            const held = view.scopes.changes.of('hub:hub');
            const pending = view.rows.pending(appsDir('more-apps'));
            await view.save(WRITTEN);
            return [held, pending, view.told, view.sent()];
        },
        left: [
            [{ file: 'sources.yml', key: 'apps_dir', value: 'apps' }],
            true,
            [[], [{ file: 'sources.yml', key: 'apps_dir' }]],
            [
                [{ file: 'sources.yml', key: 'apps_dir', value: 'more-apps' }],
                [{ file: 'sources.yml', key: 'apps_dir', value: 'apps' }]
            ]
        ]
    },
    {
        name: 'apps_dir the file holds no key for, set and its box emptied while its Save is out',
        run: async () => {
            const view = bench(PRIMARY);
            view.rows.submit(appsDir(null), 'more-apps');
            await view.save(WRITTEN, () => view.rows.submit(appsDir(null), ''));
            return [view.scopes.changes.of('hub:hub'), view.rows.pending(appsDir('more-apps'))];
        },
        left: [[{ file: 'sources.yml', key: 'apps_dir', reset: true }], true]
    },
    {
        name: 'apps_dir changed, the saved value reaching the view and typed back to while its Save is out',
        run: async () => {
            const view = bench(PRIMARY);
            view.rows.submit(appsDir('apps'), 'more-apps');
            await view.save(WRITTEN, () => {
                view.rows.submit(appsDir('more-apps'), 'other-apps');
                view.rows.submit(appsDir('more-apps'), 'more-apps');
            });
            return [view.scopes.changes.of('hub:hub'), view.rows.pending(appsDir('more-apps'))];
        },
        left: [[], false]
    },
    {
        name: 'apps_dir typed back while two Saves of its file are out, the second refused first',
        run: async () => {
            const view = bench(PRIMARY);
            view.rows.submit(appsDir('apps'), 'more-apps');
            const first = await view.start();
            view.rows.submit(appsDir('apps'), 'other-apps');
            const second = await view.start();
            view.rows.submit(appsDir('apps'), 'apps');
            view.answerAt(1, STALE_DIGEST);
            const refused = await second.saving;
            view.answerAt(0, WRITTEN);
            const landed = await first.saving;
            return [refused, landed, view.scopes.changes.of('hub:hub')];
        },
        left: [false, true, [{ file: 'sources.yml', key: 'apps_dir', value: 'apps' }]]
    },
    {
        name: "scout's stale_days of a family the file holds no key for, set back while its Save is out",
        run: async () => {
            const view = bench(PRIMARY);
            view.edit(inherited(TASKS), { do: 'set', index: 1, field: 'stale_days', value: '8' });
            await view.save(WRITTEN, () =>
                view.edit(inherited(TASKS), {
                    do: 'set',
                    index: 1,
                    field: 'stale_days',
                    value: '7'
                })
            );
            const held = view.scopes.changes.of('hub:hub');
            await view.save(WRITTEN);
            return [held, view.sent().at(-1)];
        },
        left: [
            [{ file: 'sources.yml', key: 'update_tasks', reset: true }],
            [{ file: 'sources.yml', key: 'update_tasks', reset: true }]
        ]
    },
    {
        name: "an app's setting changed and brought back to the one in force while its Save is out",
        run: async () => {
            const view = bench(PRIMARY);
            view.scopes.stageApp('reader.columns', { value: 3 });
            await view.save(WRITTEN, () => view.scopes.withdrawApp('reader.columns', { value: 2 }));
            return view.scopes.changes.of('hub:hub');
        },
        left: [{ app: 'reader.columns', value: 2 }]
    },
    {
        name: "the workspace's primary and a folder's name changed and brought back while their Save is out",
        run: async () => {
            const view = bench({ kind: 'workspace' });
            const workspace = fileOf({ kind: 'workspace' }, HUBS);
            view.scopes.stageWorkspace(PRIMARY_NAME, { primary: 'lab' });
            view.scopes.stageWorkspace(folderName('lab'), { folder: 'lab', name: 'lab-two' });
            await view.save(WRITTEN, () => {
                view.scopes.withdrawWorkspace(PRIMARY_NAME);
                view.scopes.withdrawWorkspace(folderName('lab'));
            });
            return view.scopes.changes.of(workspace);
        },
        left: [{ primary: 'hub' }, { folder: 'lab-two', name: 'lab' }]
    },
    {
        name: "scout's stale_days changed from 7 to 8 and discarded while its Save is out",
        run: async () => {
            const view = bench(PRIMARY);
            view.edit(tasks(TASKS), { do: 'set', index: 1, field: 'stale_days', value: '8' });
            await view.save(WRITTEN, () => view.writer.discard(tasks(TASKS)));
            const saved = view.saved();
            view.writer.pushed(tasks(TASKS));
            view.writer.pushed(tasks(saved));
            return [view.scopes.changes.of('hub:hub'), view.left(tasks(saved))];
        },
        left: [[], [0, false]]
    }
];

/** A record with its undefined fields taken out, as a draft reads back. */
function withoutUnset(record: Record<string, unknown>): Record<string, unknown> {
    return Object.fromEntries(Object.entries(record).filter(([, value]) => value !== undefined));
}

describe('a row whose Save lands', () => {
    it.each(LANDINGS)('$name', async ({ run, left }) => {
        expect(await run()).toEqual(left);
    });
});
