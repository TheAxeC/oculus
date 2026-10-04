// Layer 2, client-state tests. The two requests the terminals store makes of /api/terminal that
// carry no state of their own (state/sessions/terminal/pty/pty-io.ts): the action posted with the
// write token, and the busy read. Each case states the body the stub `fetch` answers and what the
// request makes of it, for bodies of the right shape and for bodies whose fields are of the wrong
// type.
//
// What this does NOT cover: the store's use of the answers, which is
// tests/state/sessions/terminals.test.ts, pty-socket.test.ts beside this file and
// tests/state/client/terminal/.

import { afterEach, describe, expect, it, vi } from 'vitest';
import { setCatalog } from '../../../../../src/lib/state/shared/words/text.ts';
import { engineDir, loadConfig, textCatalog } from '../../../../../src/lib/data/sources/config.ts';
import {
    postTerminal,
    readBusy
} from '../../../../../src/lib/state/sessions/terminal/pty/pty-io.ts';
import { refused, unreadable } from '../../../../fixtures/client.ts';

setCatalog(textCatalog(loadConfig(engineDir()).config));

afterEach(() => {
    vi.unstubAllGlobals();
});

const A = 'a1b2c3-shell';

/** Replace `fetch` with a stub answering `text` with `status`. */
function answering(text: string, status = 200): void {
    vi.stubGlobal('fetch', () => Promise.resolve(new Response(text, { status })));
}

describe('the answer of an action posted to /api/terminal', () => {
    const BARE = { ok: true, id: '', error: '', terminal: undefined };

    it.each([
        [
            'a started terminal',
            `{"ok":true,"terminal":{"id":"${A}"}}`,
            { ok: true, id: A, error: '', terminal: { id: A } }
        ],
        ['an id', `{"ok":true,"id":"${A}"}`, { ok: true, id: A, error: '', terminal: undefined }],
        ['an empty map', '{}', BARE],
        ['an ok that is false', '{"ok":false}', BARE],
        ['a list', '[]', BARE]
    ])('is the terminal of %s in the body of a 200 to a stop', async (_name, text, expected) => {
        answering(text);
        expect(await postTerminal({ action: 'stop', id: A }, 't')).toStrictEqual(expected);
    });

    it.each([
        ['an id that is a number', '{"ok":true,"id":3}', ''],
        ['a terminal that is a string', '{"ok":true,"terminal":"x"}', ''],
        ['a terminal whose id is a number', '{"ok":true,"terminal":{"id":3}}', ''],
        ['a terminal that is a list beside an id', '{"ok":true,"terminal":[],"id":"z"}', 'z'],
        ['a terminal that is null beside an id', '{"ok":true,"terminal":null,"id":"z"}', 'z']
    ])('reads %s as an action that is ok, with no sentence', async (_name, text, id) => {
        answering(text);
        expect(await postTerminal({ action: 'stop', id: A }, 't')).toStrictEqual({
            ...BARE,
            id
        });
    });

    it('starts the terminal a start answers with an id', async () => {
        answering('{"terminal":{"id":"t1"}}');
        expect(await postTerminal({ action: 'start' }, 't')).toStrictEqual({
            ok: true,
            id: 't1',
            error: '',
            terminal: { id: 't1' }
        });
    });

    it.each([
        ['a terminal whose id is a number', '{"terminal":{"id":3}}'],
        ['a terminal whose id is empty', '{"terminal":{"id":""}}'],
        ['no terminal beside an id', `{"ok":true,"id":"${A}"}`]
    ])('fails a start answered at 200 with %s, in the unreadable sentence', async (_name, text) => {
        answering(text);
        expect(await postTerminal({ action: 'start' }, 't')).toStrictEqual({
            ok: false,
            id: '',
            error: unreadable(200)
        });
    });

    it('is the refusal sentence for a sentence in the body of a 500', async () => {
        answering('{"error":"x"}', 500);
        expect(await postTerminal({ action: 'start' }, 't')).toStrictEqual({
            ok: false,
            id: '',
            error: refused(500)
        });
    });

    it.each([
        ['text that is not JSON on a refusal', 'nope', 500],
        ['null', 'null', 200]
    ])(
        'is the unreadable sentence with its status for a body that is %s',
        async (_name, text, status) => {
            answering(text, status);
            expect(await postTerminal({ action: 'start' }, 't')).toStrictEqual({
                ok: false,
                id: '',
                error: unreadable(status)
            });
        }
    );
});

describe('the questions an action is answered with', () => {
    it('hands on the chain lines a run asked to have approved', async () => {
        answering('{"approve":[{"folder":".","run":"make"},{"folder":"sub","run":"make test"}]}');
        expect(await postTerminal({ action: 'command' }, 't')).toStrictEqual({
            ok: true,
            id: '',
            error: '',
            terminal: undefined,
            approve: [
                { folder: '.', run: 'make' },
                { folder: 'sub', run: 'make test' }
            ]
        });
    });

    it('hands on the process a Restart asked to have confirmed', async () => {
        answering('{"confirm":"make"}');
        expect(await postTerminal({ action: 'restart' }, 't')).toStrictEqual({
            ok: true,
            id: '',
            error: '',
            terminal: undefined,
            confirm: 'make'
        });
    });

    it('reads an approve list holding a number, and a confirm that is a number, as no question', async () => {
        answering('{"approve":[3],"confirm":3}');
        const answer = await postTerminal({ action: 'command' }, 't');
        expect(answer.approve).toBeUndefined();
        expect(answer.confirm).toBeUndefined();
    });
});

describe('the terminals a busy read names', () => {
    const IDS = ['a', 'b', 'c'];
    const label = (id: string) => `L${id}`;
    const FAILED = [
        { id: 'a', name: 'La', command: '' },
        { id: 'b', name: 'Lb', command: '' },
        { id: 'c', name: 'Lc', command: '' }
    ];

    it.each([
        [
            'items that are not busy, an id that is a number, and a null',
            '{"busy":[null,{"id":3},{"id":"a","busy":true,"command":"x"},{"id":"b","busy":false}]}',
            [{ id: 'a', name: 'La', command: 'x' }]
        ],
        ['a busy list that is a string', '{"busy":"x"}', []],
        ['a busy list that is null', '{"busy":null}', []],
        [
            'a busy item that lacks its command, and one whose busy is a string',
            '{"busy":[{"id":"a","busy":true},{"id":"b","busy":"yes","command":"x"}]}',
            [{ id: 'a', name: 'La', command: '' }]
        ],
        ['no busy list', '{}', []],
        ['a list as the body', '[]', []]
    ])('are the busy items of %s', async (_name, text, expected) => {
        answering(text);
        expect(await readBusy(IDS, label)).toStrictEqual(expected);
    });

    it.each([
        ['a refusal', '{}', 500],
        ['a refusal whose error is a number', '{"error":3}', 500],
        ['a busy list that is a map', '{"busy":{}}', 200],
        ['a busy list that is a number', '{"busy":3}', 200],
        ['a body that is null', 'null', 200],
        ['a body that is not JSON', 'nope', 200]
    ])('are every terminal of the group with no program for %s', async (_name, text, status) => {
        answering(text, status);
        expect(await readBusy(IDS, label)).toStrictEqual(FAILED);
    });

    it('names a terminal `always` picks even when the server says it is not busy', async () => {
        answering('{"busy":[{"id":"a","busy":false,"command":"zsh"},{"id":"b","busy":false}]}');
        expect(await readBusy(IDS, label, (id) => id === 'a')).toStrictEqual([
            { id: 'a', name: 'La', command: 'zsh' }
        ]);
    });
});
