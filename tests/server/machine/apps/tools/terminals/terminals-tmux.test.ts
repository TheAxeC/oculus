// Layer 2, server test. The terminals an app's host makes through `oculus.window.createTerminal`
// (lib/server/machine/apps/tools/run/terminals.ts, terminals-env.ts) over the real runner and a
// private tmux server: a terminal made with a `shellPath` is a tmux terminal of the kind `app`
// that outlives its host and is told to the next one, a terminal made with a `Pseudoterminal` is a
// stream that follows the host, and disabling the app ends both. These are the terminal rows of
// G35, G75 and G77.
//
// Every tmux call carries the socket of a private server in a scratch directory
// (pty/tmux-server.ts), so the machine's own tmux is never listed, started or killed. What this
// does NOT cover: the page that draws the terminals (the Terminal tab's own suites).
// @module-tag slow: each case starts node processes and a tmux server.

import { spawnSync } from 'node:child_process';
import { describe, expect } from 'vitest';
import { runDeclared } from '../../../../../../src/lib/server/machine/apps/shell/commands.ts';
import { listTerminals } from '../../../../../../src/lib/server/machine/pty/sessions.ts';
import { it } from '../../../../../fixtures/scratch.ts';
import { world } from '../../world/hosts-world.ts';
import { tmuxTerminals } from '../../world/tmux-terminals.ts';

const NOTES = 'app:notes';

const HOST = `
export function activate(oculus) {
  const writer = new oculus.EventEmitter();
  const seen = { input: [], dims: [], opened: 0, closed: 0 };
  let sized = () => undefined;
  const ops = {
    shell: async () => {
      oculus.window.createTerminal({ name: 'App shell', shellPath: '/bin/sh' });
      return true;
    },
    pty: async () => {
      oculus.window.createTerminal({
        name: 'Echo',
        pty: {
          onDidWrite: writer.event,
          open: () => { seen.opened += 1; writer.fire('ready\\r\\n'); },
          close: () => { seen.closed += 1; },
          handleInput: (data) => { seen.input.push(data); writer.fire('echo:' + data); },
          setDimensions: (size) => { seen.dims.push([size.columns, size.rows]); sized(); }
        }
      });
      return true;
    },
    names: async () => oculus.window.terminals.map((one) => one.name),
    seen: async () => seen,
    sized: () => new Promise((resolve) => {
      if (seen.dims.length > 0) resolve(true);
      else sized = () => resolve(true);
    })
  };
  oculus.commands.registerCommand('notes.do', async (op) => ({ value: await ops[op]() }));
}
`;

const KEYS =
    'activation: [onTab]\ncontributes:\n  commands:\n    - command: notes.do\n      title: Do\n';

describe('the terminals of an app over a private tmux server', { tags: ['slow'] }, () => {
    const { options, build } = tmuxTerminals('oculus-appterm-');

    /** The terminals env over the private server, and the world its hosts run in. */
    function setup() {
        const { streams, terminals, env, until } = build();
        const w = world(
            { notes: { host: HOST, keys: KEYS } },
            {},
            {
                real: true,
                terminals: env,
                roots: { r: { 'a.txt': 'x\n' } }
            }
        );
        const call = async (op: string): Promise<unknown> => {
            const done = await runDeclared(w.hosts.shell, NOTES, 'notes.do', [op]);
            return done.ok ? (done.value as { value: unknown }).value : done.word;
        };
        const own = () => env.list().filter((one) => one.app === NOTES);
        return { w, env, streams, terminals, call, own, until };
    }

    it('lists a shellPath terminal and a Pseudoterminal as terminals of the app, with the typing, output and size each way', async () => {
        const s = setup();
        await s.call('shell');
        await s.call('pty');
        await s.until(() => s.own().length === 2);
        const [echo] = s.streams.list();
        await s.until(() => s.streams.replay(echo.id).length > 0);
        const echoed = new Promise<void>((resolve) =>
            s.streams.onOutput(() => {
                if (s.streams.replay(echo.id).toString('utf8').includes('echo:hi')) resolve();
            })
        );
        s.streams.input(echo.id, Buffer.from('hi'));
        s.streams.size(echo.id, {}, 100, 20);
        await s.call('sized');
        await echoed;
        const seen = (await s.call('seen')) as Record<string, unknown>;
        const listed = s.own().map((one) => `${one.kind} ${one.name} ${String(one.exit)}`);
        const output = s.streams.replay(echo.id).toString('utf8');
        const marked = spawnSync(
            'tmux',
            ['-S', options.socket, 'list-sessions', '-F', '#{@oculus_app}'],
            { encoding: 'utf8' }
        ).stdout.split('\n');
        await s.w.hosts.close();
        s.terminals.close();
        expect([marked.includes(NOTES), listed.sort(), seen.input, seen.dims, output]).toEqual([
            true,
            ['app App shell null', 'app Echo null'].sort(),
            ['hi'],
            [[100, 20]],
            'ready\r\necho:hi'
        ]);
    }, 60000);

    it('keeps the shellPath terminal when the host stops while the Pseudoterminal ends, and tells the next host of the first', async () => {
        const s = setup();
        await s.call('shell');
        await s.call('pty');
        await s.until(() => s.own().length === 2);
        await s.w.hosts.stop(NOTES);
        await s.until(() => s.streams.list().every((one) => one.exit !== null));
        const afterStop = (await listTerminals(options)).filter((one) => one.app === NOTES);
        const names = await s.call('names');
        await s.w.hosts.close();
        s.terminals.close();
        expect([afterStop.map((one) => one.name), names]).toEqual([['App shell'], ['App shell']]);
    }, 60000);

    it('ends both kinds of terminal when the app is disabled', async () => {
        const s = setup();
        await s.call('shell');
        await s.call('pty');
        await s.until(() => s.own().length === 2);
        s.w.disable(NOTES);
        await s.until(() => s.own().length === 0);
        const remaining = (await listTerminals(options)).filter((one) => one.app === NOTES);
        const left = s.own().length;
        await s.w.hosts.close();
        s.terminals.close();
        expect([left, remaining.length]).toEqual([0, 0]);
    }, 60000);
});
