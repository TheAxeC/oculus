// Layer 2, route tests. The action that changes a listed terminal's history (clear).
//
// Nothing here runs tmux. handleTerminal is called with a `run` double that keeps every argument
// vector, holds the user options each `set-option` set or unset, and answers `list-sessions` and
// `display-message` from them, so a case reads what tmux would have been told and what the list
// then says.
//
// What this does NOT cover: that a real tmux stores what the vector says, which is a look at
// landing.
//
// A case that takes 100 ms or more in a run of its own is tagged slow; the others run in npm test.

import { describe, expect } from 'vitest';
import { it, test } from '../../fixtures/scratch.ts';
import {
    handleTerminal,
    type TerminalOptions
} from '../../../src/lib/server/machine/pty/routes.ts';
import { engineDir } from '../../../src/lib/data/sources/config.ts';
import {
    HERE,
    SERVER,
    TOKEN,
    configOf,
    makeTaskConfig,
    request,
    type TaskConfig
} from './terminal-fixture.ts';

let task: TaskConfig;

test.beforeAll(() => {
    task = makeTaskConfig();
});

test.afterAll(() => {
    SERVER.close();
});

const IDLE = 'a1a1a1-shell';
const BUSY = 'b2b2b2-shell';
const AGENT = 'c3c3c3-claude';

/** What the double knows of one session. */
type Session = { command: string; options?: Record<string, string>; alternate?: boolean };

/**
 * A tmux that runs nothing: it keeps every argument vector, applies `set-option` (and its unset)
 * to the session's user options, and answers `list-sessions` in the format the server asks for and
 * `display-message` with the session's command, or with whether it is on the alternate screen
 * when that is what is asked. A session named in `failing` answers its
 * `display-message` with an error, as a session that ended does.
 */
function tmux(sessions: Record<string, Session>, failing: string[] = []) {
    const calls: string[][] = [];
    const held = new Map(
        Object.entries(sessions).map(([id, one]) => [id, { ...(one.options ?? {}) }])
    );
    const run: NonNullable<TerminalOptions['run']> = (args) => {
        calls.push([...args]);
        if (args[0] === 'list-sessions') {
            const lines = Object.entries(sessions).map(([id, one]) => {
                const own = held.get(id) ?? {};
                return [
                    `oculus-${id}`,
                    '1757500000',
                    '0',
                    one.command,
                    '4242',
                    HERE,
                    own['@oculus_name'] ?? '',
                    own['@oculus_resumes'] ?? '',
                    own['@oculus_title'] ?? '',
                    own['@oculus_icon'] ?? '',
                    own['@oculus_color'] ?? ''
                ].join('\t');
            });
            return Promise.resolve(`${lines.join('\n')}\n`);
        }
        if (args[0] === 'set-option') {
            // With -F tmux expands the value as a format, as it does for `#{pane_id}`.
            const expand = args[1] === '-F';
            const words = expand ? ['set-option', ...args.slice(2)] : args;
            const unset = words[1] === '-u';
            const at = unset ? 2 : 1;
            const id = (words[at + 1] ?? '').replace(/^oculus-/, '');
            const own = held.get(id);
            if (own === undefined) return Promise.reject(new Error('no such session'));
            const value = words[at + 3] ?? '';
            const name = words[at + 2] ?? '';
            if (unset) {
                held.set(
                    id,
                    Object.fromEntries(Object.entries(own).filter(([key]) => key !== name))
                );
            } else own[name] = expand ? value.replace(/#\{[^}]*\}/g, '%1') : value;
            return Promise.resolve('');
        }
        if (args[0] === 'display-message') {
            const id = (args[3] ?? '').replace(/^oculus-/, '');
            if (failing.includes(id) || !Object.hasOwn(sessions, id)) {
                return Promise.reject(new Error(`can't find session: ${args[3]}`));
            }
            if (args[4] === '#{alternate_on}') {
                return Promise.resolve(sessions[id].alternate === true ? '1\n' : '0\n');
            }
            return Promise.resolve(`${sessions[id].command}\n`);
        }
        return Promise.resolve('');
    };
    return { run, calls, held };
}

function options(run: NonNullable<TerminalOptions['run']>, shell = '/bin/zsh'): TerminalOptions {
    return {
        engine: task.engine,
        configFor: configOf(engineDir()),
        run,
        shell
    };
}

const SESSIONS: Record<string, Session> = {
    [IDLE]: { command: 'zsh' },
    [BUSY]: { command: 'npm' },
    [AGENT]: { command: 'claude' }
};

/** The commands a case ran other than the list that establishes which terminals exist. */
function acted(calls: string[][]): string[][] {
    return calls.filter((args) => args[0] !== 'list-sessions');
}

async function post(body: unknown, driver: ReturnType<typeof tmux>): Promise<Response> {
    return handleTerminal(request(body), TOKEN, options(driver.run));
}

describe('the clear action', () => {
    it("resets that terminal's screen and then clears its history, and nothing else", async () => {
        const driver = tmux(SESSIONS);
        const response = await post({ action: 'clear', id: IDLE }, driver);
        expect(response.status).toBe(200);
        expect(acted(driver.calls)).toEqual([
            ['display-message', '-p', '-t', `oculus-${IDLE}`, '#{alternate_on}'],
            ['send-keys', '-R', '-t', `oculus-${IDLE}`],
            ['clear-history', '-t', `oculus-${IDLE}`]
        ]);
    });
});
