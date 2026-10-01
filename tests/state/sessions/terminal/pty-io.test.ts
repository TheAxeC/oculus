// Layer 4, test. The two requests the terminals store makes of /api/terminal that carry no state
// of their own (state/sessions/terminal/pty-io.ts): the action posted with the write token, and
// the busy read. Each case states the body the stub `fetch` answers and what the request makes of
// it, for bodies of the right shape and for bodies whose fields are of the wrong type.
//
// What this does NOT cover: the store's use of the answers, which is
// tests/state/sessions/terminals.test.ts and tests/state/client/terminal/.

import { afterEach, describe, expect, it, vi } from 'vitest';
import { postTerminal, readBusy } from '../../../../src/lib/state/sessions/terminal/pty-io.ts';

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
    ])('is the terminal of %s in the body of a 200', async (_name, text, expected) => {
        answering(text);
        expect(await postTerminal({ action: 'start' }, 't')).toStrictEqual(expected);
    });

    it.each([
        ['an id that is a number', '{"ok":true,"id":3}', ''],
        ['a terminal that is a string', '{"ok":true,"terminal":"x"}', ''],
        ['a terminal whose id is a number', '{"ok":true,"terminal":{"id":3}}', ''],
        ['a terminal that is a list beside an id', '{"ok":true,"terminal":[],"id":"z"}', 'z'],
        ['a terminal that is null beside an id', '{"ok":true,"terminal":null,"id":"z"}', 'z']
    ])('reads %s as a started action with no sentence', async (_name, text, id) => {
        answering(text);
        expect(await postTerminal({ action: 'start' }, 't')).toStrictEqual({
            ...BARE,
            id
        });
    });

    it.each([
        ['an error that is a number', '{"error":3}', '500'],
        ['a sentence', '{"error":"x"}', 'x'],
        ['an empty sentence', '{"error":""}', ''],
        ['a list', '[]', '500']
    ])('is the refusal of %s in the body of a 500', async (_name, text, error) => {
        answering(text, 500);
        expect(await postTerminal({ action: 'start' }, 't')).toStrictEqual({
            ok: false,
            id: '',
            error
        });
    });

    it.each([
        ['null on a refusal', 'null', 500, { ok: false, id: '', error: '500' }],
        ['text that is not JSON on a refusal', 'nope', 500, { ok: false, id: '', error: '500' }],
        ['null', 'null', 200, { ok: false, id: '', error: '200' }],
        ['text that is not JSON', 'nope', 200, { ok: false, id: '', error: '200' }]
    ])(
        'is the failed read with the status text for a body that is %s',
        async (_name, text, status, expected) => {
            answering(text, status);
            expect(await postTerminal({ action: 'start' }, 't')).toStrictEqual(expected);
        }
    );
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
            'items that are not busy, and an id that is a number',
            '{"busy":[{"id":3},{"id":"a","busy":true,"command":"x"},{"id":"b","busy":false}]}',
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

    it('leaves out an item that is null and names the busy ones that follow it', async () => {
        answering('{"busy":[null,{"id":3},{"id":"a","busy":true,"command":"x"}]}');
        expect(await readBusy(IDS, label)).toStrictEqual([{ id: 'a', name: 'La', command: 'x' }]);
    });
});
