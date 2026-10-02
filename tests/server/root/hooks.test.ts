// lib/server/root/hooks.ts and lib/server/sessions/stores/hooks.ts: turning a hook body into an
// event, keeping it per session with an expiry, the AppleScript push (with execFile injected, so
// nothing runs a real osascript), and the whole endpoint's size refusal. No test here posts to a
// real server or touches ~/.claude, ~/.codex or ~/.oculus.

import { describe, expect, it, vi } from 'vitest';
import {
    RateLimiter,
    escapeAppleScript,
    handleHook,
    handleHookRequest,
    notify,
    notifyConfig,
    type ExecFile,
    type HookRequestTarget
} from '../../../src/lib/server/root/hooks.ts';
import {
    HookStore,
    mergeHooks,
    patchPayload,
    projects
} from '../../../src/lib/server/sessions/stores/hooks.ts';
import type { HubLike } from '../../../src/lib/server/sessions/stores/hooks.ts';
import type {
    HookEvent,
    SessionRecord,
    SessionsPayload
} from '../../../src/lib/data/model/index.ts';
import { record } from '../../fixtures/sessions-fixture.ts';
import { noop } from '../../fixtures/doubles.ts';

const NOW = Date.parse('2026-09-11T10:00:00.000Z');

describe('handleHook', () => {
    it('turns a Notification body into an event with every field', () => {
        const body = {
            hook_event_name: 'Notification',
            session_id: 's1',
            cwd: '/ws/project',
            transcript_path: '/x.jsonl',
            message: 'Claude wants your permission',
            title: 'Permission needed',
            notification_type: 'permission_prompt'
        };
        expect(handleHook(body, NOW)).toEqual({
            session: 's1',
            event: 'notification',
            kind: 'permission_prompt',
            message: 'Claude wants your permission',
            title: 'Permission needed',
            cwd: '/ws/project',
            at: new Date(NOW).toISOString()
        });
    });

    it('turns a Stop body into an event with no kind', () => {
        const body = { hook_event_name: 'Stop', session_id: 's1', stop_hook_active: false };
        expect(handleHook(body, NOW)).toEqual({
            session: 's1',
            event: 'stop',
            at: new Date(NOW).toISOString()
        });
    });

    it('accepts a body missing everything but the event name and the session id, with nulls', () => {
        const body = { hook_event_name: 'Stop', session_id: 's1' };
        const event = handleHook(body, NOW);
        expect(event).toEqual({ session: 's1', event: 'stop', at: new Date(NOW).toISOString() });
        expect(event?.kind).toBeUndefined();
        expect(event?.message).toBeUndefined();
    });

    it('answers null for a hook_event_name this route does not know', () => {
        expect(handleHook({ hook_event_name: 'SessionStart', session_id: 's1' }, NOW)).toBeNull();
    });

    it('answers null for a body with no session_id', () => {
        expect(handleHook({ hook_event_name: 'Stop' }, NOW)).toBeNull();
    });

    it('answers null for a body that is not an object', () => {
        expect(handleHook('not an object', NOW)).toBeNull();
        expect(handleHook(null, NOW)).toBeNull();
    });
});

describe('handleHook, fields and refusals', () => {
    const named = { hook_event_name: 'Stop', session_id: 'a' };

    it('answers null for a body that is not an object or holds no usable name and session', () => {
        const refused: unknown[] = [
            null,
            [],
            's',
            3,
            {},
            { ...named, session_id: '' },
            { ...named, session_id: 5 },
            { ...named, hook_event_name: 3 },
            { ...named, hook_event_name: 'toString' },
            JSON.parse('{"__proto__":{"hook_event_name":"Stop","session_id":"a"}}')
        ];
        for (const body of refused) {
            expect(handleHook(body, NOW), JSON.stringify(body)).toBeNull();
        }
    });

    it('drops a field of the wrong type or empty and leaves its key absent', () => {
        const at = new Date(NOW).toISOString();
        const event = handleHook(
            {
                hook_event_name: 'Notification',
                session_id: 'a',
                notification_type: 'idle_prompt',
                message: 'm',
                title: '',
                cwd: 7,
                extra: { x: 1 }
            },
            NOW
        );
        expect(event).toStrictEqual({
            session: 'a',
            event: 'notification',
            at,
            kind: 'idle_prompt',
            message: 'm'
        });
        expect(Object.keys(event ?? {})).not.toContain('title');
        expect(Object.keys(event ?? {})).not.toContain('cwd');
    });

    it('keeps a blank string as a value and drops only the empty one', () => {
        const event = handleHook(
            { hook_event_name: 'Stop', session_id: 'a', message: null, title: ' ' },
            NOW
        );
        expect(event).toStrictEqual({
            session: 'a',
            event: 'stop',
            at: new Date(NOW).toISOString(),
            title: ' '
        });
        expect(handleHook({ ...named, session_id: ' ' }, NOW)?.session).toBe(' ');
    });

    it('leaves the key of a list or a map field absent', () => {
        const event = handleHook({ ...named, message: ['m'], cwd: {} }, NOW);
        expect(Object.keys(event ?? {}).sort()).toEqual(['at', 'event', 'session']);
    });
});

describe('HookStore', () => {
    it('keeps the latest event per session and lets an older one expire', () => {
        const store = new HookStore();
        const event: HookEvent = { session: 's1', event: 'stop', at: new Date(NOW).toISOString() };
        store.record(event);
        expect(store.latest('s1', NOW)).toEqual(event);
        expect(store.latest('s1', NOW + 23 * 60 * 60 * 1000)).toEqual(event);
        expect(store.latest('s1', NOW + 25 * 60 * 60 * 1000)).toBeNull();
        expect(store.latest('s2', NOW)).toBeNull();
    });

    it("replaces a session's event with its newest", () => {
        const store = new HookStore();
        store.record({ session: 's1', event: 'stop', at: new Date(NOW).toISOString() });
        const second: HookEvent = {
            session: 's1',
            event: 'notification',
            kind: 'idle_prompt',
            at: new Date(NOW + 1000).toISOString()
        };
        store.record(second);
        expect(store.latest('s1', NOW + 1000)).toEqual(second);
    });

    it('pushes once per quiet window, then again once it has closed', () => {
        const store = new HookStore();
        const event: HookEvent = {
            session: 's1',
            event: 'notification',
            kind: 'permission_prompt',
            at: new Date(NOW).toISOString()
        };
        expect(store.duePush(event, NOW, 3)).toBe(true);
        expect(store.duePush(event, NOW + 1000, 3)).toBe(false);
        expect(store.duePush(event, NOW + 3100, 3)).toBe(true);
    });

    it('tracks the quiet window per session and per kind, not globally', () => {
        const store = new HookStore();
        const first: HookEvent = {
            session: 's1',
            event: 'notification',
            kind: 'permission_prompt',
            at: new Date(NOW).toISOString()
        };
        const other: HookEvent = {
            session: 's2',
            event: 'notification',
            kind: 'permission_prompt',
            at: new Date(NOW).toISOString()
        };
        expect(store.duePush(first, NOW, 3)).toBe(true);
        expect(store.duePush(other, NOW, 3)).toBe(true);
    });
});

describe('mergeHooks', () => {
    it('sets hook from the store, and null for a session the store has nothing for', () => {
        const store = new HookStore();
        const event: HookEvent = { session: 's1', event: 'stop', at: new Date(NOW).toISOString() };
        store.record(event);
        const records = [record('s1'), record('s2')] as unknown as SessionRecord[];
        const merged = mergeHooks(records, store, NOW);
        expect(merged.find((one) => one.id === 's1')?.hook).toEqual(event);
        expect(merged.find((one) => one.id === 's2')?.hook).toBeNull();
    });
});

describe('patchPayload', () => {
    it("replaces one record's hook and leaves every other record's object the same", () => {
        const a = record('a') as SessionRecord;
        const b = record('b') as SessionRecord;
        const payload: SessionsPayload = { records: [a, b], workspaces: [], terminals: [] };
        const event: HookEvent = { session: 'a', event: 'stop', at: new Date(NOW).toISOString() };
        const patched = patchPayload(payload, event);
        expect(patched.records.find((one) => one.id === 'a')?.hook).toEqual(event);
        expect(patched.records.find((one) => one.id === 'b')).toBe(b);
    });

    it('marks a live record idle on a Stop, and leaves an ended one as it was', () => {
        const live = { ...record('a'), live: true, state: 'working' } as SessionRecord;
        const ended = { ...record('b'), live: false, state: 'ended' } as SessionRecord;
        const payload: SessionsPayload = { records: [live, ended], workspaces: [], terminals: [] };
        const at = new Date(NOW).toISOString();
        const onLive = patchPayload(payload, { session: 'a', event: 'stop', at });
        expect(onLive.records.find((one) => one.id === 'a')?.state).toBe('idle');
        const onEnded = patchPayload(payload, { session: 'b', event: 'stop', at });
        expect(onEnded.records.find((one) => one.id === 'b')?.state).toBe('ended');
        const prompt = patchPayload(payload, {
            session: 'a',
            event: 'notification',
            kind: 'permission_prompt',
            at
        });
        expect(prompt.records.find((one) => one.id === 'a')?.state).toBe('working');
    });

    it("leaves the payload untouched when it holds no record for the event's session", () => {
        const a = record('a') as SessionRecord;
        const payload: SessionsPayload = { records: [a], workspaces: [], terminals: [] };
        const event: HookEvent = {
            session: 'gone',
            event: 'stop',
            at: new Date(NOW).toISOString()
        };
        expect(patchPayload(payload, event)).toBe(payload);
    });
});

describe('escapeAppleScript', () => {
    it('escapes a double quote and a backslash', () => {
        expect(escapeAppleScript('say "hi" \\ bye')).toBe('say \\"hi\\" \\\\ bye');
    });
});

/** A stub matching ExecFile that records every call and answers success at once. */
function recordingExec(): { exec: ExecFile; calls: { file: string; args: string[] }[] } {
    const calls: { file: string; args: string[] }[] = [];
    const exec: ExecFile = (file, args, _options, callback) => {
        calls.push({ file, args });
        callback(null);
    };
    return { exec, calls };
}

describe('notify', () => {
    it('runs osascript with a display notification script and never throws', () => {
        const { exec, calls } = recordingExec();
        const event: HookEvent = {
            session: 's1',
            event: 'notification',
            kind: 'permission_prompt',
            message: 'needs your "yes"',
            cwd: '/ws/project',
            at: new Date(NOW).toISOString()
        };
        notify(event, null, 'Session finished', exec);
        expect(calls).toHaveLength(1);
        expect(calls[0].file).toBe('/usr/bin/osascript');
        expect(calls[0].args[0]).toBe('-e');
        expect(calls[0].args[1]).toContain('display notification');
        expect(calls[0].args[1]).toContain('needs your \\"yes\\"');
        expect(calls[0].args[1]).toContain('subtitle "project"');
    });

    it("uses the record's title over the cwd basename when one is known", () => {
        const { exec, calls } = recordingExec();
        const event: HookEvent = {
            session: 's1',
            event: 'stop',
            cwd: '/ws/project',
            at: new Date(NOW).toISOString()
        };
        const known = record('s1', { title: 'A real title' }) as SessionRecord;
        notify(event, known, 'Session finished', exec);
        expect(calls[0].args[1]).toContain('subtitle "A real title"');
        expect(calls[0].args[1]).toContain('display notification "Session finished"');
    });

    it('writes one stderr line and does not throw when the process fails', () => {
        const stderr = vi.spyOn(console, 'error').mockImplementation(noop);
        const failing: ExecFile = (_file, _args, _options, callback) =>
            callback(new Error('no such binary'));
        const event: HookEvent = { session: 's1', event: 'stop', at: new Date(NOW).toISOString() };
        expect(() => notify(event, null, 'Session finished', failing)).not.toThrow();
        expect(stderr).toHaveBeenCalledTimes(1);
        stderr.mockRestore();
    });
});

describe('notifyConfig', () => {
    it("reads enabled, events and quiet_seconds from behavior.yml's notify key", () => {
        const config = { notify: { enabled: false, events: ['stop'], quiet_seconds: 9 } };
        expect(notifyConfig(config)).toEqual({ enabled: false, events: ['stop'], quietSeconds: 9 });
    });

    it('answers the default when the key is absent or malformed', () => {
        expect(notifyConfig({})).toEqual({
            enabled: true,
            events: ['permission_prompt', 'idle_prompt', 'stop'],
            quietSeconds: 3
        });
        expect(notifyConfig({ notify: 'nonsense' })).toEqual({
            enabled: true,
            events: ['permission_prompt', 'idle_prompt', 'stop'],
            quietSeconds: 3
        });
    });
});

describe('notifyConfig, the values it takes and drops', () => {
    const DEFAULT = {
        enabled: true,
        events: ['permission_prompt', 'idle_prompt', 'stop'],
        quietSeconds: 3
    };

    it('answers the default for a notify value that is no map', () => {
        for (const config of [{}, { notify: null }, { notify: [] }, { notify: 's' }]) {
            expect(notifyConfig(config)).toStrictEqual(DEFAULT);
        }
        expect(notifyConfig({ notify: {} })).toStrictEqual(DEFAULT);
    });

    it('takes the default for a field of the wrong type and keeps the others', () => {
        expect(notifyConfig({ notify: { enabled: 'no' } }).enabled).toBe(true);
        expect(notifyConfig({ notify: { events: ['a', 1, null, 'b'] } }).events).toEqual([
            'a',
            'b'
        ]);
        expect(notifyConfig({ notify: { events: 'a' } }).events).toEqual(DEFAULT.events);
        expect(notifyConfig({ notify: { events: [] } }).events).toEqual([]);
        expect(notifyConfig({ notify: { enabled: false, quiet_seconds: 'x' } })).toStrictEqual({
            ...DEFAULT,
            enabled: false
        });
    });

    it('reads quiet_seconds from zero up, infinity included, and refuses the rest', () => {
        const seconds = (value: unknown): number =>
            notifyConfig({ notify: { quiet_seconds: value } }).quietSeconds;
        expect(seconds(0)).toBe(0);
        expect(seconds(2.5)).toBe(2.5);
        expect(seconds(Infinity)).toBe(Infinity);
        expect(seconds(2 ** 60)).toBe(2 ** 60);
        expect(seconds(-1)).toBe(3);
        expect(seconds('4')).toBe(3);
        expect(seconds(Number.NaN)).toBe(3);
        expect(seconds(-Infinity)).toBe(3);
        expect(Object.is(seconds(-0), -0)).toBe(true);
    });

    it('answers exactly the three fields of a notify map with more keys', () => {
        const held = notifyConfig({
            notify: { enabled: false, events: ['x'], quiet_seconds: 9, other: 1 }
        });
        expect(held).toStrictEqual({ enabled: false, events: ['x'], quietSeconds: 9 });
    });
});

function target(over: Partial<HookRequestTarget> = {}): HookRequestTarget {
    return {
        store: new HookStore(),
        hub: null,
        limiter: new RateLimiter(),
        logged: new Set<string>(),
        config: {
            enabled: true,
            events: ['permission_prompt', 'idle_prompt', 'stop'],
            quietSeconds: 3
        },
        now: () => NOW,
        ...over
    };
}

function request(body: string, headers: Record<string, string> = {}): Request {
    return new Request('http://127.0.0.1:8791/api/hook', {
        method: 'POST',
        headers: { 'content-type': 'application/json', ...headers },
        body
    });
}

describe('handleHookRequest, the size refusal', () => {
    it('refuses a body over 64 KB', async () => {
        const huge = JSON.stringify({
            hook_event_name: 'Stop',
            session_id: 's1',
            message: 'x'.repeat(70 * 1024)
        });
        const response = await handleHookRequest(request(huge), target());
        expect(response.status).toBe(413);
    });

    it('accepts a body well under 64 KB', async () => {
        const body = JSON.stringify({ hook_event_name: 'Stop', session_id: 's1' });
        const response = await handleHookRequest(request(body), target());
        expect(response.status).toBe(200);
    });
});

describe('handleHookRequest, the event filter', () => {
    it("does not push when the event's kind is not in config.events", async () => {
        const { exec, calls } = recordingExec();
        const body = JSON.stringify({
            hook_event_name: 'Notification',
            session_id: 's1',
            notification_type: 'other_kind',
            message: 'hi'
        });
        const response = await handleHookRequest(
            request(body),
            target({ exec, config: { enabled: true, events: ['stop'], quietSeconds: 3 } })
        );
        expect(response.status).toBe(200);
        expect(calls).toHaveLength(0);
    });

    it("pushes when the event's kind is in config.events", async () => {
        const { exec, calls } = recordingExec();
        const body = JSON.stringify({
            hook_event_name: 'Notification',
            session_id: 's1',
            notification_type: 'permission_prompt',
            message: 'hi'
        });
        const response = await handleHookRequest(request(body), target({ exec }));
        expect(response.status).toBe(200);
        expect(calls).toHaveLength(1);
    });

    it('does not push at all when notify.enabled is false', async () => {
        const { exec, calls } = recordingExec();
        const body = JSON.stringify({
            hook_event_name: 'Notification',
            session_id: 's1',
            notification_type: 'permission_prompt',
            message: 'hi'
        });
        const response = await handleHookRequest(
            request(body),
            target({
                exec,
                config: { enabled: false, events: ['permission_prompt'], quietSeconds: 3 }
            })
        );
        expect(response.status).toBe(200);
        expect(calls).toHaveLength(0);
    });
});

describe('handleHookRequest, the first payload of each name', () => {
    it('logs the first body of a name as it was sent and never the second', async () => {
        const stderr = vi.spyOn(console, 'error').mockImplementation(noop);
        const sent = '{"hook_event_name":"SessionStart","session_id":"a","transcript_path":"/x"}';
        const into = target();
        const first = await handleHookRequest(request(sent), into);
        const second = await handleHookRequest(request(sent), into);
        expect(first.status).toBe(200);
        expect(second.status).toBe(200);
        expect(into.store.latest('a', NOW)).toBeNull();
        expect(stderr).toHaveBeenCalledTimes(1);
        expect(stderr).toHaveBeenCalledWith(`hooks: first SessionStart payload: ${sent}`);
        stderr.mockRestore();
    });

    it('logs a name once per name and with every key the body holds', async () => {
        const stderr = vi.spyOn(console, 'error').mockImplementation(noop);
        const into = target();
        await handleHookRequest(
            request('{"hook_event_name":"Stop","session_id":"a","stop_hook_active":true}'),
            into
        );
        expect(stderr).toHaveBeenCalledWith(
            'hooks: first Stop payload: {"hook_event_name":"Stop","session_id":"a","stop_hook_active":true}'
        );
        stderr.mockRestore();
    });

    it('logs nothing for a body without a usable name, and answers 200', async () => {
        const stderr = vi.spyOn(console, 'error').mockImplementation(noop);
        for (const body of [
            '[]',
            'null',
            '3',
            '{}',
            '{"hook_event_name":""}',
            '{"hook_event_name":3}',
            '',
            'not json'
        ]) {
            const response = await handleHookRequest(request(body), target());
            expect(response.status, body).toBe(200);
        }
        expect(stderr).not.toHaveBeenCalled();
        stderr.mockRestore();
    });
});

/** A stand-in for the process's Hub: whatever a channel was last published with. */
function hub(payloads: Record<string, unknown>): HubLike {
    return {
        latest: (channel: string) =>
            channel in payloads ? { payload: payloads[channel] } : undefined,
        publish: () => 0
    };
}

describe('projects', () => {
    it('answers every project of the last published portfolio', () => {
        const alpha = { id: 'alpha', title: 'Alpha' };
        const beta = { id: 'beta', title: 'Beta' };
        const held = hub({ portfolio: { entities: { projects: { alpha, beta } } } });
        expect(projects(held).map((one) => one.id)).toEqual(['alpha', 'beta']);
    });

    it('answers none when nothing has been published, and drops what is not a project', () => {
        expect(projects(hub({}))).toEqual([]);
        expect(projects(hub({ portfolio: { entities: {} } }))).toEqual([]);
        expect(projects(hub({ portfolio: 'not a payload' }))).toEqual([]);
        const odd = hub({ portfolio: { entities: { projects: { a: 1, b: { id: 'b' } } } } });
        expect(projects(odd).map((one) => one.id)).toEqual(['b']);
    });
});
