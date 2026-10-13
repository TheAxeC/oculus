// Layer 2, client state test, in Svelte's client runtime because the request store takes a request
// in an effect. The commands of oculus's own that an app runs on a page
// (lib/state/system/apps/shell/page-commands.ts): `oculus.theme`, `oculus.crt`, `oculus.tab` and
// `oculus.goto`, and the `preserveFocus` that a terminal show is passed on with. These are the
// page's half of the `executeCommand` rows of G77: the page that has the focus takes the request
// and changes, and a page that has not is unchanged.
//
// The deps are doubles that record what the page was told, and `document.hasFocus` is a stub the
// test sets per page. What this does NOT cover: which page is asked first by the server
// (tests/server/machine/apps/shell/shell-commands.test.ts), and a real focus event.

import { flushSync } from 'svelte';
import { afterEach, describe, expect, vi } from 'vitest';
import type { AppRequest } from '../../../../src/lib/data/model/index.ts';
import { createRequests } from '../../../../src/lib/state/system/apps/shell/requests.svelte.ts';
import {
    runPageCommand,
    type PageCommandDeps
} from '../../../../src/lib/state/system/apps/shell/page-commands.ts';
import { it } from '../../../fixtures/scratch.ts';

/** The deps of one page and the changes made to it, in order. */
function page() {
    const told: string[] = [];
    let crt = false;
    const deps: PageCommandDeps = {
        themeNamed: (text) => (['light', 'dark'].includes(text) ? text : null),
        setTheme: (name) => void told.push(`theme ${name}`),
        crt: () => crt,
        setCrt: (on) => {
            crt = on;
            told.push(`crt ${on ? 'on' : 'off'}`);
        },
        hasView: (id) => id === 'projects',
        openView: (id) => void told.push(`view ${id}`),
        projectLabel: (id) => (id === 'alpha' ? 'Alpha' : null),
        openProject: (id, label) => void told.push(`project ${id} ${label}`)
    };
    return { deps, told };
}

describe('the page commands of oculus', () => {
    afterEach(() => vi.unstubAllGlobals());

    it('change the page that has the focus and no other page', async () => {
        const request: AppRequest = {
            id: 'r1',
            app: 'app:notes',
            kind: 'command',
            command: 'oculus.theme',
            args: ['light'],
            target: ''
        };
        const posts: unknown[] = [];
        /** A page whose store reads the focus the stub gives when the store is made. */
        const store = (id: string, focused: boolean) => {
            vi.stubGlobal('document', { hasFocus: () => focused });
            const one = page();
            const requests = createRequests({
                requests: () => [request],
                post: ((_path: string, body: unknown) => {
                    posts.push(body);
                    return Promise.resolve({ ok: true, status: 200, body: {}, failed: '' });
                }) as never,
                notices: {
                    post: () => 0,
                    update: () => undefined,
                    remove: () => undefined
                },
                pageId: id,
                pageCommand: (command, args) =>
                    Promise.resolve(runPageCommand(one.deps, command, args)),
                runInTab: () => Promise.resolve(null),
                openPanel: () => undefined,
                saveAll: () => Promise.resolve(true),
                showTerminal: () => undefined,
                hideTerminal: () => undefined
            });
            return { one, requests };
        };
        const first = store('p1', false);
        const second = store('p2', true);
        flushSync();
        await vi.waitFor(() => expect(posts).toHaveLength(1));
        expect([first.one.told, second.one.told]).toEqual([[], ['theme light']]);
        expect(posts).toEqual([
            { action: 'answer', id: 'r1', result: { ok: true, value: null }, page: 'p2' }
        ]);
    });

    it('runs the command and answers ok', () => {
        const { deps, told } = page();
        expect(runPageCommand(deps, 'oculus.theme', ['light'])).toEqual({ ok: true, value: null });
        expect(told).toEqual(['theme light']);
    });

    it.each([
        ['a theme that does not exist', 'oculus.theme', ['plaid']],
        ['a theme with no argument', 'oculus.theme', []],
        ['a crt state that is neither on nor off', 'oculus.crt', ['dim']],
        ['a view that does not exist', 'oculus.tab', ['nope']],
        ['a project that does not exist', 'oculus.goto', ['gamma']]
    ])('refuse %s and change nothing', (_row, id, args) => {
        const { deps, told } = page();
        expect(runPageCommand(deps, id, args)).toEqual({
            ok: false,
            word: 'refused:argument'
        });
        expect(told).toEqual([]);
    });

    it.each([
        ['turns the crt on', 'oculus.crt', ['on'], 'crt on'],
        ['toggles the crt with no argument', 'oculus.crt', [], 'crt on'],
        ['opens a view', 'oculus.tab', ['projects'], 'view projects'],
        ['opens a project by its title', 'oculus.goto', ['alpha'], 'project alpha Alpha']
    ])('%s', (_row, id, args, change) => {
        const { deps, told } = page();
        expect(runPageCommand(deps, id, args)).toEqual({ ok: true, value: null });
        expect(told).toEqual([change]);
    });

    it('answers `missing` for an id that is no page command', () => {
        const { deps } = page();
        expect(runPageCommand(deps, 'oculus.update', [])).toEqual({
            ok: false,
            word: 'missing'
        });
    });
});

describe('the show of a terminal an app asks for', () => {
    afterEach(() => vi.unstubAllGlobals());

    it.each([true, false])('is passed to the page with preserveFocus %s', async (preserveFocus) => {
        vi.stubGlobal('document', { hasFocus: () => true });
        const shown: [string, boolean][] = [];
        const posts: unknown[] = [];
        createRequests({
            requests: () => [
                {
                    id: 'r1',
                    app: 'app:notes',
                    kind: 'showTerminal',
                    terminal: 'a1b2c3-app',
                    preserveFocus
                }
            ],
            post: ((_path: string, body: unknown) => {
                posts.push(body);
                return Promise.resolve({ ok: true, status: 200, body: {}, failed: '' });
            }) as never,
            notices: { post: () => 0, update: () => undefined, remove: () => undefined },
            pageId: 'p1',
            pageCommand: () => Promise.resolve({ ok: true, value: null }),
            runInTab: () => Promise.resolve(null),
            openPanel: () => undefined,
            saveAll: () => Promise.resolve(true),
            showTerminal: (terminal, keep) => void shown.push([terminal, keep]),
            hideTerminal: () => undefined
        });
        flushSync();
        await vi.waitFor(() => expect(posts).toHaveLength(1));
        expect(shown).toEqual([['a1b2c3-app', preserveFocus]]);
    });
});
