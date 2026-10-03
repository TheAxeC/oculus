// Layer 3, view test. When the Files view asks a repository for its commands, run in Svelte's
// client runtime (tests/ui/frame/client-runtime.ts) where the effects of the picks run: a tree
// that draws three repository rows asks for none of their commands, the menu opened on one asks
// for that repository's alone, and the Run Command items join the menu when the answer arrives. An
// answer that arrives after another menu was opened, or after the menu closed, changes only the
// items of the menu it was asked for.
//
// What this does NOT cover: the menu opened by a pointer, which needs a DOM and is seen on screen.

import { flushSync } from 'svelte';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { engineDir, loadConfig, textCatalog } from '../../../../../src/lib/data/sources/config.ts';
import { setCatalog } from '../../../../../src/lib/state/shared/words/text.ts';
import type { TreeRow } from '../../../../../src/lib/state/sources/fs.ts';
import { ROW_RUN } from '../../../../../src/lib/views/shared/explorer/tree/menu/row-menu.ts';
import { createPicks } from '../../../../../src/lib/views/shared/explorer/tree/control/picks.svelte.ts';
import { viewAccess } from '../../../../../src/lib/views/shared/explorer/tree/control/view-access.ts';
import { createClientState, json, settle, type ClientState } from '../../../../fixtures/client.ts';
import { git } from '../../../../fixtures/sessions-fixture.ts';
import { inRoot, reading } from './picks-root.svelte.ts';

setCatalog(textCatalog(loadConfig(engineDir()).config));

const REPOS = ['alpha', 'beta', 'gamma'];

const row = (path: string): TreeRow => ({
    root: 'hub',
    path,
    name: path,
    kind: 'dir',
    size: 0,
    depth: 1,
    open: false
});

const ROWS = REPOS.map(row);
const OPEN = { target: null } as unknown as MouseEvent;

let client: ClientState;
let asked: string[] = [];
let answers: Record<string, (answer: Response) => void> = {};

beforeEach(() => {
    vi.stubGlobal('window', {});
    client = createClientState();
    asked = [];
    answers = {};
    vi.stubGlobal('fetch', (url: string) => {
        asked.push(url);
        return new Promise<Response>((land) => {
            answers[url] = land;
        });
    });
    client.entities.receive({
        channel: 'git',
        version: 1,
        payload: Object.fromEntries(REPOS.map((one) => [`/r/hub/${one}`, git()]))
    });
});

afterEach(() => vi.unstubAllGlobals());

function picked() {
    const view = viewAccess(client, () => 'files-1');
    return inRoot(() =>
        createPicks({
            client,
            view,
            asking: {
                ask: () => Promise.resolve(false),
                asked: () => null,
                answered: () => undefined,
                choose: () => Promise.resolve([]),
                chosen: () => undefined
            },
            rows: () => ROWS,
            roots: () => [{ key: 'hub', dir: '/r/hub', fixed: true }],
            fixed: () => [],
            addable: () => false,
            addRoot: () => undefined,
            removeRoot: () => undefined,
            hints: {},
            isSelected: () => true,
            select: () => undefined
        })
    );
}

const listed = (name: string) => ({
    commands: [{ name, run: `make ${name}`, cwd: '/r/hub', depends_on: [], source: 'file' }],
    findings: []
});

const commandsAsked = () => asked.filter((url) => url.startsWith('/api/commands'));
const runItems = (items: { id: string; items?: { label: string }[] }[]) =>
    items.find((item) => item.id === ROW_RUN)?.items?.map((item) => item.label);

describe('the commands of the repositories the Files view draws', () => {
    it('audits that three repository rows drawn ask for none of their commands, and hold none', async () => {
        const { stop } = picked();
        flushSync();
        await settle();
        expect(commandsAsked()).toEqual([]);
        // A view that reads a list is answered from the network only while some view watches it, so
        // a read of each drawn repository's list asks for it exactly when the tree watches them.
        const stopReading = reading(() => {
            for (const one of REPOS) client.commands.commands(`/r/hub/${one}`);
        });
        flushSync();
        await settle();
        expect(commandsAsked()).toEqual([]);
        stopReading();
        stop();
    });

    it('audits that the menu of a row asks for its repository once, and gains its Run Command items', async () => {
        const { value: picks, stop } = picked();
        flushSync();
        const items = picks.menuOf(ROWS[1], OPEN);
        expect(runItems(items)).toBeUndefined();
        expect(commandsAsked()).toHaveLength(1);
        expect(commandsAsked()[0]).toContain(encodeURIComponent('/r/hub/beta'));
        answers[commandsAsked()[0]](json(listed('build')));
        await settle();
        flushSync();
        expect(runItems(items)).toEqual(['build']);
        stop();
    });

    it('audits that the menu of a row that is no repository asks for nothing', async () => {
        const { value: picks, stop } = picked();
        const file: TreeRow = { ...row('notes.md'), kind: 'file' };
        picks.menuOf(file, OPEN);
        await settle();
        expect(commandsAsked()).toEqual([]);
        stop();
    });

    it('audits that each menu gets the answer asked for it when a second menu opened first', async () => {
        const { value: picks, stop } = picked();
        const first = picks.menuOf(ROWS[0], OPEN);
        const second = picks.menuOf(ROWS[2], OPEN);
        const [one, two] = commandsAsked();
        answers[two](json(listed('second')));
        await settle();
        answers[one](json(listed('first')));
        await settle();
        flushSync();
        expect(runItems(first)).toEqual(['first']);
        expect(runItems(second)).toEqual(['second']);
        stop();
    });

    it('audits that a late answer lands in the items of the menu it was asked for, closed or not', async () => {
        const { value: picks, stop } = picked();
        const items = picks.menuOf(ROWS[0], OPEN);
        stop();
        answers[commandsAsked()[0]](json(listed('late')));
        await settle();
        expect(runItems(items)).toEqual(['late']);
    });
});
