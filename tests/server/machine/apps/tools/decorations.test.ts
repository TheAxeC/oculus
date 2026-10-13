// Layer 2, server test. The file decorations of the apps' hosts (lib/server/machine/apps/tools/
// decorations.ts, runner/tools/decorations.mjs) over the real runner: the providers of one host and
// of two apps are joined for a file, a badge of more than two characters is dropped with a line in
// the host's output, a late provider names its file as changed when it answers, a file outside the
// scope of an app is not asked of it, and a burst of change events is told as one message. These
// are the decoration rows of G77 and G2.
//
// Every folder is synthetic, under the system temporary directory. What this does NOT cover: the
// Files view that draws the badges (tests/state/system/apps-tools/).
// @module-tag slow: each case starts node processes.

import { describe, expect, vi } from 'vitest';
import { runDeclared } from '../../../../../src/lib/server/machine/apps/shell/commands.ts';
import { it } from '../../../../fixtures/scratch.ts';
import { asRootApp } from '../world/language-app.ts';
import { world, type AppSpec } from '../world/hosts-world.ts';

/**
 * The manifest keys of an app `name`: a command firing change events, one firing all, and one
 * releasing the provider's answer for `slow.txt`.
 */
const keysOf = (name: string): string => `activation: [onTab]
contributes:
  commands:
    - command: ${name}.fire
      title: Fire
    - command: ${name}.fireAll
      title: Fire all
    - command: ${name}.release
      title: Release
`;

/** A host that decorates `m.txt` with badge, tooltip and colour, and a few other files. */
function decorating(name: string, badge: string): AppSpec {
    return {
        keys: keysOf(name),
        host: `
export function activate(oculus) {
  const changed = new oculus.EventEmitter();
  let release;
  const gate = new Promise((resolve) => { release = resolve; });
  oculus.window.registerFileDecorationProvider({
    onDidChangeFileDecorations: changed.event,
    provideFileDecoration: async (uri) => {
      const name = uri.path.split('/').pop();
      if (name === 'm.txt') {
        return {
          badge: '${badge}',
          tooltip: 'tip ${badge}',
          color: new oculus.ThemeColor('gitDecoration.modifiedResourceForeground'),
          propagate: true
        };
      }
      if (name === 'long.txt') return { badge: 'ABC' };
      if (name === 'throws.txt') throw new Error('provider failed');
      if (name === 'slow.txt') {
        await gate;
        return { badge: 'S' };
      }
      return undefined;
    }
  });
  oculus.commands.registerCommand('${name}.fire', (count) => {
    for (let at = 0; at < count; at += 1) changed.fire(oculus.Uri.joinPath(oculus.workspace.workspaceFolders[0].uri, 'f' + at + '.txt'));
    return { value: count };
  });
  oculus.commands.registerCommand('${name}.release', () => {
    release();
    return { value: true };
  });
  oculus.commands.registerCommand('${name}.fireAll', () => {
    changed.fire(undefined);
    return { value: true };
  });
}
`
    };
}

const FILES = {
    'm.txt': 'm\n',
    'long.txt': 'l\n',
    'throws.txt': 't\n',
    'slow.txt': 's\n',
    'n.txt': 'n\n'
};

/** Wait until this many hosts have registered a decoration provider. */
function registered(w: ReturnType<typeof world>, count: number): Promise<void> {
    return w.until(
        () => w.hosts.tools.payload().hosts.filter((one) => one.decorations).length >= count
    );
}

async function started(specs: Record<string, AppSpec>, roots = { r: FILES }) {
    const w = world(specs, {}, { real: true, roots });
    for (const name of Object.keys(specs)) await w.hosts.tab(`app:${name}`);
    await registered(w, Object.keys(specs).length);
    // Each provider tells a change of every file when it registers.
    await w.until(() => w.hosts.tools.decorations.changes().epoch >= Object.keys(specs).length);
    const key = w.fixture.roots[0].key;
    const fire = async (app: string, count: number): Promise<void> => {
        await runDeclared(w.hosts.shell, `app:${app}`, `${app}.fire`, [count]);
    };
    return { w, key, fire };
}

/** Wait until the tools' decorations name a change beyond `epoch`. */
function changedBeyond(w: ReturnType<typeof world>, epoch: number): Promise<void> {
    return w.until(() => w.hosts.tools.decorations.changes().epoch > epoch);
}

/** Wait until the changes name this path. */
function named(w: ReturnType<typeof world>, path: string): Promise<void> {
    return w.until(() =>
        w.hosts.tools.decorations.changes().files.some((one) => one.path === path)
    );
}

describe('the decorations of two apps for one file', () => {
    it('joins the badges, the tooltips and the colour, and keeps what a throwing or silent provider leaves', async () => {
        const s = await started({ one: decorating('one', 'M'), two: decorating('two', 'Z') });
        const done = await s.w.hosts.tools.decorations.decorate(s.key, [
            'm.txt',
            'throws.txt',
            'n.txt'
        ]);
        await s.w.hosts.close();
        expect(done).toEqual({
            decorations: {
                'm.txt': {
                    badge: 'MZ',
                    tooltip: 'tip M\ntip Z',
                    color: 'gitDecoration.modifiedResourceForeground',
                    propagate: true
                },
                'throws.txt': null,
                'n.txt': null
            },
            pending: []
        });
    }, 60000);

    it('drops a badge of three characters with a line in the host output, and a name with no badge, tooltip or colour', async () => {
        const s = await started({ one: decorating('one', 'M') });
        const done = await s.w.hosts.tools.decorations.decorate(s.key, ['long.txt']);
        const output = s.w.hosts.output('app:one').join('\n');
        await s.w.hosts.close();
        expect([done.decorations['long.txt'], output.includes('ABC')]).toEqual([null, true]);
    }, 60000);

    it('names a file as changed when its late provider answers, and decorates it from then on', async () => {
        const s = await started({ one: decorating('one', 'M') });
        // The request waits 1 s for the providers; the clock of that wait is moved by hand while
        // the provider holds its answer.
        vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
        const asked = s.w.hosts.tools.decorations.decorate(s.key, ['slow.txt']);
        await vi.advanceTimersByTimeAsync(1000);
        vi.useRealTimers();
        const first = await asked;
        await runDeclared(s.w.hosts.shell, 'app:one', 'one.release', []);
        await named(s.w, 'slow.txt');
        const told = s.w.hosts.tools.decorations.changes().files.map((one) => one.path);
        const later = await s.w.hosts.tools.decorations.decorate(s.key, ['slow.txt']);
        await s.w.hosts.close();
        expect([first.pending, first.decorations, told, later.decorations['slow.txt']]).toEqual([
            ['slow.txt'],
            {},
            ['slow.txt'],
            { badge: 'S', tooltip: '', color: '', propagate: false }
        ]);
    }, 60000);

    it('asks for no file outside the folders of the scope', async () => {
        const s = await started({ one: decorating('one', 'M') });
        const done = await s.w.hosts.tools.decorations.decorate(s.key, [
            '../m.txt',
            'dir/../../m.txt'
        ]);
        await s.w.hosts.close();
        expect(done.decorations).toEqual({ '../m.txt': null, 'dir/../../m.txt': null });
    }, 60000);
});

describe('the changes a host tells', () => {
    it('tells 10,000 change events of one turn as one change of every file', async () => {
        const s = await started({ one: decorating('one', 'M') });
        const before = s.w.hosts.tools.decorations.changes();
        await s.fire('one', 10_000);
        await changedBeyond(s.w, before.epoch);
        // What the host sent before this answer has been heard when it arrives.
        await s.w.hosts.tools.decorations.decorate(s.key, ['n.txt']);
        const after = s.w.hosts.tools.decorations.changes();
        await s.w.hosts.close();
        expect([after.epoch - before.epoch, after.allAt === after.epoch, after.files]).toEqual([
            1,
            true,
            []
        ]);
    }, 60000);

    it('tells the files of a few events as those files', async () => {
        const s = await started({ one: decorating('one', 'M') });
        const before = s.w.hosts.tools.decorations.changes();
        await s.fire('one', 3);
        await named(s.w, 'f2.txt');
        const after = s.w.hosts.tools.decorations.changes();
        await s.w.hosts.close();
        expect([
            after.epoch - before.epoch,
            after.files.map((one) => one.path).sort(),
            after.allAt
        ]).toEqual([3, ['f0.txt', 'f1.txt', 'f2.txt'], before.allAt]);
    }, 60000);

    it('tells a change with no file as a change of every file', async () => {
        const s = await started({ one: decorating('one', 'M') });
        const before = s.w.hosts.tools.decorations.changes().epoch;
        await runDeclared(s.w.hosts.shell, 'app:one', 'one.fireAll', []);
        await changedBeyond(s.w, before);
        await s.w.hosts.tools.decorations.decorate(s.key, ['n.txt']);
        const after = s.w.hosts.tools.decorations.changes();
        await s.w.hosts.close();
        expect([after.epoch > before, after.allAt === after.epoch]).toEqual([true, true]);
    }, 60000);
});

describe('a root app', () => {
    it('is asked for the files of its own root and none of another root', async () => {
        const app = decorating('mine', 'R');
        const roots = {
            r: { ...FILES, ...asRootApp('mine', app) },
            s: { 'm.txt': 'other root\n' }
        };
        const w = world({}, {}, { real: true, roots, approve: ['mine'] });
        await w.hosts.tab(w.held().apps[0].id);
        await registered(w, 1);
        const [own, other] = w.fixture.roots.map((one) => one.key);
        const here = await w.hosts.tools.decorations.decorate(own, ['m.txt']);
        const there = await w.hosts.tools.decorations.decorate(other, ['m.txt']);
        await w.hosts.close();
        expect([here.decorations['m.txt']?.badge, there.decorations['m.txt']]).toEqual(['R', null]);
    }, 60000);
});
