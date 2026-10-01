// Layer 2, server tests. The actions that change a listed terminal's title, icon and colour or its
// history (rename, restyle, clear), the busy read a close asks first (GET /api/terminal?busy=), and
// the list line those options come back on.
//
// Nothing here runs tmux. handleTerminal and handleTerminalList are called with a `run` double that
// keeps every argument vector, holds the user options each `set-option` set or unset, and answers
// `list-sessions` and `display-message` from them, so a case reads what tmux would have been told
// and what the list then says.
//
// What this does NOT cover: that a real tmux stores what the vector says, which is a look at
// landing (a title holding `#{pane_id}` or ending in `;` is typed into the page and read back).

import { describe, expect } from 'vitest';
import { it, test } from '../../fixtures/scratch.ts';
import {
    handleTerminal,
    handleTerminalList,
    type TerminalOptions
} from '../../../src/lib/server/machine/pty/routes.ts';
import { LIST_FORMAT, parseTerminal } from '../../../src/lib/server/machine/pty/sessions.ts';
import { engineDir } from '../../../src/lib/data/sources/config.ts';
import {
    HERE,
    HOST,
    SERVER,
    TOKEN,
    answer,
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
const GONE_ID = 'd4d4d4-shell';

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

/** What tmux hands a command from one argument of the vector: its trailing `;` rule. */
function tmuxReads(argument: string): string | null {
    if (!argument.endsWith(';')) return argument;
    const bare = argument.slice(0, -1);
    return bare.endsWith('\\') ? `${bare.slice(0, -1)};` : null;
}

function busyRequest(query: string): Request {
    return new Request(`http://${HOST}/api/terminal?${query}`, {
        headers: { host: HOST, 'sec-fetch-site': 'same-origin' }
    });
}

describe('the rename action', () => {
    // Revert: drop the rename action from server/machine/pty/routes.ts, so the action is unknown.
    it('sets @oculus_title to the trimmed title, which the list then reads back as the title', async () => {
        const driver = tmux(SESSIONS);
        const response = await post({ action: 'rename', id: IDLE, title: '  build  ' }, driver);
        expect(response.status).toBe(200);
        expect(acted(driver.calls)).toEqual([
            ['set-option', '-t', `oculus-${IDLE}`, '@oculus_title', 'build']
        ]);
        const listed = await handleTerminalList(busyRequest(''), { run: driver.run });
        const found = ((await answer(listed)).terminals as { id: string; title: string }[]).find(
            (one) => one.id === IDLE
        );
        expect(found?.title).toBe('build');
    });

    // Revert: send an empty title as a value in the rename action instead of unsetting the option.
    it('clears the title for an empty value and for one of only spaces', async () => {
        for (const title of ['', '   ']) {
            const driver = tmux({
                [IDLE]: { command: 'zsh', options: { '@oculus_title': 'old' } }
            });
            const response = await post({ action: 'rename', id: IDLE, title }, driver);
            expect(response.status).toBe(200);
            expect(acted(driver.calls)).toEqual([
                ['set-option', '-u', '-t', `oculus-${IDLE}`, '@oculus_title']
            ]);
        }
    });

    // Revert: accept a title of 81 characters in the rename action, or refuse one of 80.
    it('accepts exactly 80 characters and refuses 81, with no tmux command', async () => {
        const accepted = tmux(SESSIONS);
        const ok = await post({ action: 'rename', id: IDLE, title: 'x'.repeat(80) }, accepted);
        expect(ok.status).toBe(200);
        expect(acted(accepted.calls)).toHaveLength(1);
        const refused = tmux(SESSIONS);
        const over = await post({ action: 'rename', id: IDLE, title: 'x'.repeat(81) }, refused);
        expect(over.status).toBe(400);
        expect(acted(refused.calls)).toEqual([]);
    });

    // Revert: drop the control-character check from the rename action.
    it('refuses a tab or any other control character, with no tmux command', async () => {
        for (const title of ['a\tb', 'a\nb', 'a\u0000b', 'a\u001bb', 'a\u007fb']) {
            const driver = tmux(SESSIONS);
            const response = await post({ action: 'rename', id: IDLE, title }, driver);
            expect(response.status).toBe(400);
            expect(acted(driver.calls)).toEqual([]);
        }
    });

    // Revert: pass the title to set-option as typed, without the escape of a trailing semicolon.
    it('hands tmux one argument that reads back as the typed title, whatever ends it', async () => {
        for (const title of ['build;', 'a;b;', ';', 'back\\;', 'two\\\\;', 'plain']) {
            const driver = tmux(SESSIONS);
            const response = await post({ action: 'rename', id: IDLE, title }, driver);
            expect(response.status).toBe(200);
            const set = acted(driver.calls)[0];
            expect(set).toHaveLength(5);
            expect(tmuxReads(set[4])).toBe(title);
        }
    });

    // Revert: pass -F to set-option in optionArgs, which makes tmux expand the title as a format.
    it('lists a title holding #{pane_id} as it was typed', async () => {
        const driver = tmux(SESSIONS);
        await post({ action: 'rename', id: IDLE, title: '#{pane_id}' }, driver);
        const listed = await handleTerminalList(busyRequest(''), { run: driver.run });
        const found = ((await answer(listed)).terminals as { id: string; title: string }[]).find(
            (one) => one.id === IDLE
        );
        expect(found?.title).toBe('#{pane_id}');
    });
});

describe('the restyle action', () => {
    // Revert: drop the restyle action from server/machine/pty/routes.ts.
    it('sets @oculus_color for one of the eight names and reads it back on the record', async () => {
        const driver = tmux(SESSIONS);
        const response = await post({ action: 'restyle', id: IDLE, color: 'red' }, driver);
        expect(response.status).toBe(200);
        expect(acted(driver.calls)).toEqual([
            ['set-option', '-t', `oculus-${IDLE}`, '@oculus_color', 'red']
        ]);
        const listed = await handleTerminalList(busyRequest(''), { run: driver.run });
        const found = ((await answer(listed)).terminals as { id: string; color: string }[]).find(
            (one) => one.id === IDLE
        );
        expect(found?.color).toBe('red');
    });

    // Revert: accept any string as the colour in the restyle action.
    it('refuses a colour outside the eight names, with no tmux command', async () => {
        for (const color of ['chartreuse', 'RED', 'red ', 'bright-red']) {
            const driver = tmux(SESSIONS);
            const response = await post({ action: 'restyle', id: IDLE, color }, driver);
            expect(response.status).toBe(400);
            expect(acted(driver.calls)).toEqual([]);
        }
    });

    // Revert: accept any string as the icon in the restyle action.
    it('sets @oculus_icon for a glyph of the vocabulary and refuses one that is not there', async () => {
        const good = tmux(SESSIONS);
        const ok = await post({ action: 'restyle', id: IDLE, icon: 'terminal' }, good);
        expect(ok.status).toBe(200);
        expect(acted(good.calls)).toEqual([
            ['set-option', '-t', `oculus-${IDLE}`, '@oculus_icon', 'terminal']
        ]);
        const bad = tmux(SESSIONS);
        const refused = await post({ action: 'restyle', id: IDLE, icon: 'no_such_glyph' }, bad);
        expect(refused.status).toBe(400);
        expect(acted(bad.calls)).toEqual([]);
    });

    // Revert: send an empty icon or colour as a value in the restyle action instead of unsetting.
    it('unsets the option for an empty value, and touches only the option it was given', async () => {
        const driver = tmux({
            [IDLE]: {
                command: 'zsh',
                options: { '@oculus_icon': 'terminal', '@oculus_color': 'red' }
            }
        });
        await post({ action: 'restyle', id: IDLE, color: '' }, driver);
        expect(acted(driver.calls)).toEqual([
            ['set-option', '-u', '-t', `oculus-${IDLE}`, '@oculus_color']
        ]);
        const both = tmux(SESSIONS);
        await post({ action: 'restyle', id: IDLE, icon: '', color: '' }, both);
        expect(acted(both.calls)).toEqual([
            ['set-option', '-u', '-t', `oculus-${IDLE}`, '@oculus_icon'],
            ['set-option', '-u', '-t', `oculus-${IDLE}`, '@oculus_color']
        ]);
    });

    // Revert: accept a restyle that names neither an icon nor a colour.
    it('refuses a restyle that names neither an icon nor a colour', async () => {
        const driver = tmux(SESSIONS);
        const response = await post({ action: 'restyle', id: IDLE }, driver);
        expect(response.status).toBe(400);
        expect(acted(driver.calls)).toEqual([]);
    });
});

describe('the clear action', () => {
    // Revert: drop the clear action from server/machine/pty/routes.ts, or its send-keys -R.
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

    // Revert: reset the pane in clearTerminal whatever screen it is on.
    it('leaves the screen of a full-screen program alone and clears only the history', async () => {
        const driver = tmux({ [AGENT]: { command: 'claude', alternate: true } });
        const response = await post({ action: 'clear', id: AGENT }, driver);
        expect(response.status).toBe(200);
        expect(acted(driver.calls)).toEqual([
            ['display-message', '-p', '-t', `oculus-${AGENT}`, '#{alternate_on}'],
            ['clear-history', '-t', `oculus-${AGENT}`]
        ]);
    });
});

describe('rename, restyle and clear of a terminal the server does not list', () => {
    // Revert: skip the listed-terminal check in the rename, restyle and clear actions.
    it('answers a refusal that says so, and runs no command but the list', async () => {
        const bodies = [
            { action: 'rename', id: GONE_ID, title: 'x' },
            { action: 'restyle', id: GONE_ID, color: 'red' },
            { action: 'clear', id: GONE_ID }
        ];
        for (const body of bodies) {
            const driver = tmux(SESSIONS);
            const response = await post(body, driver);
            expect(response.status).toBe(400);
            expect(String((await answer(response)).error)).not.toBe('');
            expect(acted(driver.calls)).toEqual([]);
        }
    });

    // Revert: skip the id-shape check in the rename, restyle and clear actions.
    it('refuses an id that is not a terminal id before any tmux command at all', async () => {
        for (const action of ['rename', 'restyle', 'clear']) {
            const driver = tmux(SESSIONS);
            const response = await post(
                { action, id: 'scratch', title: 'x', color: 'red' },
                driver
            );
            expect(response.status).toBe(400);
            expect(driver.calls).toEqual([]);
        }
    });
});

describe('a list line with the title, icon and colour', () => {
    // Revert: read the title from field 8 as the name, or drop the three fields from LIST_FORMAT.
    it('reads them as title, icon and color, empty when the line carries none', () => {
        const head = ['oculus-a1a1a1-shell', '1757500000', '0', 'zsh', '4242', HERE, '', ''];
        expect(parseTerminal([...head, 'build', 'terminal', 'red'].join('\t'))).toMatchObject({
            title: 'build',
            icon: 'terminal',
            color: 'red'
        });
        expect(parseTerminal(head.join('\t'))).toMatchObject({ title: '', icon: '', color: '' });
        // The line the list asks tmux for carries the three options, in that order, and then the
        // pid of the server that answers.
        expect(LIST_FORMAT.split('\t').slice(8)).toEqual([
            '#{@oculus_title}',
            '#{@oculus_icon}',
            '#{@oculus_color}',
            '#{pid}'
        ]);
    });
});

describe('GET /api/terminal?busy=', () => {
    // Revert: drop the id-shape check from the busy read.
    it('refuses a malformed id before any tmux command', async () => {
        for (const query of ['busy=', 'busy=nope', `busy=${IDLE},nope`, 'busy=..%2Fa1a1a1-shell']) {
            const driver = tmux(SESSIONS);
            const response = await handleTerminalList(busyRequest(query), options(driver.run));
            expect(response.status).toBe(400);
            expect(driver.calls).toEqual([]);
        }
    });

    // Revert: drop the 64-id limit from the busy read.
    it('refuses a list of more than 64 ids and reads 64', async () => {
        const id = (at: number) => `${at.toString(16).padStart(6, '0')}-shell`;
        const many = Array.from({ length: 65 }, (_, at) => id(at));
        const over = tmux(SESSIONS);
        const refused = await handleTerminalList(
            busyRequest(`busy=${many.join(',')}`),
            options(over.run)
        );
        expect(refused.status).toBe(400);
        expect(over.calls).toEqual([]);
        const within = tmux(SESSIONS);
        const read = await handleTerminalList(
            busyRequest(`busy=${many.slice(0, 64).join(',')}`),
            options(within.run)
        );
        expect(read.status).toBe(200);
    });

    // Revert: compare the whole path of $SHELL to the pane's command in the busy read.
    it('reads an idle shell whose command is zsh while $SHELL is /bin/zsh as idle', async () => {
        const driver = tmux(SESSIONS);
        const response = await handleTerminalList(
            busyRequest(`busy=${IDLE}`),
            options(driver.run, '/bin/zsh')
        );
        expect(response.status).toBe(200);
        expect((await answer(response)).busy).toEqual([{ id: IDLE, busy: false, command: 'zsh' }]);
        expect(driver.calls).toEqual([
            ['display-message', '-p', '-t', `oculus-${IDLE}`, '#{pane_current_command}']
        ]);
    });

    // Revert: decide busy from the terminal's kind alone in the busy read.
    it('reads a shell terminal running npm as busy, and an agent terminal as busy', async () => {
        const driver = tmux(SESSIONS);
        const response = await handleTerminalList(
            busyRequest(`busy=${BUSY},${AGENT}`),
            options(driver.run)
        );
        expect((await answer(response)).busy).toEqual([
            { id: BUSY, busy: true, command: 'npm' },
            { id: AGENT, busy: true, command: 'claude' }
        ]);
    });

    // Revert: answer a terminal whose read failed as not busy.
    it('reads a terminal whose tmux read failed as busy with no program named', async () => {
        const driver = tmux(SESSIONS, [IDLE]);
        const response = await handleTerminalList(busyRequest(`busy=${IDLE}`), options(driver.run));
        expect((await answer(response)).busy).toEqual([{ id: IDLE, busy: true, command: '' }]);
    });
});
