// Layer 2, route tests. What the /api/write route answers. The route itself is a single line
// handing the request to lib/server/edit/writes.ts with the token ServerContext minted, which is
// what this calls: handleWrite takes a Request, the token and the hub to write in, so every case
// here is one Request object.
//
// The hub is synthetic, under the system temporary directory, and every path written is asserted to
// be inside it first. What this does NOT cover: the token actually reaching the page, and Kit
// putting it on the event.
//
// A hook loads the configuration once, since the first load costs more than a later one, so no case
// pays for it.

import { describe, expect } from 'vitest';
import { parse } from 'yaml';
import { handleWrite } from '../../../src/lib/server/edit/writes.ts';
import {
    GOOD,
    MANIFEST,
    TOKEN,
    deckOf,
    deckTarget,
    manifestOf,
    overridesOf,
    request,
    target,
    warmConfig
} from './write-fixture.ts';
import { it, test } from '../../fixtures/scratch.ts';

test.beforeAll(warmConfig);

describe('the write endpoint', () => {
    it('refuses a request with no token', async () => {
        const into = target();
        const response = await handleWrite(request(GOOD, { 'x-oculus-token': '' }), TOKEN, into);
        expect(response.status).toBe(403);
        expect(await response.json()).toEqual({ error: 'the write token is missing or stale' });
        expect(manifestOf(into)).toBe(MANIFEST);
    });

    it('writes the field and says what changed', async () => {
        const into = target();
        const response = await handleWrite(request(GOOD), TOKEN, into);
        expect(response.status).toBe(200);
        expect(await response.json()).toEqual({ ok: true, changed: ['status.line'], refused: [] });
        expect(manifestOf(into)).toBe(MANIFEST.replace('"the line"', '"a new line"'));
    });

    it('pins a session to the top of its group through the route, and takes it off', async () => {
        const into = target();
        const pin = { kind: 'session', id: 'sess-1', top: true, title: 'my name' };
        const response = await handleWrite(request(pin), TOKEN, into);
        expect(await response.json()).toEqual({
            ok: true,
            changed: ['top', 'title'],
            refused: []
        });
        expect(overridesOf(into)).toEqual({
            sessions: { 'sess-1': { top: true, title: 'my name' } }
        });
        const off = { kind: 'session', id: 'sess-1', top: false };
        expect((await handleWrite(request(off), TOKEN, into)).status).toBe(200);
        expect(overridesOf(into)).toEqual({ sessions: { 'sess-1': { title: 'my name' } } });
        // A top that is no boolean refuses the whole body, the valid title beside it included.
        const wrong = { kind: 'session', id: 'sess-1', top: 'yes', title: 'other' };
        expect((await handleWrite(request(wrong), TOKEN, into)).status).toBe(400);
        expect(overridesOf(into)).toEqual({ sessions: { 'sess-1': { title: 'my name' } } });
    });
});

describe('the deck write', () => {
    it('writes both lists into the deck file and keeps every other byte of it', async () => {
        const into = deckTarget();
        const order = ['title', 'alpha', 'framing:engine', 'gamma', 'closing'];
        const response = await handleWrite(
            request({ kind: 'deck', selection: ['title', 'alpha'], order }),
            TOKEN,
            into
        );
        expect(response.status).toBe(200);
        expect(await response.json()).toEqual({ ok: true, changed: ['deck'], refused: [] });
        const written = deckOf(into);
        const deck = (parse(written) as { deck: Record<string, unknown> }).deck;
        expect(deck.selection).toEqual(['title', 'alpha']);
        expect(deck.slide_order).toEqual(order);
        expect(written).toContain("    # the deck's own slides, in the order it shows them\n");
        expect(written).toContain("        engine: { title: 'The common engine' }\n");
    });
});
