// Layer 2, client-state tests. The debugger's record is part of the server's page state: the
// breakpoints and watch expressions set on one page are on another page of the same server and on
// a page loaded after them, read from `debug.json` of the case's own state folder.
//
// Every page is a client over the page state stand-in (tests/fixtures/state-server.ts), which
// writes the files of a state folder of the case's own with the server's own write. What this does
// NOT cover: a launch carrying the lists to the adapter, and the route that carries a write.

import { describe, expect } from 'vitest';
import { engineDir, loadConfig, textCatalog } from '../../../src/lib/data/sources/config.ts';
import type { ClientState } from '../../../src/lib/state/client/context.ts';
import { setCatalog } from '../../../src/lib/state/shared/words/text.ts';
import { it } from '../../fixtures/scratch.ts';
import { stateServer } from '../../fixtures/state-server.ts';

setCatalog(textCatalog(loadConfig(engineDir()).config));

const FILE = '/repo/src/main.rite';

/** Let the answers and messages of the writes sent land. */
function settle(): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, 0));
}

/** The breakpoints and watch expressions a page's debugger shows. */
function lists(client: ClientState): { points: [string, number, boolean][]; watch: string[] } {
    return {
        points: client.debug.rows().map((row) => [row.path, row.line, row.enabled]),
        watch: client.debug.watchRows().map((row) => row.expression)
    };
}

describe("the debugger's record in the page state", () => {
    it('shows what one page sets on another page and on a page loaded after, from debug.json', async () => {
        const server = stateServer();
        const one = server.page();
        const two = server.page();
        one.debug.toggle(FILE, 7);
        one.debug.toggle(FILE, 3);
        one.debug.addWatch('total + 1');
        await settle();
        const shown = {
            points: [
                [FILE, 3, true],
                [FILE, 7, true]
            ],
            watch: ['total + 1']
        };
        expect(lists(two)).toEqual(shown);
        expect(lists(server.page())).toEqual(shown);
        expect(server.file('debug')).toEqual({
            version: 1,
            breakpoints: {
                [FILE]: [
                    { line: 3, enabled: true },
                    { line: 7, enabled: true }
                ]
            },
            functions: [],
            functionOptions: {},
            watch: ['total + 1'],
            chosen: {},
            toolbar: null
        });
    });

    it('takes a breakpoint and a watch another page removed out of every page', async () => {
        const server = stateServer();
        const one = server.page();
        const two = server.page();
        one.debug.toggle(FILE, 3);
        one.debug.addWatch('total');
        await settle();
        two.debug.remove(FILE, 3);
        two.debug.removeWatch(0);
        await settle();
        expect(lists(one)).toEqual({ points: [], watch: [] });
        expect(lists(server.page())).toEqual({ points: [], watch: [] });
    });
});
