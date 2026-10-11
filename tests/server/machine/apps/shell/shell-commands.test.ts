// Layer 4, server test. Running a command by its id for a host's `executeCommand`
// (lib/server/machine/apps/shell/commands.ts) over the registry of what the hosts registered
// (shell/registry.ts): the commands of oculus's own that a page runs and the ones closed to every
// app, the command of another app, a command nothing owns, `setContext`, and the command of an app
// that is disabled. These are the `executeCommand` rows of G77.
//
// The apps are synthetic and the hosts a double that registers the handler an app's `activate`
// would and answers the request. Nothing starts a process. What this does NOT cover: the process
// that runs a real host (the slow test in host-commands.test.ts) and the page that takes a request.

import { describe, expect, vi } from 'vitest';
import { Hub } from '../../../../../src/lib/server/core/channels.ts';
import { executeCommand } from '../../../../../src/lib/server/machine/apps/shell/commands.ts';
import {
    AppShell,
    type ShellHosts
} from '../../../../../src/lib/server/machine/apps/shell/registry.ts';
import type { AppsHeld } from '../../../../../src/lib/server/machine/apps/read/held.ts';
import { it } from '../../../../fixtures/scratch.ts';
import { approveAll, routeSetup } from '../../../../routes/apps/apps-fixture.ts';

const PAGE = '<!doctype html><title>a</title>\n';

/** The files of an app with a host that declares the commands given. */
function appFiles(name: string, commands: string[]): Record<string, string> {
    const declared = commands.map((one) => `    - command: ${one}\n      title: ${one}\n`).join('');
    const contributes = commands.length === 0 ? '' : `contributes:\n  commands:\n${declared}`;
    return {
        [`${name}/app.yml`]: `name: ${name}\ntitle: ${name}\nbridge: 1\nhost: host.mjs\n${contributes}`,
        [`${name}/index.html`]: PAGE,
        [`${name}/host.mjs`]: 'export function activate() {}\n'
    };
}

/** Both apps approved; `disable` marks the named ones disabled in what the registry holds. */
function world(disable: string[] = []) {
    const setup = routeSetup({
        machine: { ...appFiles('notes', ['notes.hello']), ...appFiles('other', ['other.cmd']) }
    });
    approveAll(setup);
    const read = setup.held();
    const held: AppsHeld = {
        ...read,
        apps: read.apps.map((one) =>
            disable.includes(one.row.name) ? { ...one, row: { ...one.row, disabled: true } } : one
        )
    };
    const started: string[] = [];
    const asked: unknown[] = [];
    const handler = { current: null as null | ((id: string) => void) };
    const hosts: ShellHosts = {
        request: vi.fn((_id, _method, params) => {
            asked.push(params);
            return Promise.resolve('ran');
        }),
        notify: vi.fn(),
        ensure: vi.fn((id: string) => {
            started.push(id);
            handler.current?.(id);
            return Promise.resolve(true);
        })
    };
    const shell = new AppShell({ hub: new Hub(), apps: { held: () => held }, hosts });
    const app = (name: string) => {
        const found = held.apps.find((one) => one.row.name === name);
        if (found === undefined) throw new Error(`no app ${name}`);
        return found;
    };
    handler.current = (id) =>
        shell.register(app(id.replace('app:', '')), 'command', 'other.cmd', {});
    return { shell, app, started, asked, hosts };
}

describe('executeCommand for the commands of oculus', () => {
    it('hands a page command to the first page that answers, which settles it once', async () => {
        const { shell, app } = world();
        const running = executeCommand(shell, app('notes'), 'oculus.theme', ['light']);
        const [request] = shell.payload().requests;
        expect(request).toMatchObject({
            kind: 'command',
            app: 'app:notes',
            command: 'oculus.theme',
            args: ['light'],
            target: ''
        });
        expect(shell.answer(request.id, { ok: true, value: null }, 'second')).toBe('ok');
        expect(shell.answer(request.id, { ok: false, word: 'refused:argument' }, 'first')).toBe(
            'missing'
        );
        expect(await running).toEqual({ ok: true, value: null });
        expect(shell.payload().requests).toEqual([]);
    });

    it.each(['oculus.update', 'oculus.folder', 'oculus.file-icons'])(
        'answers `closed` for %s and asks no page',
        async (id) => {
            const { shell, app } = world();
            expect(await executeCommand(shell, app('notes'), id, [])).toEqual({
                ok: false,
                word: 'closed'
            });
            expect(shell.payload().requests).toEqual([]);
        }
    );

    it('answers `missing` for a name of the namespace that is no command', async () => {
        const { shell, app } = world();
        expect(await executeCommand(shell, app('notes'), 'oculus.nope', [])).toEqual({
            ok: false,
            word: 'missing'
        });
    });
});

describe('executeCommand for the command of an app', () => {
    it('runs the command of another approved, enabled app through its host', async () => {
        const { shell, app, started, asked } = world();
        const done = await executeCommand(shell, app('notes'), 'other.cmd', [1]);
        expect(done).toEqual({ ok: true, value: 'ran' });
        expect(started).toEqual(['app:other']);
        expect(asked).toEqual([{ kind: 'command', id: 'other.cmd', args: [1] }]);
    });

    it('answers `missing` for a command no app owns and starts nothing', async () => {
        const { shell, app, started } = world();
        expect(await executeCommand(shell, app('notes'), 'nope', [])).toEqual({
            ok: false,
            word: 'missing'
        });
        expect(started).toEqual([]);
    });

    it('answers `missing` for the command of an app that is disabled and starts nothing', async () => {
        const { shell, app, started } = world(['other']);
        expect(await executeCommand(shell, app('notes'), 'other.cmd', [])).toEqual({
            ok: false,
            word: 'missing'
        });
        expect(started).toEqual([]);
    });
});

describe('setContext', () => {
    it('sets a key that starts with the name of the asking app and a dot', async () => {
        const { shell, app } = world();
        expect(
            await executeCommand(shell, app('notes'), 'setContext', ['notes.ready', true])
        ).toEqual({
            ok: true,
            value: null
        });
        expect([...shell.contextOf('app:notes')]).toEqual([['notes.ready', true]]);
    });

    it.each([
        ['a key of another app', ['other.ready', true], 'refused:context_key'],
        ['a key with no app name', ['ready', true], 'refused:context_key'],
        [
            'a value that is no text, number, boolean or null',
            ['notes.ready', { a: 1 }],
            'refused:value'
        ]
    ])('refuses %s', async (_row, args, word) => {
        const { shell, app } = world();
        expect(await executeCommand(shell, app('notes'), 'setContext', args)).toEqual({
            ok: false,
            word
        });
        expect([...shell.contextOf('app:notes')]).toEqual([]);
    });
});
