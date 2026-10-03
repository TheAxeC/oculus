// Layer 4, client-state test. The commands store: the commands of a repository read once through
// the query client and read again on a write; the run, the approval and the Rerun and Restart
// calls it posts; the errors a task terminal printed, kept as diagnostics; and the two default
// keys' run of the default build or test of the repository holding the file on screen.
//
// `fetch` is a stub that records each request and answers from the case. The client is built
// through the client's own wiring (state/client/context.ts).
//
// What this does NOT cover: the bar of buttons (tests/views/shared/commands), the link provider
// that draws an error as a link (an xterm feature the look checks), and a mounted view dropping a
// read, which needs a DOM.

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createClientState, json, settle, type ClientState } from '../../../fixtures/client.ts';
import { git } from '../../../fixtures/sessions-fixture.ts';
import { readTab } from '../../../../src/lib/state/sessions/terminal/terminal-tabs.ts';
import { errorMatch } from '../../../../src/lib/state/sessions/terminal/commands.svelte.ts';
import { engineDir, loadConfig, textCatalog } from '../../../../src/lib/data/sources/config.ts';
import { setCatalog } from '../../../../src/lib/state/shared/words/text.ts';
import type { EditorStatus } from '../../../../src/lib/state/workbench/navigation/editor-status.svelte.ts';
import type { Terminal } from '../../../../src/lib/data/model/index.ts';
import { fakeStorage } from '../../workbench/layout/layout-fixture.ts';
import { terminalTabsOf } from '../../client/terminal/terminal-tabs-fixture.ts';
import {
    REPO,
    listTasks as listed,
    serveInto,
    servedRoots,
    task,
    type Asked
} from './commands-fixture.ts';

const WORDS = textCatalog(loadConfig(engineDir()).config);
setCatalog(WORDS);

/** The line of a chain the server asks to have approved. */
const MAKE = { folder: '.', run: 'make' };
const LISTED = {
    commands: [
        { name: 'build', run: 'make', cwd: REPO, depends_on: [], default: 'build', source: 'file' },
        { name: 'test', run: 'make test', cwd: REPO, depends_on: ['build'], source: 'file' }
    ],
    findings: []
};

let client: ClientState;
let asked: Asked[] = [];

beforeEach(() => {
    client = createClientState();
    asked = [];
});

afterEach(() => {
    vi.unstubAllGlobals();
});

/** A fetch that records each request and answers it with what `answer` says for it. */
function serve(answer: (call: Asked) => Response | Promise<Response>): void {
    serveInto(asked, answer);
}

const lists = () =>
    asked.filter((call) => call.method === 'GET' && call.url.startsWith('/api/commands'));

describe('the commands of a repository', () => {
    it('asks once however often it is read, and holds the answer', async () => {
        serve(() => json(LISTED));
        const release = client.commands.watch(REPO);
        expect(client.commands.commands(REPO)).toBe(null);
        await settle();
        client.commands.commands(REPO);
        client.commands.commands(REPO);
        await settle();
        expect(lists().map((call) => call.url)).toEqual([
            `/api/commands?repo=${encodeURIComponent(REPO)}`
        ]);
        expect(client.commands.commands(REPO)?.commands.map((one) => one.name)).toEqual([
            'build',
            'test'
        ]);
        release();
    });

    it('reads again after a save, and posts the save with the write token', async () => {
        serve((call) => (call.method === 'POST' ? json({ ok: true }) : json(LISTED)));
        client.commands.watch(REPO);
        client.commands.commands(REPO);
        await settle();
        const done = await client.commands.save(REPO, { name: 'lint', run: 'npm run lint' });
        await settle();
        expect(done).toEqual({ ok: true, error: '' });
        const post = asked.find((call) => call.method === 'POST');
        expect(post?.url).toBe('/api/commands');
        expect(post?.body).toEqual({
            action: 'save',
            repo: REPO,
            command: { name: 'lint', run: 'npm run lint' }
        });
        expect(lists()).toHaveLength(2);
    });

    it('reads again after a remove', async () => {
        serve((call) => (call.method === 'POST' ? json({ ok: true }) : json(LISTED)));
        client.commands.watch(REPO);
        client.commands.commands(REPO);
        await settle();
        await client.commands.remove(REPO, 'build');
        await settle();
        expect(lists()).toHaveLength(2);
    });

    it('reads again after a files message for a folder holding the repository, and not after one for another folder', async () => {
        serve(() => json(LISTED));
        client.commands.watch(REPO);
        client.commands.commands(REPO);
        await settle();
        // The first message heard leaves no way to tell what it missed, so it reads again.
        client.entities.receive({ channel: 'files', version: 1, payload: { root: '/elsewhere' } });
        client.commands.commands(REPO);
        await settle();
        expect(lists()).toHaveLength(2);
        client.entities.receive({ channel: 'files', version: 2, payload: { root: '/work' } });
        client.commands.commands(REPO);
        await settle();
        expect(lists()).toHaveLength(3);
        client.entities.receive({ channel: 'files', version: 3, payload: { root: '/elsewhere' } });
        client.commands.commands(REPO);
        await settle();
        expect(lists()).toHaveLength(3);
    });

    it('reads again after a files message that skips a version, whatever folder it names', async () => {
        serve(() => json(LISTED));
        client.commands.watch(REPO);
        client.commands.commands(REPO);
        await settle();
        client.entities.receive({ channel: 'files', version: 1, payload: { root: '/elsewhere' } });
        client.commands.commands(REPO);
        await settle();
        client.entities.receive({ channel: 'files', version: 2, payload: { root: '/elsewhere' } });
        client.commands.commands(REPO);
        await settle();
        expect(lists()).toHaveLength(2);
        client.entities.receive({ channel: 'files', version: 5, payload: { root: '/elsewhere' } });
        client.commands.commands(REPO);
        await settle();
        expect(lists()).toHaveLength(3);
    });

    it('asks for no repository that no view watches', async () => {
        serve(() => json(LISTED));
        expect(client.commands.commands(REPO)).toBeNull();
        await settle();
        expect(lists()).toEqual([]);
        expect(client.commands.commands(REPO)).toBeNull();
    });

    it('changes nothing when a read is answered after its last view released it', async () => {
        const gates: ((answer: Response) => void)[] = [];
        vi.stubGlobal('fetch', (url: string, init?: RequestInit) => {
            asked.push({ url, method: init?.method ?? 'GET', body: null });
            return new Promise<Response>((land) => gates.push(land));
        });
        const release = client.commands.watch(REPO);
        client.commands.commands(REPO);
        await settle();
        expect(gates).toHaveLength(1);
        release();
        gates[0](json(LISTED));
        await settle();
        expect(client.commands.commands(REPO)).toBe(null);
    });

    it('keeps the later of two reads when the earlier answers last', async () => {
        const gates: ((answer: Response) => void)[] = [];
        vi.stubGlobal('fetch', (url: string, init?: RequestInit) => {
            asked.push({ url, method: init?.method ?? 'GET', body: null });
            return new Promise<Response>((land) => gates.push(land));
        });
        client.commands.watch(REPO);
        client.commands.commands(REPO);
        await settle();
        client.entities.receive({ channel: 'files', version: 1, payload: { root: REPO } });
        client.commands.commands(REPO);
        await settle();
        expect(gates).toHaveLength(2);
        const newer = { commands: [LISTED.commands[1]], findings: [] };
        gates[1](json(newer));
        await settle();
        gates[0](json(LISTED));
        await settle();
        expect(client.commands.commands(REPO)?.commands.map((one) => one.name)).toEqual(['test']);
    });
});

describe('a run', () => {
    it('posts the command with the context of the file on screen and answers what the server asked', async () => {
        serve(() => json({ approve: [MAKE] }));
        const answer = await client.commands.run(REPO, 'build', 'file');
        expect(answer).toEqual({ approve: [MAKE] });
        const post = asked[0];
        expect(post.url).toBe('/api/terminal');
        expect(post.body).toMatchObject({
            action: 'command',
            repo: REPO,
            name: 'build',
            source: 'file'
        });
    });

    it('posts the context of the source tab focused last when the tab on screen is another view', async () => {
        serve(() => json({ approve: [MAKE] }));
        const id = onScreen(`${REPO}/src/a.c`);
        client.editorStatus.focus(id);
        client.layout.openView('repositories', {});
        await client.commands.run(REPO, 'say', 'file');
        expect(asked[0].body).toMatchObject({
            context: { file: `${REPO}/src/a.c`, line: 7, selectedText: 'sel' }
        });
        client.editorStatus.forget(id);
        await client.commands.run(REPO, 'say', 'file');
        expect(asked[1].body).not.toHaveProperty('context');
    });

    it('approves the lines of the chain and posts them to the commands route', async () => {
        serve(() => json({ ok: true }));
        expect(await client.commands.approve(REPO, [MAKE])).toEqual({ ok: true, error: '' });
        expect(asked[0].url).toBe('/api/commands');
        expect(asked[0].body).toEqual({ action: 'approve', repo: REPO, chain: [MAKE] });
    });

    it('says the server refusal in its words', async () => {
        serve(() => json({ error: 'no value for ${file}' }, 400));
        expect(await client.commands.run(REPO, 'build', 'file')).toEqual({
            ok: false,
            error: 'no value for ${file}'
        });
    });
});

describe('Rerun and Restart', () => {
    it('posts the action for the terminal, and the confirmation when it was given', async () => {
        serve(() => json({ confirm: 'make' }));
        expect(await client.commands.restart('a1b2c3-shell', false)).toEqual({ confirm: 'make' });
        expect(asked[0].body).toEqual({ action: 'restart', id: 'a1b2c3-shell' });
        serve(() => json({ ok: true, id: 'a1b2c3-shell' }));
        asked.length = 0;
        expect(await client.commands.restart('a1b2c3-shell', true)).toMatchObject({ ok: true });
        expect(asked[0].body).toEqual({ action: 'restart', id: 'a1b2c3-shell', confirmed: true });
        asked.length = 0;
        await client.commands.rerun('a1b2c3-shell');
        expect(asked[0].body).toEqual({ action: 'rerun', id: 'a1b2c3-shell' });
    });
});

describe('the pattern of an error line', () => {
    it('matches the first two lines with file, line, column and severity, and not the others', () => {
        expect(errorMatch('src/a.c:12:5: error: x')).toMatchObject({
            file: 'src/a.c',
            line: 12,
            column: 5,
            severity: 'error',
            message: 'x'
        });
        expect(errorMatch('b.py:3: warning y')).toMatchObject({
            file: 'b.py',
            line: 3,
            severity: 'warning',
            message: 'y'
        });
        expect(errorMatch('b.py:3: warning y')?.column).toBeUndefined();
        expect(errorMatch('Error: z')).toBe(null);
        expect(errorMatch('C:\\x:1: error')).toBe(null);
    });

    it('reads the severity in any letter case and the span of file:line:column in the line', () => {
        const found = errorMatch('lib/x.ts:7:2: WARNING: loud');
        expect(found).toMatchObject({ severity: 'warning', message: 'loud' });
        expect(
            found && 'lib/x.ts:7:2: WARNING: loud'.slice(found.start, found.start + found.length)
        ).toBe('lib/x.ts:7:2');
    });
});

/** Tell the client the terminals the server lists. */
function listTasks(list: Terminal[], version = 1): void {
    listed(client, list, version);
}

describe('the form that saves a command', () => {
    it('is closed until opened, holds the repository and the command being edited, and closes', () => {
        expect(client.commands.forming()).toBeNull();
        client.commands.openForm(REPO, null);
        expect(client.commands.forming()).toEqual({ repo: REPO, edit: null });
        client.commands.closeForm();
        expect(client.commands.forming()).toBeNull();
        client.commands.openForm(REPO, { name: 'lint', run: 'npm run lint' });
        expect(client.commands.forming()).toEqual({
            repo: REPO,
            edit: { name: 'lint', run: 'npm run lint' }
        });
    });

    it('is replaced by a form opened for another repository', () => {
        client.commands.openForm(REPO, null);
        client.commands.openForm('/work/other', null);
        expect(client.commands.forming()?.repo).toBe('/work/other');
    });
});

describe('the diagnostics of a task terminal', () => {
    const OUTPUT = 'src/a.c:12:5: error: x\r\nb.py:3: warning y\r\nError: z\r\nC:\\x:1: error\r\n';

    it('holds the matched lines with the command as their source, the file relative to the repository', () => {
        listTasks([task()]);
        client.commands.note('a1b2c3-shell', OUTPUT, false);
        expect(client.commands.commandDiagnostics()).toEqual([
            {
                root: REPO,
                file: 'src/a.c',
                line: 12,
                column: 5,
                severity: 'error',
                message: 'x',
                source: 'command:build'
            },
            {
                root: REPO,
                file: 'b.py',
                line: 3,
                severity: 'warning',
                message: 'y',
                source: 'command:build'
            }
        ]);
    });

    it('reads a line that arrives in pieces and a line holding colour codes', () => {
        listTasks([task()]);
        client.commands.note(
            'a1b2c3-shell',
            '\u001b[1msrc/a.c:12:5:\u001b[0m \u001b[31merr',
            false
        );
        client.commands.note('a1b2c3-shell', 'or:\u001b[0m x\r\n', false);
        expect(client.commands.commandDiagnostics()).toHaveLength(1);
        expect(client.commands.commandDiagnostics()[0]).toMatchObject({
            file: 'src/a.c',
            message: 'x'
        });
    });

    it('replaces them on a rerun, and holds one entry for output replayed twice', async () => {
        listTasks([task()]);
        client.commands.note('a1b2c3-shell', OUTPUT, false);
        client.commands.note('a1b2c3-shell', OUTPUT, true);
        expect(client.commands.commandDiagnostics()).toHaveLength(2);
        serve(() => json({ ok: true, id: 'a1b2c3-shell' }));
        await client.commands.rerun('a1b2c3-shell');
        expect(client.commands.commandDiagnostics()).toEqual([]);
        client.commands.note('a1b2c3-shell', 'other.c:1: error: fresh\r\n', false);
        expect(client.commands.commandDiagnostics().map((one) => one.message)).toEqual(['fresh']);
    });

    it('holds none for a terminal that is not a task terminal or has ended and left the list', () => {
        listTasks([task({ task: false })]);
        client.commands.note('a1b2c3-shell', OUTPUT, false);
        expect(client.commands.commandDiagnostics()).toEqual([]);
        listTasks([task()], 2);
        expect(client.commands.commandDiagnostics()).toEqual([]);
        client.commands.note('a1b2c3-shell', OUTPUT, false);
        expect(client.commands.commandDiagnostics()).toHaveLength(2);
        listTasks([], 3);
        expect(client.commands.commandDiagnostics()).toEqual([]);
    });
});

/** What a source tab publishes, for a file open in it. */
function published(file: string, line: number, selection = ''): EditorStatus {
    return {
        caret: { line, column: 1, selected: selection.length },
        lines: 40,
        indent: { tabs: false, size: 4 },
        ending: 'LF',
        language: 'c',
        writable: true,
        blame: '',
        actions: [],
        file,
        selection
    };
}

/** A source tab for `file` on screen, saying what it holds, with the repositories git names. */
function onScreen(file: string, repos: string[] = [REPO]): string {
    client.entities.receive({
        channel: 'git',
        version: 1,
        payload: Object.fromEntries(repos.map((one) => [one, git()]))
    });
    const id = client.layout.openView('source', {
        root: 'hub',
        path: file.slice(REPO.length + 1),
        label: 'a.c'
    });
    client.editorStatus.publish(id, published(file, 7, 'sel'));
    return id;
}

describe('the default build and test', () => {
    it('runs the default build of the repository holding the file on screen, once', async () => {
        serve((call) => (call.method === 'GET' ? json(LISTED) : json({ ok: true })));
        onScreen(`${REPO}/src/a.c`);
        const ran = await client.commands.runDefault('build');
        expect(ran).toBe(true);
        const posts = asked.filter((call) => call.url === '/api/terminal');
        expect(posts).toHaveLength(1);
        expect(posts[0].body).toMatchObject({
            action: 'command',
            repo: REPO,
            name: 'build',
            context: { file: `${REPO}/src/a.c`, line: 7, selectedText: 'sel' }
        });
    });

    it('says which is missing and runs nothing: no file, no repository, no default', async () => {
        serve((call) => (call.method === 'GET' ? json(LISTED) : json({ ok: true })));
        expect(await client.commands.runDefault('build')).toBe(false);
        expect(client.notices.list()[0]?.message).toBe(WORDS['commands.no_file']);
        onScreen('/other/place/x.c');
        expect(await client.commands.runDefault('build')).toBe(false);
        expect(client.notices.list()[0]?.message).toBe(WORDS['commands.no_repo']);
        expect(asked.filter((call) => call.url === '/api/terminal')).toEqual([]);
    });

    it('says there is no default for the key when the repository has none, and runs nothing', async () => {
        serve((call) => (call.method === 'GET' ? json(LISTED) : json({ ok: true })));
        onScreen(`${REPO}/src/a.c`);
        expect(await client.commands.runDefault('test')).toBe(false);
        expect(client.notices.list()[0]?.message).toBe(WORDS['commands.no_default_test']);
        expect(asked.filter((call) => call.url === '/api/terminal')).toEqual([]);
    });
});

/** The terminals the Terminal tabs of the client own, in order. */
function shownTerminals(): string[] {
    return terminalTabsOf(client).flatMap((one) => readTab(one.state).terminals);
}

describe('a press', () => {
    beforeEach(() => {
        client.layout.loadLayout(fakeStorage());
    });

    const COMMAND_POSTS = () => asked.filter((call) => call.url === '/api/terminal');

    it('holds the question while the run is in flight and not before, and shows nothing until it ends', async () => {
        const gates: ((answer: Response) => void)[] = [];
        vi.stubGlobal('fetch', (url: string, init?: RequestInit) => {
            asked.push({ url, method: init?.method ?? 'GET', body: null });
            return new Promise<Response>((land) => gates.push(land));
        });
        const pressed = client.commands.press(REPO, 'build', 'file');
        await settle();
        expect(client.commands.asking()).toBeNull();
        expect(shownTerminals()).toEqual([]);
        gates[0](json({ approve: [MAKE] }));
        expect(await pressed).toBe(false);
        expect(client.commands.asking()).toEqual({
            kind: 'approve',
            repo: REPO,
            name: 'build',
            source: 'file',
            lines: [MAKE]
        });
    });

    it('starts nothing when the question is answered no, and clears it', async () => {
        serve(() => json({ approve: [MAKE] }));
        await client.commands.press(REPO, 'build', 'file');
        await client.commands.answer(false);
        expect(client.commands.asking()).toBeNull();
        expect(asked.map((call) => call.url)).toEqual(['/api/terminal']);
    });

    it('approves the asked lines, runs the command again, and shows the terminal it started', async () => {
        let ran = 0;
        serve((call) => {
            if (call.url === '/api/commands') return json({ ok: true });
            ran += 1;
            return ran === 1
                ? json({ approve: [MAKE] })
                : json({ ok: true, terminal: task({ id: 'd4e5f6-shell' }) });
        });
        await client.commands.press(REPO, 'build', 'file');
        await client.commands.answer(true);
        expect(asked.map((call) => call.url)).toEqual([
            '/api/terminal',
            '/api/commands',
            '/api/terminal'
        ]);
        expect(asked[1].body).toEqual({ action: 'approve', repo: REPO, chain: [MAKE] });
        expect(client.commands.asking()).toBeNull();
        expect(shownTerminals()).toEqual(['d4e5f6-shell']);
    });

    it('says the refusal of an approval and does not run the command', async () => {
        serve((call) =>
            call.url === '/api/commands'
                ? json({ error: 'approvals.json is not JSON' }, 400)
                : json({ approve: [MAKE] })
        );
        await client.commands.press(REPO, 'build', 'file');
        await client.commands.answer(true);
        expect(client.notices.list()[0]?.message).toBe('approvals.json is not JSON');
        expect(COMMAND_POSTS()).toHaveLength(1);
        expect(shownTerminals()).toEqual([]);
    });

    it('keeps the question of the later press when the answer of the earlier one arrives last', async () => {
        const gates: ((answer: Response) => void)[] = [];
        vi.stubGlobal('fetch', (url: string, init?: RequestInit) => {
            asked.push({ url, method: init?.method ?? 'GET', body: null });
            return new Promise<Response>((land) => gates.push(land));
        });
        const first = client.commands.press(REPO, 'build', 'file');
        const second = client.commands.press(REPO, 'test', 'file');
        await settle();
        gates[1](json({ approve: [{ folder: '.', run: 'make test' }] }));
        await second;
        gates[0](json({ approve: [MAKE] }));
        await first;
        expect(client.commands.asking()).toMatchObject({ kind: 'approve', name: 'test' });
    });

    it('shows the terminal of an earlier press whose answer arrives after a later one', async () => {
        const gates: ((answer: Response) => void)[] = [];
        vi.stubGlobal('fetch', (url: string, init?: RequestInit) => {
            asked.push({ url, method: init?.method ?? 'GET', body: null });
            return new Promise<Response>((land) => gates.push(land));
        });
        const first = client.commands.press(REPO, 'build', 'file');
        const second = client.commands.press(REPO, 'test', 'file');
        await settle();
        gates[1](json({ approve: [{ folder: '.', run: 'make test' }] }));
        await second;
        gates[0](json({ ok: true, terminal: task({ id: 'd4e5f6-shell' }) }));
        expect(await first).toBe(true);
        expect(shownTerminals()).toEqual(['d4e5f6-shell']);
        expect(client.commands.asking()).toMatchObject({ name: 'test' });
    });

    it('says a refused run on the notices and shows nothing', async () => {
        serve(() => json({ error: 'no value for ${file}' }, 400));
        expect(await client.commands.press(REPO, 'build', 'file')).toBe(false);
        expect(client.notices.list()[0]?.message).toBe('no value for ${file}');
        expect(client.commands.asking()).toBeNull();
    });

    it('asks to confirm a Restart naming the process, and posts the confirmation on a yes', async () => {
        let posted = 0;
        serve(() => {
            posted += 1;
            return posted === 1
                ? json({ confirm: 'make' })
                : json({ ok: true, id: 'a1b2c3-shell' });
        });
        expect(await client.commands.pressRestart('a1b2c3-shell')).toBe(false);
        expect(client.commands.asking()).toEqual({
            kind: 'restart',
            id: 'a1b2c3-shell',
            process: 'make'
        });
        await client.commands.answer(true);
        expect(asked[1].body).toEqual({ action: 'restart', id: 'a1b2c3-shell', confirmed: true });
        expect(client.commands.asking()).toBeNull();
    });

    it('posts the Restart confirmation of a terminal that left the list meanwhile and says its refusal', async () => {
        listTasks([task()]);
        let posted = 0;
        serve(() => {
            posted += 1;
            return posted === 1
                ? json({ confirm: 'make' })
                : json({ error: 'no such terminal' }, 404);
        });
        await client.commands.pressRestart('a1b2c3-shell');
        listTasks([], 2);
        await client.commands.answer(true);
        expect(client.notices.list()[0]?.message).toBe('no such terminal');
    });

    it('runs a Rerun at once and says its refusal', async () => {
        serve(() => json({ error: 'the line still runs' }, 400));
        expect(await client.commands.pressRerun('a1b2c3-shell')).toBe(false);
        expect(client.notices.list()[0]?.message).toBe('the line still runs');
        expect(client.commands.asking()).toBeNull();
        serve(() => json({ ok: true, id: 'a1b2c3-shell' }));
        expect(await client.commands.pressRerun('a1b2c3-shell')).toBe(true);
    });
});

describe('the file an error line names', () => {
    /** The roots the file routes serve, read once. */
    async function served(): Promise<void> {
        vi.stubGlobal('window', {});
        client.fs.workspaces();
        await settle();
    }

    function files(exists: (url: string) => boolean): void {
        serve((call) => {
            if (call.url === '/api/fs') return servedRoots();
            return exists(call.url) ? json({}) : json({ error: 'missing' }, 404);
        });
    }

    it('is the repository and the path under it for a file the source route finds', async () => {
        files(() => true);
        listTasks([task()]);
        await served();
        expect(await client.commands.errorFile('a1b2c3-shell', 'src/a.c')).toEqual({
            repo: REPO,
            path: 'src/a.c'
        });
        expect(await client.commands.errorFile('a1b2c3-shell', `${REPO}/src/b.c`)).toEqual({
            repo: REPO,
            path: 'src/b.c'
        });
    });

    it('is null for a file that does not exist, one outside the repository and the repository itself', async () => {
        files((url) => !url.includes('gone.c'));
        listTasks([task()]);
        await served();
        expect(await client.commands.errorFile('a1b2c3-shell', 'gone.c')).toBeNull();
        expect(await client.commands.errorFile('a1b2c3-shell', '../other/x.c')).toBeNull();
        expect(await client.commands.errorFile('a1b2c3-shell', '/etc/hosts')).toBeNull();
        expect(await client.commands.errorFile('a1b2c3-shell', REPO)).toBeNull();
    });

    it('is null for a terminal that is no task terminal or has left the list', async () => {
        files(() => true);
        listTasks([task({ task: false, job: null })]);
        await served();
        expect(await client.commands.errorFile('a1b2c3-shell', 'src/a.c')).toBeNull();
        listTasks([], 2);
        expect(await client.commands.errorFile('a1b2c3-shell', 'src/a.c')).toBeNull();
    });

    it('names the cwd the mark lists the command with as the folder a relative file is resolved from', () => {
        const job = { repo: REPO, name: 'build', chain: [{ name: 'build', cwd: `${REPO}/sub` }] };
        listTasks([task({ job })]);
        expect(client.commands.folderOf('a1b2c3-shell')).toBe(`${REPO}/sub`);
    });
});

describe('the writes and questions of the store while an answer is out', () => {
    beforeEach(() => {
        client.layout.loadLayout(fakeStorage());
    });

    /** A fetch that holds every request until the case lets it go. */
    function held(): ((answer: Response) => void)[] {
        const gates: ((answer: Response) => void)[] = [];
        vi.stubGlobal('fetch', (url: string, init?: RequestInit) => {
            asked.push({ url, method: init?.method ?? 'GET', body: null });
            return new Promise<Response>((land) => gates.push(land));
        });
        return gates;
    }

    it('reads the list again only once a save has been answered', async () => {
        const gates = held();
        client.commands.watch(REPO);
        client.commands.commands(REPO);
        await settle();
        gates[0](json(LISTED));
        await settle();
        const saving = client.commands.save(REPO, { name: 'lint', run: 'npm run lint' });
        await settle();
        expect(lists()).toHaveLength(1);
        gates[1](json({ ok: true }));
        await saving;
        await settle();
        expect(lists()).toHaveLength(2);
    });

    it('reads nothing after a save that is answered once its last view released the list', async () => {
        const gates = held();
        const release = client.commands.watch(REPO);
        client.commands.commands(REPO);
        await settle();
        gates[0](json(LISTED));
        await settle();
        const saving = client.commands.save(REPO, { name: 'lint', run: 'npm run lint' });
        await settle();
        release();
        await settle();
        gates[1](json({ ok: true }));
        expect(await saving).toEqual({ ok: true, error: '' });
        await settle();
        expect(lists()).toHaveLength(1);
        expect(client.commands.commands(REPO)).toBeNull();
    });

    it('keeps the list the later read gave when two saves are answered in the other order', async () => {
        const gates = held();
        client.commands.watch(REPO);
        client.commands.commands(REPO);
        await settle();
        gates[0](json(LISTED));
        await settle();
        const first = client.commands.save(REPO, { name: 'a', run: 'a' });
        const second = client.commands.save(REPO, { name: 'b', run: 'b' });
        await settle();
        gates[2](json({ ok: true }));
        await second;
        await settle();
        gates[1](json({ ok: true }));
        await first;
        await settle();
        const reads = gates.slice(3);
        expect(reads.length).toBeGreaterThan(0);
        const later = { commands: [LISTED.commands[1]], findings: [] };
        reads.at(-1)?.(json(later));
        await settle();
        for (const early of reads.slice(0, -1)) early(json(LISTED));
        await settle();
        expect(client.commands.commands(REPO)?.commands.map((one) => one.name)).toEqual(['test']);
    });

    it('does nothing for a yes when no question is held', async () => {
        serve(() => json({ ok: true }));
        await client.commands.answer(true);
        expect(asked).toEqual([]);
    });

    it('keeps the Restart question of the later press when the answer of the earlier one arrives last', async () => {
        const gates = held();
        const first = client.commands.pressRestart('a1b2c3-shell');
        const second = client.commands.pressRestart('d4e5f6-shell');
        await settle();
        gates[1](json({ confirm: 'make test' }));
        await second;
        gates[0](json({ confirm: 'make' }));
        await first;
        expect(client.commands.asking()).toEqual({
            kind: 'restart',
            id: 'd4e5f6-shell',
            process: 'make test'
        });
    });
});
