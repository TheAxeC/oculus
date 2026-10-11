// Layer 2, client state test. The questions and notices around managing an app
// (lib/state/system/apps/flows.ts) over the calls of manage.ts: which choices an app's menu
// offers, the question a disable or a remove asks before it goes ahead, and what adding a folder
// says. The calls to the server are a double that answers as the routes answer
// (tests/routes/apps/app-manage.test.ts).
//
// What this does NOT cover: the menu and the confirm dialog that draw these, and the folder panel.

import { describe, expect, vi } from 'vitest';
import type { AppRow } from '../../../../src/lib/data/model/index.ts';
import type { Posted } from '../../../../src/lib/state/shared/stores/shapes.ts';
import { t } from '../../../../src/lib/state/shared/words/text.ts';
import { createFlows } from '../../../../src/lib/state/system/apps/flows.ts';
import { createManage } from '../../../../src/lib/state/system/apps/manage.ts';
import { fixtureApp } from '../../../fixtures/entities-fixture.ts';
import { it } from '../../../fixtures/scratch.ts';
import { installRealText } from '../../../views/shared/real-text.ts';

installRealText();

/** The question the flows hand to the page's `ask`. */
type AppAsk = Parameters<Parameters<ReturnType<typeof createFlows>['pick']>[2]>[0];

const answer = (body: Record<string, unknown>, ok = true): Posted => ({
    ok,
    status: ok ? 200 : 409,
    body,
    failed: ''
});

/** Flows over a post that answers by the path and body of each call. */
function flows(rows: AppRow[], reply: (path: string, body: Record<string, unknown>) => Posted) {
    const calls: [string, Record<string, unknown>][] = [];
    const waiting: [number, () => void][] = [];
    const post = vi.fn((path: string, body: unknown) => {
        calls.push([path, body as Record<string, unknown>]);
        const posted = Promise.resolve(reply(path, body as Record<string, unknown>));
        return posted.finally(() => {
            for (const [count, release] of waiting) if (calls.length >= count) release();
        });
    });
    const notices: [string, unknown][] = [];
    const noticing: [number, () => void][] = [];
    /** Resolves once the calls made reach this count and the last one has been answered. */
    const reached = (count: number): Promise<void> =>
        new Promise((release) => {
            if (calls.length >= count) release();
            else waiting.push([count, release]);
        });
    /** Resolves once the notices posted reach this count. */
    const noticed = (count: number): Promise<void> =>
        new Promise((release) => {
            if (notices.length >= count) release();
            else noticing.push([count, release]);
        });
    const store = createFlows({
        manage: createManage(post),
        rowOf: (id) => rows.find((one) => `app:${one.name}` === id),
        post,
        notices: {
            post: (message, options) => {
                notices.push([message, options]);
                for (const [count, release] of noticing) if (notices.length >= count) release();
            }
        }
    });
    return { store, calls, notices, reached, noticed };
}

const NOTES = fixtureApp({ name: 'notes', title: 'Notes' });

describe('offers the choices an app allows and asks before a disable or a removal that reaches more', () => {
    it.each([
        ['an enabled machine app', NOTES, ['disable', 'disable-workspace', 'remove']],
        [
            'a machine app disabled machine-wide',
            fixtureApp({ disabled: true, machineDisabled: true }),
            ['enable', 'enable-workspace', 'remove']
        ],
        [
            'a machine app disabled in this workspace only',
            fixtureApp({ disabled: true, workspaceState: 'disabled' }),
            ['disable', 'enable-workspace', 'remove']
        ],
        [
            'a root app, which has no Remove',
            fixtureApp({ root: 'one' }),
            ['disable', 'disable-workspace']
        ]
    ] as [string, AppRow, string[]][])('offers %s: %j', (_row, row, ids) => {
        const { store } = flows([row], () => answer({}));
        expect(store.choices(row).map((one) => one.id)).toEqual(ids);
    });

    it('disables at once when nothing depends on the app and asks nothing', async () => {
        const { store, calls } = flows([NOTES], () => answer({}));
        const asked: AppAsk[] = [];
        await store.pick('app:notes', 'disable', (question) => asked.push(question));
        expect([asked.length, calls]).toEqual([
            0,
            [['/api/app-manage', { action: 'disable', view: 'app:notes' }]]
        ]);
    });

    it('asks naming the apps that depend on it, and sends the request again with cascade on yes only', async () => {
        const { store, calls, reached } = flows([NOTES], (_path, body) =>
            body.cascade === true
                ? answer({})
                : answer({ error: 'dependents', dependents: ['Todo', 'Mail'] }, false)
        );
        const asked: AppAsk[] = [];
        await store.pick('app:notes', 'disable-workspace', (question) => asked.push(question));
        const before = calls.length;
        asked[0].act();
        await reached(before + 1);
        expect({
            message: asked[0].message,
            before,
            again: calls.at(-1)?.[1]
        }).toEqual({
            message: t('apps.disable_dependents', 'Notes', 'Todo, Mail'),
            before: 1,
            again: { action: 'disable', view: 'app:notes', workspace: true, cascade: true }
        });
    });

    it('says how many secrets a removal deletes and what it moves to the Trash', async () => {
        const { store } = flows([NOTES], () =>
            answer({ ok: true, folder: '/apps/notes', secrets: 2, dependents: [] })
        );
        const asked: AppAsk[] = [];
        await store.pick('app:notes', 'remove', (question) => asked.push(question));
        expect([asked[0].message, asked[0].detail, asked[0].confirm]).toEqual([
            t('apps.remove_question', 'Notes'),
            t('apps.remove_secrets', '/apps/notes', '2'),
            t('apps.remove_confirm')
        ]);
    });

    it('says the secrets could not be counted when the keyring cannot be read, and still asks', async () => {
        const { store } = flows([NOTES], () =>
            answer({ ok: true, folder: '/apps/notes', secrets: null, dependents: [] })
        );
        const asked: AppAsk[] = [];
        await store.pick('app:notes', 'remove', (question) => asked.push(question));
        expect(asked[0].detail).toBe(t('apps.remove_secrets_unknown', '/apps/notes'));
    });

    it('removes with cascade when the question named dependents and the reader said yes, and sends nothing on no', async () => {
        const { store, calls, reached } = flows([NOTES], (_path, body) =>
            body.action === 'inspect'
                ? answer({ ok: true, folder: '/f', secrets: 0, dependents: ['Todo'] })
                : answer({ ok: true })
        );
        const asked: AppAsk[] = [];
        await store.pick('app:notes', 'remove', (question) => asked.push(question));
        const asking = calls.length;
        asked[0].act();
        await reached(asking + 1);
        expect([asked[0].detail.includes('Todo'), calls.at(-1)]).toEqual([
            true,
            ['/api/app-manage', { action: 'remove', view: 'app:notes', cascade: true }]
        ]);
        expect(asking).toBe(1);
    });

    it('tells the reader when the secrets of a removed app could not be deleted', async () => {
        const { store, notices, noticed } = flows([NOTES], (_path, body) =>
            body.action === 'inspect'
                ? answer({ ok: true, folder: '/f', secrets: 1, dependents: [] })
                : answer({ ok: true, secretsKept: true })
        );
        const asked: AppAsk[] = [];
        await store.pick('app:notes', 'remove', (question) => asked.push(question));
        asked[0].act();
        await noticed(1);
        expect(notices).toEqual([[t('apps.remove_secrets_kept', 'Notes'), { tone: 'error' }]]);
    });
});

describe('adds an app from a folder the reader chose, and says why when it cannot', () => {
    it('says the panel is not available, naming Add as App, and copies nothing', async () => {
        const { store, calls, notices } = flows([], (path) =>
            path === '/api/folders/pick' ? answer({ error: 'unsupported' }, false) : answer({})
        );
        await store.addFromPanel();
        expect([calls.map((one) => one[0]), notices]).toEqual([
            ['/api/folders/pick'],
            [[t('apps.add_unsupported'), { tone: 'error' }]]
        ]);
        expect(t('apps.add_unsupported')).toContain('Add as App');
    });

    it('sends the folder the panel returned to app-add and names the app that was added', async () => {
        const { store, calls, notices } = flows([], (path) =>
            path === '/api/folders/pick'
                ? answer({ ok: true, paths: ['/home/me/notes'] })
                : answer({ ok: true, name: 'notes' })
        );
        await store.addFromPanel();
        expect([calls.at(-1), notices]).toEqual([
            ['/api/app-add', { path: '/home/me/notes' }],
            [[t('apps.add_done', 'notes'), undefined]]
        ]);
    });

    it.each([
        ['no_manifest', 'apps.add_no_manifest'],
        ['name', 'apps.add_name'],
        ['exists', 'apps.add_exists'],
        ['too_large', 'apps.add_too_large']
    ])('says the sentence of %s when the server refuses the folder', async (word, key) => {
        const { store, notices } = flows([], () => answer({ error: word }, false));
        await store.addPath('/home/me/notes');
        expect(notices).toEqual([[t('apps.add_failed', t(key)), { tone: 'error' }]]);
    });
});
