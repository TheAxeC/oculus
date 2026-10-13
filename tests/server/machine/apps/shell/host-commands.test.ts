// Layer 2, server test. Choosing a command of an app in Cmd-K with its host not running
// (lib/server/machine/apps/shell/commands.ts `runDeclared`) over the real runner: the host is
// started for the command, the handler it registered runs with the arguments, and a command the
// app does not declare starts nothing. These are the host-command rows of G77.
//
// The last describe reads the settings an app declares through `getConfiguration` and hears
// `onDidChangeConfiguration` when they change, the host half of the settings rows of G77.
//
// Every folder is synthetic, under the system temporary directory. What this does NOT cover: the
// scripted hosts of shell-commands.test.ts and the page that runs a command only an open tab
// registered (tests/state/system/apps/shell.test.ts).
// @module-tag slow: each case starts a node process.

import { describe, expect } from 'vitest';
import { runDeclared } from '../../../../../src/lib/server/machine/apps/shell/commands.ts';
import { it } from '../../../../fixtures/scratch.ts';
import { world, type World } from '../world/hosts-world.ts';

const NOTES = 'app:notes';

const HOST =
    "export function activate(oculus) { oculus.commands.registerCommand('notes.hello', (...args) => ({ got: args })); }\n";

const DECLARED = 'contributes:\n  commands:\n    - command: notes.hello\n      title: Hello\n';

/** A real host of the app `notes` with this host file and these manifest keys. */
const real = (keys: string, host: string | null = HOST): World =>
    world({ notes: { host, keys } }, {}, { real: true });

describe('choosing a command of an app whose host is not running', () => {
    it.each([
        ['activation: [onCommand:notes.hello]', `activation: [onCommand:notes.hello]\n${DECLARED}`],
        ['activation: [onTab] and no tab open', `activation: [onTab]\n${DECLARED}`]
    ])('starts the host and runs the handler with the arguments: %s', async (_row, keys) => {
        const w = real(keys);
        expect(w.hosts.running(NOTES)).toBe(false);
        const done = await runDeclared(w.hosts.shell, NOTES, 'notes.hello', ['x', 2]);
        const running = w.hosts.running(NOTES);
        await w.hosts.close();
        expect([done, running]).toEqual([{ ok: true, value: { got: ['x', 2] } }, true]);
    });

    it('answers `missing` and starts nothing for a command the app does not declare', async () => {
        const w = real(`activation: [onTab]\n${DECLARED}`);
        const done = await runDeclared(w.hosts.shell, NOTES, 'notes.other', []);
        const running = w.hosts.running(NOTES);
        await w.hosts.close();
        expect([done, running]).toEqual([{ ok: false, word: 'missing' }, false]);
    });

    it('answers `missing` for an app with no host, which a page then tries through its open tab', async () => {
        const w = real(DECLARED, null);
        const done = await runDeclared(w.hosts.shell, NOTES, 'notes.hello', []);
        await w.hosts.close();
        expect(done).toEqual({ ok: false, word: 'missing' });
    });
});

const SETTINGS_HOST = `
export function activate(oculus) {
  const heard = [];
  let told = () => undefined;
  oculus.workspace.onDidChangeConfiguration((event) => {
    heard.push(event.keys);
    told();
  });
  oculus.commands.registerCommand('notes.width', () => oculus.workspace.getConfiguration('notes').get('width'));
  oculus.commands.registerCommand('notes.heard', () => heard.length > 0 ? heard : new Promise((resolve) => {
    told = () => resolve(heard);
  }));
  oculus.commands.registerCommand('notes.other', () => {
    try {
      return oculus.workspace.getConfiguration('other').get('x');
    } catch (error) {
      return error.message;
    }
  });
}
`;

const SETTINGS_KEYS = `activation: [onTab]
contributes:
  commands:
    - command: notes.width
      title: Width
    - command: notes.heard
      title: Heard
    - command: notes.other
      title: Other
`;

describe('the settings an app declares, read by its host', () => {
    it('answers the value at once, hears the change with the keys that changed, and reads its own keys alone', async () => {
        let values: Record<string, unknown> = { 'notes.width': 80 };
        const w = world(
            { notes: { host: SETTINGS_HOST, keys: SETTINGS_KEYS } },
            {},
            { real: true, options: { values: () => values } }
        );
        const ask = async (id: string): Promise<unknown> => {
            const done = await runDeclared(w.hosts.shell, NOTES, id, []);
            return done.ok ? done.value : done.word;
        };
        const before = await ask('notes.width');
        values = { 'notes.width': 100 };
        w.hosts.settingsChanged();
        const heard = await ask('notes.heard');
        const after = await ask('notes.width');
        const other = await ask('notes.other');
        await w.hosts.close();
        expect([before, after, heard, other]).toEqual([80, 100, [['notes.width']], 'not_declared']);
    });
});
