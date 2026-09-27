// The notifications the channels and the writes post, through one case's own client: a message is
// handed to the entities store as the socket hands it, and what the notifications store holds
// afterwards is read. A session that starts waiting, a Live HPC job that ends and an update task
// whose run date moves on each post once, never again for the same state on a later message, and
// nothing for what the first message after the page loads already says; a write that does not
// land, refused or given no answer, posts once, unless its caller words it itself.
//
// What this does NOT cover: the toast, the bell and the centre drawing what is posted, which
// tests/browser/status/notices.spec.ts presses in Chrome.

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type {
    HpcPayload,
    SessionsPayload,
    Snapshot
} from '../../../../src/lib/data/model/index.ts';
import {
    createNoticeSources,
    jobFinished,
    waitingOf,
    waitsOnReader
} from '../../../../src/lib/state/workbench/navigation/notice-sources.ts';
import { createNotices } from '../../../../src/lib/state/workbench/navigation/notices.svelte.ts';
import { createWrites } from '../../../../src/lib/state/client/writes.svelte.ts';
import { engineDir, loadConfig, textCatalog } from '../../../../src/lib/data/sources/config.ts';
import { setCatalog, t } from '../../../../src/lib/state/shared/words/text.ts';
import { createClientState, type ClientState } from '../../../fixtures/client.ts';
import { fakeStorage } from '../layout/layout-fixture.ts';

setCatalog(textCatalog(loadConfig(engineDir()).config));

vi.mock('$app/navigation', () => ({ invalidateAll: vi.fn() }));

let client: ClientState;
let version = 0;

beforeEach(() => {
    client = createClientState();
    client.layout.loadLayout(fakeStorage());
    client.ui.loadUi({ getItem: () => null, setItem: () => undefined });
    version = 0;
});

afterEach(() => vi.unstubAllGlobals());

/** Hand the client one message of a channel, as the socket does. */
function receive(channel: string, payload: unknown): void {
    version += 1;
    client.entities.receive({ channel, version, payload });
}

/** The words of every notification posted, newest first. */
function said(): string[] {
    return client.notices.list().map((notice) => notice.message);
}

/** A sessions payload whose records carry these hooks, by session id. */
function sessions(...rows: [string, string | null, string][]): SessionsPayload {
    const records = rows.map(([id, kind, at]) => ({
        id,
        title: `Session ${id}`,
        hook: kind === null ? null : { session: id, event: 'notification', kind, at }
    }));
    return {
        records,
        workspaces: [{ areas: [{ sessions: records }] }]
    } as unknown as SessionsPayload;
}

/** A Live HPC payload whose ended jobs are these, each an id, a state and an exit code. */
function hpc(status: string, recent: [string, string, string][] = []): HpcPayload {
    return {
        status,
        jobs: [],
        recent: recent.map(([id, state, exit]) => ({ id, name: `job-${id}`, state, exit })),
        running: 0,
        pending: 0,
        total: 0
    } as unknown as HpcPayload;
}

/** A portfolio snapshot whose feed summary says when each task last ran. */
function portfolio(radar: string | null, scout: string | null, linkedin: string | null): Snapshot {
    return {
        entities: {
            feeds: {
                leads: null,
                radar: { lastRun: radar },
                scout: { lastRun: scout },
                linkedin: { lastPost: linkedin }
            }
        }
    } as unknown as Snapshot;
}

describe('a session that starts waiting', () => {
    it('is told once, with an Open that shows it, and not for what the first message said', () => {
        // revert: src/lib/state/workbench/navigation/notice-sources.ts "return first ? [] : [...new Set(fresh)];" => return [...new Set(fresh)];
        receive('sessions', sessions(['a', 'permission_prompt', '1']));
        expect(said()).toEqual([]);
        receive(
            'sessions',
            sessions(['a', 'permission_prompt', '1'], ['b', 'permission_prompt', '2'])
        );
        expect(said()).toEqual([t('statusbar.notice_permission', 'Session b')]);
        // The same state on the next push says nothing new.
        receive(
            'sessions',
            sessions(['a', 'permission_prompt', '1'], ['b', 'permission_prompt', '2'])
        );
        expect(said()).toHaveLength(1);
        // A session answered and asking again later is a new event.
        receive('sessions', sessions(['a', null, '1'], ['b', 'permission_prompt', '2']));
        receive(
            'sessions',
            sessions(['a', 'permission_prompt', '3'], ['b', 'permission_prompt', '2'])
        );
        expect(said()[0]).toBe(t('statusbar.notice_permission', 'Session a'));
        expect(said()).toHaveLength(2);
        expect(client.notices.list()[0].tone).toBe('warning');
        const open = client.notices.list()[0].actions[0];
        expect(open.label).toBe(t('statusbar.notice_open'));
        open.run();
        expect(client.layout.activeInstance()).toMatchObject({
            view: 'session-detail',
            state: { session: 'a', label: 'Session a' }
        });
    });

    it('is not told again when a state already told comes back', () => {
        // revert: src/lib/state/workbench/navigation/notice-sources.ts "for (const key of fresh) known.add(key);" => known.clear();
        receive('sessions', sessions());
        receive('sessions', sessions(['a', 'permission_prompt', '1']));
        receive('sessions', sessions());
        receive('sessions', sessions(['a', 'permission_prompt', '1']));
        expect(said()).toEqual([t('statusbar.notice_permission', 'Session a')]);
    });

    it('reads a permission prompt and an idle prompt as waiting, each as what it waits for, and the count the permission alone', () => {
        // revert: src/lib/state/workbench/navigation/notice-sources.ts "return hook?.event === 'notification' && hook.kind === 'permission_prompt';" => return hook?.event === 'notification';
        const rows: [string, string | null, string][] = [
            ['a', 'permission_prompt', '1'],
            ['b', 'idle_prompt', '1'],
            ['c', 'auth_success', '1'],
            ['d', null, '1']
        ];
        const read = waitingOf(sessions(...rows));
        expect(read.map((one) => [one.id, one.kind])).toEqual([
            ['a', 'permission'],
            ['b', 'idle']
        ]);
        expect(waitsOnReader({ session: 'x', event: 'stop', at: '1' })).toBe(false);
        expect(waitsOnReader(null)).toBe(false);
        // The count the window title reads holds the permission prompt alone.
        receive('sessions', sessions(...rows));
        expect(client.selectors.waitingCount()).toBe(1);
    });

    it('is told once when a session goes idle after its turn, worded as waiting for input, with an Open that shows it', () => {
        // revert: src/lib/state/workbench/navigation/notice-sources.ts "return hook?.event === 'notification' && hook.kind === 'idle_prompt' ? 'idle' : null;" => return null;
        // revert: src/lib/state/workbench/navigation/notice-sources.ts ": t('statusbar.notice_idle', one.title);" => : t('statusbar.notice_permission', one.title);
        receive('sessions', sessions(['a', null, '1']));
        receive('sessions', sessions(['a', 'idle_prompt', '2']));
        expect(said()).toEqual([t('statusbar.notice_idle', 'Session a')]);
        receive('sessions', sessions(['a', 'idle_prompt', '2']));
        expect(said()).toHaveLength(1);
        // Idle again after a later turn is a new event.
        receive('sessions', sessions(['a', null, '2']));
        receive('sessions', sessions(['a', 'idle_prompt', '5']));
        expect(said()).toEqual([
            t('statusbar.notice_idle', 'Session a'),
            t('statusbar.notice_idle', 'Session a')
        ]);
        client.notices.list()[0].actions[0].run();
        expect(client.layout.activeInstance()).toMatchObject({
            view: 'session-detail',
            state: { session: 'a' }
        });
    });
});

describe('a Live HPC job that ends', () => {
    it('is told once as it appears among the ended jobs, finished or failed, even across polls that failed', () => {
        // revert: src/lib/state/workbench/navigation/notice-sources.ts "for (const id of jobs(now.map((job) => job.id))) {" => for (const id of jobs(now.map((job) => job.id)).slice(1)) {
        receive('hpc', hpc('starting'));
        receive('hpc', hpc('ok', [['1', 'COMPLETED', '0:0']]));
        expect(said()).toEqual([]);
        receive(
            'hpc',
            hpc('ok', [
                ['2', 'COMPLETED', '0:0'],
                ['1', 'COMPLETED', '0:0']
            ])
        );
        expect(said()).toEqual([t('statusbar.notice_job_finished', 'job-2', '2')]);
        expect(client.notices.list()[0].tone).toBe('info');
        receive(
            'hpc',
            hpc('ok', [
                ['2', 'COMPLETED', '0:0'],
                ['1', 'COMPLETED', '0:0']
            ])
        );
        expect(said()).toHaveLength(1);
        // A poll the cluster did not answer lists no ended job, and is not read as all of them
        // leaving; the job ended after it is told, and the ones told before are not.
        receive('hpc', hpc('unreachable'));
        expect(said()).toHaveLength(1);
        receive(
            'hpc',
            hpc('ok', [
                ['3', 'FAILED', '1:0'],
                ['2', 'COMPLETED', '0:0']
            ])
        );
        expect(said()[0]).toBe(t('statusbar.notice_job_failed', 'job-3', '3', 'FAILED', '1:0'));
        expect(client.notices.list()[0].tone).toBe('error');
        expect(said()).toHaveLength(2);
        client.notices.list()[0].actions[0].run();
        expect(client.layout.activeInstance()?.view).toBe('hpc');
    });

    it('is not started by a poll the cluster did not answer', () => {
        // revert: src/lib/state/workbench/navigation/notice-sources.ts "if (payload.status !== 'ok') return;" => if (payload.status === 'starting') return;
        receive('hpc', hpc('error', []));
        receive('hpc', hpc('ok', [['1', 'COMPLETED', '0:0']]));
        expect(said()).toEqual([]);
    });

    it('reads COMPLETED with a zero exit as finished, and any other state or code as failed', () => {
        // revert: src/lib/state/workbench/navigation/notice-sources.ts "return job.state.trim() === 'COMPLETED' && (exit === '' || exit === '0:0');" => return job.state.trim() === 'COMPLETED';
        expect(jobFinished({ state: 'COMPLETED', exit: '0:0' })).toBe(true);
        expect(jobFinished({ state: 'COMPLETED', exit: '' })).toBe(true);
        expect(jobFinished({ state: 'COMPLETED', exit: '2:0' })).toBe(false);
        expect(jobFinished({ state: 'FAILED', exit: '1:0' })).toBe(false);
        expect(jobFinished({ state: 'TIMEOUT', exit: '0:0' })).toBe(false);
        expect(jobFinished({ state: 'CANCELLED by 123', exit: '0:15' })).toBe(false);
    });
});

describe('an update task whose results land', () => {
    it('is told once per run date, with an Open that shows that feed view', () => {
        // revert: src/lib/state/workbench/navigation/notice-sources.ts "actions: action(() => open.openView(TASK_VIEW[task]))" => actions: action(() => open.openView('hpc'))
        receive('portfolio', portfolio('2026-09-20', null, '2026-09-01'));
        receive('inbox', { notesRun: '2026-09-21' });
        expect(said()).toEqual([]);
        const views: string[] = [];
        const opened = (): string => client.layout.activeInstance()?.view ?? '';

        receive('portfolio', portfolio('2026-09-24', null, '2026-09-01'));
        expect(said()).toEqual([t('statusbar.notice_update', t('app.tasks.lit_label'))]);
        client.notices.list()[0].actions[0].run();
        views.push(opened());

        receive('portfolio', portfolio('2026-09-24', '2026-09-24', '2026-09-01'));
        expect(said()[0]).toBe(t('statusbar.notice_update', t('app.tasks.scout_label')));
        client.notices.list()[0].actions[0].run();
        views.push(opened());

        receive('portfolio', portfolio('2026-09-24', '2026-09-24', '2026-09-24'));
        expect(said()[0]).toBe(t('statusbar.notice_update', t('app.tasks.linkedin_label')));
        client.notices.list()[0].actions[0].run();
        views.push(opened());

        // The same dates again, on both channels, say nothing new.
        receive('portfolio', portfolio('2026-09-24', '2026-09-24', '2026-09-24'));
        receive('inbox', { notesRun: '2026-09-21' });
        expect(said()).toHaveLength(3);

        receive('inbox', { notesRun: '2026-09-24' });
        expect(said()[0]).toBe(t('statusbar.notice_update', t('app.tasks.inbox_label')));
        client.notices.list()[0].actions[0].run();
        views.push(opened());
        expect(views).toEqual(['radar', 'leads', 'linkedin', 'inbox']);
        expect(said()).toHaveLength(4);
    });

    it('says nothing when a run date goes, or comes back to one already told', () => {
        // revert: src/lib/state/workbench/navigation/notice-sources.ts "(runs[task] ?? '') === '' ? [] : [`${task}@${runs[task]}`]" => (runs[task] ?? '') === '' ? [`${task}@`] : [`${task}@${runs[task]}`]
        receive('portfolio', portfolio('2026-09-20', null, null));
        receive('portfolio', portfolio(null, null, null));
        receive('portfolio', portfolio('2026-09-20', null, null));
        expect(said()).toEqual([]);
    });
});

describe('a write that does not land', () => {
    it('is told once in the words the server gave, and not when its caller words it', async () => {
        // revert: src/lib/state/client/context.ts "writes.onUnwritten(sources.unwritten);" => delete
        vi.stubGlobal('fetch', () =>
            Promise.resolve(
                new Response(
                    JSON.stringify({
                        error: 'invalid',
                        refused: [{ field: 'rail', reason: 'button 1 has no label' }]
                    }),
                    { status: 400 }
                )
            )
        );
        await client.writes.writeEntry('venues', 'x', { title: 'X' });
        expect(said()).toEqual([t('statusbar.notice_write_refused', 'button 1 has no label')]);
        expect(client.notices.list()[0].tone).toBe('error');
        await client.writes.writeRail([], true);
        expect(said()).toHaveLength(1);
        vi.stubGlobal('fetch', () =>
            Promise.resolve(new Response('{"error":"moved"}', { status: 409 }))
        );
        await client.writes.writeEntry('venues', 'x', { title: 'X' });
        expect(said()[0]).toBe(t('statusbar.notice_write_refused', 'moved'));
        vi.stubGlobal('fetch', () => Promise.resolve(new Response('{"ok":true,"changed":[]}')));
        await client.writes.writeEntry('venues', 'x', { title: 'X' });
        expect(said()).toHaveLength(2);
    });

    it('is told when the server answers but refuses a field of it', async () => {
        // revert: src/lib/state/client/writes.svelte.ts "if (options.said === true || (answer.ok && answer.refused.length === 0)) return answer;" => if (options.said === true || answer.ok) return answer;
        vi.stubGlobal('fetch', () =>
            Promise.resolve(
                new Response(
                    JSON.stringify({
                        ok: true,
                        changed: [],
                        refused: [{ field: 'path', reason: 'outside the roots' }]
                    })
                )
            )
        );
        await client.writes.writeEntry('venues', 'x', { title: 'X' });
        expect(said()).toEqual([t('statusbar.notice_write_refused', 'outside the roots')]);
    });

    it('is told as a write that got no answer when the request never reached the server', async () => {
        // revert: src/lib/state/client/writes.svelte.ts "listener(reason, answered);" => listener(reason, true);
        vi.stubGlobal('fetch', () => Promise.reject(new Error('offline')));
        await client.writes.writeEntry('venues', 'x', { title: 'X' });
        expect(said()).toEqual([t('statusbar.notice_write_failed', 'offline')]);
    });

    it('is told once after the retry a stale token gets, not for the refusal that led to it', async () => {
        // revert: src/lib/state/client/writes.svelte.ts "return tell(await exchange(request, path), options);" => const sent = await exchange(request, path); tell(sent, options); return tell(sent, options);
        let calls = 0;
        vi.stubGlobal('fetch', () => {
            calls += 1;
            return Promise.resolve(new Response('{"error":"forbidden"}', { status: 403 }));
        });
        await client.writes.writeEntry('venues', 'x', { title: 'X' });
        expect(calls).toBe(2);
        expect(said()).toEqual([t('statusbar.notice_write_refused', 'forbidden')]);
    });

    it(
        'is told as a write that got no answer when it is given up for want of one',
        { timeout: 5000 },
        async () => {
            // revert: src/lib/state/client/writes.svelte.ts "answered: false," => answered: true,
            vi.stubGlobal(
                'fetch',
                (_url: string, init: RequestInit) =>
                    new Promise((_done, fail) => {
                        init.signal?.addEventListener('abort', () => fail(new Error('aborted')));
                    })
            );
            const notices = createNotices({ statusQuiet: () => false });
            const writes = createWrites(() => ({ writes: { timeout_seconds: 0.05 } }));
            const sources = createNoticeSources(notices, {
                openSession: () => undefined,
                openView: () => undefined
            });
            writes.onUnwritten(sources.unwritten);
            await writes.send({ action: 'set' });
            expect(notices.list().map((notice) => notice.message)).toEqual([
                t('statusbar.notice_write_failed', t('app.write_timed_out'))
            ]);
        }
    );
});
