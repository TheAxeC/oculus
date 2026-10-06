// Layer 4, server test. The decisions the desktop host makes before it lets a window do anything,
// each a pure function of its inputs that imports nothing from electron: where an address goes,
// which sender the bridge answers, which permission a page is granted, and the web preferences
// every window is made with.

import { describe, expect, it } from 'vitest';
import { linkDecision, movedPort } from '../../../src/desktop/decide/links.ts';
import { permissionGranted } from '../../../src/desktop/decide/permissions.ts';
import { mayCall, senderOf } from '../../../src/desktop/decide/sender.ts';
import { windowPreferences } from '../../../src/desktop/decide/window-options.ts';
import {
    CLOSE_FIND,
    FIND,
    OPEN_FLOAT_WINDOW,
    SAVE_LAYOUT,
    STOP_FIND
} from '../../../src/desktop/decide/channels.ts';

const ORIGIN = 'http://127.0.0.1:8817';

describe('the desktop host decisions', () => {
    it('sends each address where the link decision says', () => {
        const where = (address: string) => linkDecision(address, ORIGIN);
        expect(where(`${ORIGIN}/`)).toEqual({ kind: 'main' });
        expect(where(`${ORIGIN}/?float=f1`)).toEqual({ kind: 'float', id: 'f1' });
        expect(where(`${ORIGIN}/api/file/hub/a.pdf`)).toEqual({ kind: 'browser' });
        expect(where('https://example.org/')).toEqual({ kind: 'browser' });
        expect(where('mailto:a@b.c')).toEqual({ kind: 'browser' });
        expect(where('file:///etc/hosts')).toEqual({ kind: 'refused' });
        expect(where('javascript:alert(1)')).toEqual({ kind: 'refused' });
        expect(where('not an address')).toEqual({ kind: 'refused' });
        expect(where('http://127.0.0.1:8790/')).toEqual({ kind: 'browser' });
        expect(where('http://localhost:8817/')).toEqual({ kind: 'browser' });
        expect(where(`${ORIGIN}/?float=f1&x=1`)).toEqual({ kind: 'browser' });
        expect(movedPort('http://127.0.0.1:8819/', ORIGIN)).toBe(8819);
        expect(movedPort('http://127.0.0.1:8819/?float=f1', ORIGIN)).toBe(8819);
        expect(movedPort(`${ORIGIN}/`, ORIGIN)).toBeNull();
        expect(movedPort('http://localhost:8819/', ORIGIN)).toBeNull();
        expect(movedPort('https://127.0.0.1:8819/', ORIGIN)).toBeNull();
    });

    it("answers the bridge only from the top frame of the server's page", () => {
        const top = { origin: ORIGIN, isTop: true, pathname: '/' };
        expect(senderOf(top, ORIGIN)).toBe('page');
        expect(senderOf({ ...top, isTop: false }, ORIGIN)).toBeNull();
        expect(senderOf({ ...top, origin: 'https://example.org' }, ORIGIN)).toBeNull();
        expect(senderOf({ ...top, origin: 'http://127.0.0.1:8790' }, ORIGIN)).toBeNull();
        expect(senderOf({ ...top, pathname: '/find' }, ORIGIN)).toBe('find-bar');
        expect(senderOf({ ...top, pathname: '/find', isTop: false }, ORIGIN)).toBeNull();
        expect(
            senderOf({ ...top, pathname: '/find', origin: 'https://example.org' }, ORIGIN)
        ).toBeNull();
        expect(mayCall('page', SAVE_LAYOUT)).toBe(true);
        expect(mayCall('find-bar', FIND)).toBe(true);
        expect(mayCall('find-bar', STOP_FIND)).toBe(true);
        expect(mayCall('find-bar', CLOSE_FIND)).toBe(true);
        expect(mayCall('find-bar', OPEN_FLOAT_WINDOW)).toBe(false);
        expect(mayCall('find-bar', SAVE_LAYOUT)).toBe(false);
        expect(mayCall(null, FIND)).toBe(false);
    });

    it("grants clipboard and full screen to the server's page alone and denies every other ask", () => {
        for (const permission of ['clipboard-read', 'clipboard-sanitized-write', 'fullscreen']) {
            expect(permissionGranted(permission, ORIGIN, ORIGIN)).toBe(true);
            expect(permissionGranted(permission, 'https://example.org', ORIGIN)).toBe(false);
        }
        for (const permission of [
            'media',
            'geolocation',
            'notifications',
            'openExternal',
            'midi'
        ]) {
            expect(permissionGranted(permission, ORIGIN, ORIGIN)).toBe(false);
            expect(permissionGranted(permission, 'https://example.org', ORIGIN)).toBe(false);
        }
    });

    it('makes every window with Node integration off and isolation and the sandbox on, subframes included', () => {
        expect(windowPreferences('/x/preload.cjs')).toEqual({
            contextIsolation: true,
            sandbox: true,
            nodeIntegration: false,
            nodeIntegrationInSubFrames: false,
            webSecurity: true,
            spellcheck: true,
            preload: '/x/preload.cjs'
        });
    });
});
